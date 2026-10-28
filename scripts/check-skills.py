#!/usr/bin/env python3
"""Static acceptance for the pi-dev-mode skill tree.

Validated, in order:
  1. frontmatter on every skills/*/SKILL.md and agents/*.md parses as YAML
     (a regex frontmatter check let a broken quoted description through once —
     see benchmark-checklist's P2.1 changelog)
  2. name present and equals the skill's directory name (skills only)
  3. description present and non-empty; model-invoked descriptions carry
     Chinese triggers and stay under the 120-word pointer budget (user-invoked
     descriptions are human-facing: no trigger list, no budget)
  4. H1 agrees with the frontmatter name: normalize (lowercase alphanumerics,
     drop a/an/the from the H1), then name must equal or be contained in the
     H1 (the P5.2/P6 renames once left three stale H1s behind — # Tasks,
     # Align, # Use the Stack — nothing caught them)
  5. no duplicated long paragraph (>=80 chars, verbatim): a P0 audit found
     one in grill-me riding as tokens on every firing
  6. no clause (>=14 normalized words) repeated across two skills: the
     duplicate-paragraph pass above keeps `seen` inside one file, so cross-file
     boilerplate (the tracker-bootstrap oath sat in five skills) rode unseen
  7. cross-references on every authored surface (skills, agents, package
     README, references/, hooks/, gates/): a backtick `skill-name` token
     directly adjacent to "skill/技能" must resolve to an existing skill
     directory or be a mounted upstream name (see check 9), and must never
     be a RETIRED name (died in the P5.2/P6 rename waves: issues, tasks,
     wayfinder, align, use-the-stack, prd). references/README.md once
     mapped `spec → issues` for weeks because the scan stopped at skills/.
  8. pointer files in skill bodies: backticked or md-linked paths under this
     package's own trees (references/ scripts/ gates/ skills/ agents/
     adapters/ hooks/ pi/ evals/) resolve from the skill's own directory or
     the package root. Target-repo placeholders (docs/GLOSSARY.md, .dev/*,
     .pi/*) are deliberately out of scope — those name the USER's repo.
     A tool that only resolves at the package root (gates/gate.sh,
     scripts/check-code.sh, …) must be qualified "this package's …": bare, it
     reads as a target-repo path that does not exist there.
  9. phantom agents (the drift class of 2026-10-22's audit, caught alive:
     skills taught `ask_user` (real tool: ask_user_question) and a `viewer`
     agent type this package never registers (it ships image-reader)):
     - a backticked token directly adjacent to "skill/技能" must be an
       existing skill dir, or an upstream name MOUNTED in references/
       README.md (the provenance table is the mounting authority);
     - a backticked token directly adjacent to "agent/agents" ("the `X`
       agent", "`X` agent type") must be a persona dir, a skill, pi's
       `general-purpose`, or a `pi-dev:*` package persona;
     - a backticked token directly adjacent to "tool/工具" must be a tool
       registered by pi/*.ts registerTool calls or a pi core tool.

Skill history lives in git log, not in the files
  (P6.4: changelog blocks removed — they rode as tokens every time a skill
  fired).

Exit 0 = green. Requires PyYAML (python3 -m pip install pyyaml).
"""

from __future__ import annotations

import itertools
import re
import sys
from pathlib import Path

try:
    import yaml
except ImportError:  # local fallback: minimal parser for this repo's frontmatter subset
    yaml = None

    class _FM:
        @staticmethod
        def safe_load(text: str) -> dict:
            out: dict = {}
            lines = text.splitlines()
            i = 0
            while i < len(lines):
                m = re.match(r"^([A-Za-z_][\w-]*):\s*(.*)$", lines[i])
                if not m:
                    i += 1
                    continue
                key, rest = m.group(1), m.group(2).strip()
                if rest in (">", "|>", ">-", "|", "|-"):  # folded/literal block: collect indented lines
                    block = []
                    i += 1
                    while i < len(lines) and (not lines[i].strip() or lines[i][:1] in (" ", "\t")):
                        block.append(lines[i].strip())
                        i += 1
                    out[key] = " ".join(b for b in block if b)
                    continue
                out[key] = rest
                i += 1
            return out

