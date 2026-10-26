"""The gate's rules: scope collection, per-language plans, verdicts, ratchet."""

import json
import subprocess
from pathlib import Path

import pytest

from codecheck.gate import cli, collect, plan, verdict
from codecheck.gate.run import BROKEN, PASS, SKIP, THRESHOLD, UNMEASURED, CrapResult, Passes


def write(root: Path, name: str, text: str = "x = 1\n") -> Path:
    path = root / name
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(text, encoding="utf-8")
    return path


def git(root: Path, *args: str) -> None:
    subprocess.run(["git", "-C", str(root), *args], check=True, capture_output=True)


def init_repo(root: Path) -> None:
    git(root, "init", "-q")
    git(root, "config", "user.email", "t@example.com")
    git(root, "config", "user.name", "T")


# ---------------------------------------------------------------- collect


def test_files_are_grouped_by_language_and_tests_kept_separately(tmp_path):
    write(tmp_path, "src/app.py")
    write(tmp_path, "web/ui.ts")
    write(tmp_path, "tests/test_app.py")
    write(tmp_path, "node_modules/pkg/index.js")
    init_repo(tmp_path)

    scope = collect.collect(tmp_path)

    assert scope.by_language["python"] == ["src/app.py"]
    assert scope.by_language["typescript"] == ["web/ui.ts"]
    assert scope.tests_by_language["python"] == ["tests/test_app.py"]
    assert scope.languages == ["typescript", "python"]
    assert scope.all_files == 2


def test_the_ignore_file_removes_a_vendored_tree(tmp_path):
    write(tmp_path, "app.py")
    write(tmp_path, "vendor/lib/dep.py")
    write(tmp_path, ".check-code-ignore", "# vendored\nvendor/\n")
    init_repo(tmp_path)

    scope = collect.collect(tmp_path)

    assert scope.files == ["app.py"]


def test_a_language_filter_that_matches_nothing_is_an_error(tmp_path):
    write(tmp_path, "app.py")

    with pytest.raises(collect.ScopeError, match="no source files in scope"):
        collect.collect(tmp_path, languages={"rust"})


def test_changed_scope_reads_the_working_tree(tmp_path):
    write(tmp_path, "app.py")
    init_repo(tmp_path)
    git(tmp_path, "add", "-A")
    git(tmp_path, "commit", "-qm", "first")
    write(tmp_path, "later.py")
    write(tmp_path, "app.py", "y = 2\n")

    scope = collect.collect(tmp_path, scope="changed")

    assert sorted(scope.files) == ["app.py", "later.py"]


def test_an_unknown_ref_is_a_scope_error(tmp_path):
    write(tmp_path, "app.py")
    init_repo(tmp_path)

    with pytest.raises(collect.ScopeError, match="unknown ref"):
        collect.collect(tmp_path, scope="changed", since="no-such-ref")


# ---------------------------------------------------------------- plan


def test_python_without_tests_has_no_coverage_plan(tmp_path):
    write(tmp_path, "app.py")
    scope = collect.collect(tmp_path)

    assert plan.coverage_plan(scope, "python", None) in (plan.NONE, "uv run --no-project --with coverage --with pytest python -m coverage run")


def test_python_with_tests_pins_one_command(tmp_path):
    write(tmp_path, "app.py")
    write(tmp_path, "tests/test_app.py")
    scope = collect.collect(tmp_path)

    chosen = plan.coverage_plan(scope, "python", None)

    if plan.python_interpreter(tmp_path) is None:
        assert chosen == plan.NONE
    else:
        assert "-m coverage run" in chosen and "lcov.info" in chosen


def test_typescript_without_a_runner_cannot_be_measured(tmp_path):
    write(tmp_path, "ui.ts")
    write(tmp_path, "package.json", json.dumps({"name": "x"}))
    scope = collect.collect(tmp_path)

    assert plan.coverage_plan(scope, "typescript", None) == plan.NONE


def test_a_typescript_test_script_is_enough(tmp_path):
    write(tmp_path, "ui.ts")
    write(tmp_path, "package.json", json.dumps({"scripts": {"test": "vitest run"}}))
    scope = collect.collect(tmp_path)

    assert plan.coverage_plan(scope, "typescript", None) == plan.BUILTIN


def test_a_coverage_override_wins_for_every_language(tmp_path):
    write(tmp_path, "app.py")
    scope = collect.collect(tmp_path)

    assert plan.coverage_plan(scope, "python", "make cov") == "make cov"
    assert plan.test_plan(scope, "python", "make test") == "make test"


# ---------------------------------------------------------------- verdicts


def crap(**kwargs) -> CrapResult:
    base = dict(language="python", entries=3, worst=5.0, max_complexity=4, uncovered=0, unmeasured=0, status=PASS)
    base.update(kwargs)
    return CrapResult(**base)


def test_a_score_over_the_threshold_is_blocking_and_names_the_metric():
    finding = verdict.crap_findings([crap(worst=31.0, status=THRESHOLD, detail="over 10")])[0]
    assert finding.blocking is True
    assert "threshold" == finding.status
    assert "worst CRAP 31.0" in finding.label


def test_zero_coverage_everywhere_is_broken_not_a_pass():
    finding = verdict.crap_findings([crap(uncovered=3, status=BROKEN, detail="coverage 0% everywhere")])[0]
    assert finding.blocking is True
    assert finding.status == BROKEN


def test_no_coverage_is_unmeasured_and_only_blocking_when_required():
    result = crap(unmeasured=3, status=PASS, detail="coverage unmeasured")
    assert verdict.crap_findings([result])[0].blocking is False
    assert verdict.crap_findings([crap(unmeasured=3, status=UNMEASURED)])[0].blocking is True


