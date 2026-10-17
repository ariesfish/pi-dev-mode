#!/usr/bin/env python3
"""Static acceptance for the pi-dev-mode skill tree.

Validated, in order:
  1. frontmatter on every skills/*/SKILL.md and agents/*.md parses as YAML
     (a regex frontmatter check let a broken quoted description through once —
     see benchmark-checklist's P2.1 changelog)
  2. name present and equals the skill's directory name (skills only)
  3. description present, non-empty, and carries Chinese triggers
  4. a pi-dev-mode changelog block follows the frontmatter
  5. cross-references: every `skill-name`-shaped backtick reference in a body
     (outside changelog blocks) resolves to an existing skill

Exit 0 = green. Requires PyYAML (python3 -m pip install pyyaml).
"""

from __future__ import annotations

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

KILLS = {
    "align", "code-map", "code-review", "constraints", "diagnose", "doubt",
    "implement", "implement-all", "issues", "pi-dev-mode", "prd", "proto",
    "refact", "repo-map", "research", "retro", "review", "setup", "spec",
    "tdd", "triage-issue", "use-the-stack", "wayfinder",
    "create-verification-skill", "maintain-verification-skill",
    "benchmark-checklist", "eval",
}

# Words a candidate-facing eval prompt must never carry: they leak the meta.
META_WORDS = re.compile(r"\b(skill|skills|principle|principles|rubric|judge|grader|score|compare|experiment|pi-dev-mode)\b|SKILL\.md", re.I)


def strip_changelog(text: str) -> str:
    return re.sub(r"<!-- pi-dev-mode changelog:.*?-->", "", text, flags=re.S)


def main() -> int:
    root = Path(__file__).resolve().parent.parent
    failures: list[str] = []

    skills = sorted((root / "skills").iterdir())
    names = {d.name for d in skills}
    files = [d / "SKILL.md" for d in skills] + sorted((root / "agents").glob("*.md"))

    for f in files:
        rel = f.relative_to(root)
        text = f.read_text()
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
        if f.parent.name != "agents" and fm["name"] != f.parent.name:
            failures.append(f"{rel}: name {fm['name']!r} != directory {f.parent.name!r}")
        if "Chinese triggers" not in re.sub(r"\s+", " ", fm["description"]):
            failures.append(f"{rel}: description carries no Chinese triggers")
        if "pi-dev-mode changelog" not in text[: len(m.group(0)) + 400]:
            failures.append(f"{rel}: no changelog block after frontmatter")
        body = strip_changelog(text)
        for mm in re.finditer(r"`([a-z][a-z0-9-]*)`", body):
            n = mm.group(1)
            if n in KILLS and n not in names:
                failures.append(f"{rel}: dangling skill reference `{n}`")
        # dispatch naming: a skill body that dispatches subagents must name the
        # dispatch tool (a past run picked another package's `Agent` in a
        # two-tool environment and lost all four reports — see review skill).
        # Match dispatch phrases, not informational mentions of subagents
        # ("subagent sessions live under...").
        DISPATCH_VERBS = re.compile(r"\b(spawn\w*|launch\w*|fire\w*|delegat\w*|spin\s+up|kick\s+off)\b", re.I)
        SUBAGENT = r"sub[- ]?agents?"
        fm_body = strip_changelog(text[m.end():])
        dispatches = (
            f.parent.name != "agents"
            and (re.search(r"\bbackground\s+agents?\b", fm_body, re.I)
                 or re.search(DISPATCH_VERBS.pattern + r".{0,60}?" + SUBAGENT, fm_body, re.I))
        )
        if dispatches and "`agent`" not in fm_body:
            failures.append(f"{rel}: dispatches subagents without naming the tool — add `agent` (lowercase, pi-dev's own)")

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
            text = pm.read_text()
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
            if any(k in body for k in KILLS):
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

    print(f"checked {len(files)} files ({len(names)} skills + agents) + {cases} eval cases + {len(fx_dirs)} fixtures")
    if failures:
        for f in failures:
            print(f"FAIL {f}")
        return 1
    print("OK: YAML frontmatter, names, triggers, changelogs, cross-references, fixtures")
    return 0


if __name__ == "__main__":
    sys.exit(main())