# Skill names killed by the P5.2/P6 rename waves. A backtick reference to any
# of these on an authored surface is a stale pointer: fail it. When a skill is
# renamed, add its old name here (KILLS below is derived from the dirs).
RETIRED = {"issues", "tasks", "wayfinder", "align", "use-the-stack", "prd"}


def retired_hit(text: str, mm: "re.Match[str]", n: str) -> bool:
    """True when a backticked name is a retired-skill reference.

    `tasks` beside the agent tool is its batch parameter (one `agent` call
    carrying tasks), not the retired skill of the same name — sentence
    context decides: agent may sit on the previous line (wrapped prose).
    """
    if n not in RETIRED:
        return False
    if n == "tasks":
        before = text[: mm.start()]
        window = " ".join(before.rsplit("\n", 2)[-2:] + [text[mm.start() :].split("\n", 1)[0]])
        if re.search(r"\bagent\b", window):
            return False
    return True


def _retired_selftest() -> None:
    """Four asserts over this session's real misses (2026-10-21):
    bare `tasks` must fail; the parameter usage must pass both when agent
    sits on the previous line and in a single-line file (the IndexError
    regression); a real retired name must always fail."""

    def hits(sample: str, word: str) -> bool:
        return any(retired_hit(sample, m, m.group(1)) for m in re.finditer(r"`([a-z][a-z0-9-]*)`", sample) if m.group(1) == word)

    assert hits("use `tasks` alone\n", "tasks"), "bare `tasks` must stay a failure"
    assert not hits("Call the `agent` tool\nwith `tasks` for the batch\n", "tasks"), "cross-line parameter usage must pass (session miss #1)"
    assert not hits("`agent` carries `tasks`\n", "tasks"), "single-line-file parameter usage must pass (IndexError regression)"
    assert hits("see `wayfinder` there\n", "wayfinder"), "real retired name must fail"

# Words a candidate-facing eval prompt must never carry: they leak the meta.
META_WORDS = re.compile(r"\b(skill|skills|principle|principles|rubric|judge|grader|score|compare|experiment|pi-dev-mode)\b|SKILL\.md", re.I)

# Path roots this package owns — pointer targets inside skill bodies must
# resolve under one of these (skill-dir- or package-root-anchored). docs/ is
# NOT here: skill bodies use docs/* to name the TARGET repo's files.
PACKAGE_ROOTS = ("references", "scripts", "gates", "skills", "agents",
                 "adapters", "hooks", "pi", "evals")
PATH_TOKEN = (r"(?:(?:\.{1,2}/)+)?(?:" + "|".join(PACKAGE_ROOTS) + r")/"
              r"[\w./-]*\.(?:md|sh|ts|py|json)")

# Tools that ship in this package but are not installable into a target repo.
# Written bare (`scripts/check-code.sh`), they read as a path in the TARGET
# repo — where the file does not exist (audit 2026-10-26: nine such sites).
# `scripts/check-adrs.py` is deliberately absent: it IS meant to be copied in.
PACKAGE_TOOLS = ("scripts/check-code.sh", "scripts/assert-branch.sh",
                 "scripts/task.sh", "gates/gate.sh")

H1_STOPWORDS = {"a", "an", "the"}

# A model-invoked description is an always-loaded pointer: every word rides on
# every turn. 120 is the current worst case (show-me), so this is a guardrail
# against growth, not a ratchet — pruning needs the eval gate.
DESCRIPTION_MAX_WORDS = 120

# Cross-file duplication threshold, in normalized words. 14 catches the
# tracker-bootstrap oath, the acceptance-label triad, the adversarial prompt
# and the check-code preamble; shorter shared runs are ordinary domain
# vocabulary (module, interface, seam) and are not findings.
CLAUSE_WORDS = 14


def is_user_invoked(fm: dict) -> bool:
    """True when the frontmatter hides the skill from the model. The stdlib
    fallback parser returns strings, PyYAML returns a bool — accept both, or the
    trigger check fails only on machines without PyYAML."""
    value = fm.get("disable-model-invocation")
    return value is True or (isinstance(value, str) and value.strip().lower() == "true")


def word_count(text: str) -> int:
    """Mixed CJK/Latin count: one CJK char = one word, Latin token = one word."""
    return len(re.findall(r"[\u4e00-\u9fff]|[A-Za-z][A-Za-z0-9_.-]*", text))