def test_a_language_with_no_functions_is_skipped():
    assert verdict.crap_findings([crap(entries=0, status=SKIP)])[0].status == SKIP


def test_dupes_fail_above_the_budget_and_pass_at_it():
    assert verdict.dupes_finding(2, 0, 0).blocking is True
    assert verdict.dupes_finding(2, 2, 0).blocking is False


def test_mutation_fails_on_a_survivor_and_on_nothing_measured():
    assert verdict.mutants_finding(4, 1, 0, 3).status == "fail"
    assert verdict.mutants_finding(0, 0, 7, 0).status == "fail"
    assert verdict.mutants_finding(4, 0, 0, 0).status == PASS


# ---------------------------------------------------------------- ratchet


def passes(**kwargs) -> Passes:
    base = Passes()
    base.crap = [crap(worst=6.0)]
    base.coverage_seen = True
    base.dupes = 2
    base.mutants_ran = True
    base.mutants_killed = 10
    base.mutants_survived = 0
    for key, value in kwargs.items():
        setattr(base, key, value)
    return base


def test_the_ratchet_seeds_a_baseline_then_passes_against_it(tmp_path):
    baseline = tmp_path / "docs" / "check-code-baseline.json"

    seeded = verdict.ratchet(
        passes(), root=tmp_path, baseline=baseline, coverage_command=None,
        scope_is_full=True, update=True,
    )
    assert seeded.status == PASS
    saved = json.loads(baseline.read_text())
    assert saved["worst_crap"] == 6.0 and saved["dupes"] == 2

    compared = verdict.ratchet(
        passes(), root=tmp_path, baseline=baseline, coverage_command=None,
        scope_is_full=True, update=False,
    )
    assert compared.status == PASS


def test_a_worse_number_fails_even_when_the_threshold_passes(tmp_path):
    baseline = tmp_path / "check-code-baseline.json"
    verdict.ratchet(passes(), root=tmp_path, baseline=baseline, coverage_command=None,
                    scope_is_full=True, update=True)

    worse = verdict.ratchet(
        passes(crap=[crap(worst=9.0)]), root=tmp_path, baseline=baseline,
        coverage_command=None, scope_is_full=True, update=False,
    )

    assert worse.blocking is True
    assert "worst CRAP 9.0 > 6.0" in worse.label


def test_a_different_coverage_command_cannot_be_compared(tmp_path):
    baseline = tmp_path / "check-code-baseline.json"
    verdict.ratchet(passes(), root=tmp_path, baseline=baseline, coverage_command=None,
                    scope_is_full=True, update=True)

    finding = verdict.ratchet(
        passes(crap=[crap(worst=9.0)]), root=tmp_path, baseline=baseline,
        coverage_command="bun test", scope_is_full=True, update=False,
    )

    assert finding.status == SKIP
    assert "different coverage command" in finding.label


def test_a_partial_scope_never_seeds_or_compares(tmp_path):
    baseline = tmp_path / "check-code-baseline.json"
    finding = verdict.ratchet(passes(), root=tmp_path, baseline=baseline, coverage_command=None,
                              scope_is_full=False, update=False)
    assert finding.status == SKIP
    assert not baseline.exists()


def test_a_broken_run_cannot_seed_a_baseline(tmp_path):
    baseline = tmp_path / "check-code-baseline.json"
    finding = verdict.ratchet(passes(broken=True), root=tmp_path, baseline=baseline,
                              coverage_command=None, scope_is_full=True, update=True)
    assert finding.status == SKIP
    assert not baseline.exists()


def test_unmeasured_metrics_stay_null_and_are_skipped_on_compare(tmp_path):
    baseline = tmp_path / "check-code-baseline.json"
    unmeasured = passes(coverage_seen=False, mutants_ran=False)
    verdict.ratchet(unmeasured, root=tmp_path, baseline=baseline, coverage_command=None,
                    scope_is_full=True, update=True)
    saved = json.loads(baseline.read_text())
    assert saved["worst_crap"] is None and saved["mutants_survivors"] is None

    finding = verdict.ratchet(
        passes(crap=[crap(worst=99.0)], mutants_survived=5), root=tmp_path, baseline=baseline,
        coverage_command=None, scope_is_full=True, update=False,
    )
    assert finding.status == PASS


# ---------------------------------------------------------------- summary + CLI


def test_the_summary_counts_green_and_blocking_lines():
    passed, line = verdict.summarize(
        [verdict.Finding(PASS, "a"), verdict.Finding(THRESHOLD, "b"), verdict.Finding(SKIP, "c")]
    )
    assert passed is False
    assert line == "FAIL  1 green, 1 blocking"


def test_gate_commands_map_to_their_legacy_names():
    assert cli.parse_args(["complexity"]).command == "crap"
    assert cli.parse_args(["dry"]).command == "dupes"
    assert cli.parse_args(["mutate"]).command == "mutants"
    assert cli.parse_args(["review"]).evidence is True


def test_an_unknown_gate_command_is_a_usage_error():
    with pytest.raises(cli.UsageError, match="unknown gate command"):
        cli.parse_args(["nope"])


def test_a_run_reports_a_duplicate_and_writes_evidence(tmp_path, capsys):
    write(tmp_path, "app.py", "def a(xs):\n    return sum(xs)\n")
    init_repo(tmp_path)
    git(tmp_path, "add", "-A")
    git(tmp_path, "commit", "-qm", "first")

    code = cli.run(["dupes", "--root", str(tmp_path), "--langs", "python", "--evidence"])

    captured = capsys.readouterr()
    assert code == 0
    assert "dupes:" in captured.out
    evidence = list((tmp_path / ".dev" / "audit" / "evidence").glob("check-code-*.txt"))
    assert len(evidence) == 1
    assert "gate:" in evidence[0].read_text()