def body_tokens(text: str) -> list[str]:
    """Lowercased ASCII word tokens for clause comparison (CJK text is not
    scanned: the 14-word threshold is calibrated on English prose, and a CJK
    n-gram would flag ordinary domain vocabulary)."""
    return re.findall(r"[a-z0-9][a-z0-9'_.-]*", text.lower())

# pi core tools (this package's own come from pi/*.ts registerTool calls).
# pi's built-ins a skill body may name beside the word "tool".
CORE_TOOLS = {"bash", "read", "edit", "write", "ls", "glob", "grep", "find",
              "mcp", "ask_user_question"}


def mounted_vocab(readme: str) -> set[str]:
    """Upstream names the references/README.md provenance table mounts."""
    return set(re.findall(r"[a-z][a-z0-9-]+", readme))


def registered_tools(pi_root: Path) -> set[str]:
    """Tool names this package registers (pi/*.ts registerTool name: "x").
    registerCommand names are not tools — the lifecycle COMMANDS array
    (name: "spec", "build", …) must not widen this set."""
    out: set[str] = set()
    for f in sorted(pi_root.glob("*.ts")):
        for chunk in f.read_text(encoding="utf-8").split("registerTool(")[1:]:
            m = re.search(r'name:\s*"([a-z][a-z0-9_]+)"', chunk[:400])
            if m:
                out.add(m.group(1))
    return out


# Label vocabulary: single-source read from docs/agents/triage-labels.md so
# `ready-for-agent` (an AFK agent label, not a persona claim) never flags.
def label_vocab(labels_doc: Path) -> set[str]:
    try:
        return set(re.findall(r"`([a-z][a-z0-9-]+)`", labels_doc.read_text(encoding="utf-8")))
    except OSError:
        return set()


def _adjacent(after_text: str, kind: re.Pattern[str], span: int) -> bool:
    """`kind` word sits within `span` chars with no other backticked token in
    between — "the `X` skill", "the `X` and `Y` agents" flags Y, not X."""
    window = after_text[:span]
    m = kind.search(window)
    if not m:
        return False
    return "`" not in window[:m.start()]


SKILL_WORD = re.compile(r"\bskills?\b|\b技能\b", re.I)
AGENT_WORD = re.compile(r"\bagents?\b", re.I)
TOOL_WORD = re.compile(r"\btools?\b|\b工具\b", re.I)


def norm_name(s: str) -> str:
    return re.sub(r"[^a-z0-9]", "", s.lower())


def h1_norm(s: str) -> str:
    return "".join(w for w in s.lower().split() if w not in H1_STOPWORDS)


def pointer_missing(tok: str, bases: list[Path]) -> bool:
    return not any((b / tok).resolve(strict=False).exists() for b in bases)


def main() -> int:
    _retired_selftest()  # guards the retired-scan precision;
    # a failing assert here means the scan regressed on one of its known cases
    root = Path(__file__).resolve().parent.parent
    failures: list[str] = []

    skills = sorted((root / "skills").iterdir())
    names = {d.name for d in skills}
    skill_files = [d / "SKILL.md" for d in skills]
    # README.md is a doc, not a persona prompt: don't frontmatter-check it
    agent_files = [f for f in sorted((root / "agents").glob("*.md")) if f.name != "README.md"]

    # authored surfaces whose backtick skill references must resolve:
    # skills bodies, agents, plus the map layer (package README, references/,
    # hooks/, gates/) — the layer where `spec → issues` once went stale
    wide_files = (skill_files + agent_files + [root / "README.md"]
                  + sorted((root / "references").glob("*.md"))
                  + sorted((root / "hooks").glob("*.md"))
                  + sorted((root / "gates").glob("*.md")))
    wide_files = [f for f in wide_files if f.exists()]

    # name per file, filled by the frontmatter pass and reused below: parsing
    # the same YAML twice is how a broken description once crashed this checker
    # with a traceback instead of printing its FAIL line.
    fm_names: dict[Path, str] = {}

    for f in skill_files + agent_files:
        rel = f.relative_to(root)
        text = f.read_text(encoding="utf-8")
        m = re.match(r"^---\n(.*?)\n---\n", text, re.S)
        if not m:
            failures.append(f"{rel}: frontmatter not found or unterminated")
            continue
        try:
            if yaml is not None:
                fm = yaml.safe_load(m.group(1))
            else:
                fm = _FM.safe_load(m.group(1))
        except Exception as e:
            first = str(e).splitlines()[0]
            failures.append(f"{rel}: YAML parse error: {first}")
            continue
        if not isinstance(fm, dict) or "name" not in fm or not isinstance(fm.get("description"), str) or not fm["description"].strip():
            failures.append(f"{rel}: frontmatter needs name and a non-empty description")
            continue
        fm_names[f] = str(fm["name"])
        if f.parent.name != "agents" and fm["name"] != f.parent.name:
            failures.append(f"{rel}: name {fm['name']!r} != directory {f.parent.name!r}")
        if not is_user_invoked(fm):
            if "Chinese triggers" not in re.sub(r"\s+", " ", fm["description"]):
                failures.append(f"{rel}: description carries no Chinese triggers")
            words = word_count(fm["description"])
            if words > DESCRIPTION_MAX_WORDS:
                failures.append(
                    f"{rel}: description is {words} words (cap {DESCRIPTION_MAX_WORDS}) — "
                    "the pointer rides on every turn; prune a synonym or a lane restatement"
                )
        # duplicate ## headings: P4 once landed two "## Reply contract"
        # sections in one skill; nothing caught it. Proven on that history.
        heads = re.findall(r"^## (.+)$", text, re.M)
        dups = sorted({h for h in heads if heads.count(h) > 1})
        if dups:
            failures.append(f"{rel}: duplicate section heading(s): {dups}")
        body = text
        # dispatch naming: a skill body that dispatches subagents must name the
        # dispatch tool (a past run picked another package's `Agent` in a
        # two-tool environment and lost all four reports — see review skill).
        # Match dispatch phrases, not informational mentions of subagents
        # ("subagent sessions live under...").
        DISPATCH_VERBS = re.compile(r"\b(spawn\w*|launch\w*|fire\w*|delegat\w*|spin\s+up|kick\s+off)\b", re.I)
        SUBAGENT = r"sub[- ]?agents?"
        fm_body = text[m.end():]
        dispatches = (
            f.parent.name != "agents"
            and (re.search(r"\bbackground\s+agents?\b", fm_body, re.I)
                 or re.search(DISPATCH_VERBS.pattern + r".{0,60}?" + SUBAGENT, fm_body, re.I))
        )
        if dispatches and "`agent`" not in fm_body:
            failures.append(f"{rel}: dispatches subagents without naming the tool — add `agent` (lowercase, pi-dev's own)")

    # retired names and (for skills/agents) dangling references — checked on the
    # wide set so the map layer (references/README.md etc.) cannot go stale again
    readme_mounts_file = root / "references" / "README.md"
    readme_mounts = (
        mounted_vocab(readme_mounts_file.read_text(encoding="utf-8")) if readme_mounts_file.is_file() else set()
    )
    tools = CORE_TOOLS | registered_tools(root / "pi")
    personas = {f"pi-dev:{f.stem}" for f in agent_files}
    labels = label_vocab(root / "docs" / "agents" / "triage-labels.md")
    for f in wide_files:
        rel = f.relative_to(root)
        text = f.read_text(encoding="utf-8")
        for mm in re.finditer(r"`([a-z][A-Za-z0-9:_-]*)`", text):
            n = mm.group(1)
            if retired_hit(text, mm, n):
                failures.append(f"{rel}: reference to retired skill name `{n}`")
        # phantom agents (check 8): direct-adjacency only, lowercase-first tokens —
        # `customerid` beside "skill" two sentences away stays legal, a label
        # (`ready-for-agent`, from docs/agents/triage-labels.md) is no persona claim,
        # and a real skill may describe its own agents ("the `research` agent")
        for mm in re.finditer(r"`([a-z][A-Za-z0-9:_-]*)`", text):
            n = mm.group(1)
            low = n.lower()
            after = text[mm.end():]
            if _adjacent(after, SKILL_WORD, 25) and low not in names and low not in readme_mounts and low not in tools:
                failures.append(f"{rel}: `{n}` cites a skill this package does not ship — real skill, or mount it in references/README.md")
            if _adjacent(after, AGENT_WORD, 8) and low not in labels and low not in names and low not in personas and low != "general-purpose" and not low.startswith("pi-dev:") and low not in {a.stem for a in agent_files}:
                failures.append(f"{rel}: `{n}` cites an agent type this package does not register — agent personas live in agents/ (spawned as pi-dev:<name>)")
            if _adjacent(after, TOOL_WORD, 25) and low not in tools and not low.startswith("/"):
                failures.append(f"{rel}: `{n}` cites a tool this package does not register (registered: {', '.join(sorted(tools))})")

    # per-skill structural checks (H1, duplicate paragraphs, pointer paths)
    for f in skill_files:
        rel = f.relative_to(root)
        text = f.read_text(encoding="utf-8")
        m = re.match(r"^---\n(.*?)\n---\n", text, re.S)
        if not m:
            continue  # already failed above
        fm_name = fm_names.get(f, "")
        body = text[m.end():]
        # H1 vs name
        h1 = re.search(r"^# (.+)$", body, re.M)
        if not h1:
            failures.append(f"{rel}: no H1 heading in body")
        else:
            hn, nn = h1_norm(h1.group(1)), norm_name(str(fm_name))
            if not (hn == nn or nn in hn):
                failures.append(f"{rel}: H1 {h1.group(1)!r} does not match name {fm_name!r}")
        # duplicate verbatim paragraphs
        seen: set[str] = set()
        for para in re.split(r"\n\s*\n", body):
            p = para.strip()
            if len(p) >= 80:
                if p in seen:
                    failures.append(f"{rel}: duplicated paragraph: {p[:60]!r}...")
                seen.add(p)
        # pointer files resolve (skill-dir or package-root anchored). A
        # package-shipped tool that resolves only at the package root must be
        # qualified — bare, it reads as a target-repo path that is not there.
        for mm in re.finditer(r"`(" + PATH_TOKEN + r")`", body):
            tok = mm.group(1)
            if pointer_missing(tok, [f.parent, root]):
                failures.append(f"{rel}: pointer `{tok}` resolves under neither the skill dir nor the package root")
            elif (
                tok in PACKAGE_TOOLS
                and pointer_missing(tok, [f.parent])
                and "this package" not in body[max(0, mm.start() - 45):mm.start()]
            ):
                failures.append(
                    f"{rel}: package tool `{tok}` written as a target-repo path — qualify it \"this package's …\" so the reader does not run a missing file"
                )
        for mm in re.finditer(r"\]\((" + PATH_TOKEN + r")\)", body):
            tok = mm.group(1)
            if pointer_missing(tok, [f.parent, root]):
                failures.append(f"{rel}: pointer `{tok}` resolves under neither the skill dir nor the package root")
        # The same rule when the backtick carries arguments (`gates/gate.sh run …`):
        # the exact-token pass above stops at the tool path's end, not the backtick.
        for mm in re.finditer(r"`((?:\.{1,2}/)*(?:scripts|gates)/[\w./-]+\.sh)\b", body):
            tok = mm.group(1)
            if body[mm.end():mm.end() + 1] == "`":
                continue  # exact form: the pointer pass handled it
            if tok not in PACKAGE_TOOLS or not pointer_missing(tok, [f.parent]):
                continue
            if "this package" in body[max(0, mm.start() - 45):mm.start()]:
                continue
            failures.append(
                f"{rel}: package tool `{tok}` written as a target-repo path — qualify it \"this package's …\" so the reader does not run a missing file"
            )

    # catalog completeness: the router table (`pi-dev-mode`) and the discovery
    # page (`dev-mode-help`) are the two inventory surfaces — every shipped
    # skill must be cited in both. Found by audit: the router table lacked
    # `constraints`, `tdd`, and the verification pair for weeks; nothing noticed.
    INVENTORY_FILES = ("pi-dev-mode", "dev-mode-help")
    for inv in INVENTORY_FILES:
        f = root / "skills" / inv / "SKILL.md"
        if not f.exists():
            continue
        t = f.read_text(encoding="utf-8")
        for n in sorted(names):
            if n != inv and f"`{n}`" not in t:
                failures.append(f"skills/{inv}/SKILL.md: skill `{n}` missing from this inventory surface")

    # cross-file duplication: a clause repeated in two skills is a second
    # maintenance point, and the per-file pass above cannot see it. Same
    # normalized 14-word window in two different skills = one finding per
    # contiguous shared run.
    tokens_by_skill = {}
    for f in skill_files:
        text = f.read_text(encoding="utf-8")
        m = re.match(r"^---\n(.*?)\n---\n", text, re.S)
        if m:
            tokens_by_skill[f.relative_to(root)] = body_tokens(text[m.end():])
    shingle_sets = {
        rel: {tuple(toks[i:i + CLAUSE_WORDS]) for i in range(len(toks) - CLAUSE_WORDS + 1)}
        for rel, toks in tokens_by_skill.items()
    }
    for a, b in itertools.combinations(sorted(tokens_by_skill), 2):
        ta = tokens_by_skill[a]
        sb = shingle_sets[b]
        hits = [
            i for i in range(len(ta) - CLAUSE_WORDS + 1)
            if tuple(ta[i:i + CLAUSE_WORDS]) in sb
        ]
        runs: list[list[int]] = []
        for i in hits:
            if runs and i == runs[-1][1] + 1:
                runs[-1][1] = i
            else:
                runs.append([i, i])
        for start, end in runs:
            span = ta[start:end + CLAUSE_WORDS]
            failures.append(
                f"{a} / {b}: {len(span)}-word clause duplicated across skills "
                f"({' '.join(span)[:120]!r}…) — keep it in one skill and point the other at it"
            )

    # evals/: structure + leak lint (cases are candidate-facing)
    evals_root = root / "evals"
    fx_root = evals_root / "fixtures"
    fx_dirs = sorted(d for d in fx_root.iterdir() if d.is_dir()) if fx_root.is_dir() else []
    referenced = set()
    cases = 0
    if evals_root.is_dir():
        for case_dir in sorted(p.parent for p in evals_root.glob("*/*/prompt.md")):
            cases += 1
            rel = case_dir.relative_to(root)
            pm = case_dir / "prompt.md"
            text = pm.read_text(encoding="utf-8")
            m = re.match(r"^---\n(.*?)\n---\n(.*)$", text, re.S)
            if not m:
                failures.append(f"{rel}/prompt.md: frontmatter not found")
                continue
            try:
                if yaml is not None:
                    fm = yaml.safe_load(m.group(1))
                else:
                    fm = _FM.safe_load(m.group(1))
            except Exception as e:
                failures.append(f"{rel}/prompt.md: YAML parse error: {str(e).splitlines()[0]}")
                continue
            for key in ("description", "kind", "target", "expected_outcome"):
                if key not in fm:
                    failures.append(f"{rel}/prompt.md: frontmatter missing {key}")
            graders = list(case_dir.glob("graders/*.md"))
            if not graders:
                failures.append(f"{rel}: no graders/*.md")
            body = m.group(2)
            if META_WORDS.search(body):
                failures.append(f"{rel}/prompt.md: meta leakage (skill names / eval vocabulary) in candidate-visible body")
            if any(k in body for k in names | RETIRED):
                failures.append(f"{rel}/prompt.md: skill name leaked in candidate-visible body")
            # fixture wiring: execution-kind cases must declare an existing fixture;
            # any declared fixture must exist (dialogue cases may declare one too)
            fx = fm.get("fixture")
            if fm.get("kind") == "execution" and not fx:
                failures.append(f"{rel}/prompt.md: execution-kind case must declare a fixture")
            elif fx is not None and not (fx_root / str(fx)).is_dir():
                failures.append(f"{rel}/prompt.md: fixture {fx!r} not found under evals/fixtures/")
            elif fx is not None:
                referenced.add(str(fx))
    for d in fx_dirs:
        if d.name not in referenced:
            failures.append(f"evals/fixtures/{d.name}: unreferenced fixture dir (no case declares it)")

    print(f"checked {len(skill_files) + len(agent_files)} files ({len(names)} skills + agents)"
          f" + {len(wide_files)} wide-surface files + {cases} eval cases + {len(fx_dirs)} fixtures")
    if failures:
        for f in failures:
            print(f"FAIL {f}")
        return 1
    print("OK: frontmatter, names, triggers, H1s, cross-references (retired-safe), pointers, duplicate paragraphs, cross-file clauses")
    return 0


if __name__ == "__main__":
    sys.exit(main())
