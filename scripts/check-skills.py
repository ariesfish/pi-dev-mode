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

import yaml

KILLS = {
    "align", "code-map", "code-review", "constraints", "diagnose", "doubt",
    "implement", "implement-all", "issues", "pi-dev-mode", "prd", "proto",
    "refact", "repo-map", "research", "retro", "review", "setup", "spec",
    "tdd", "triage-issue", "use-the-stack", "wayfinder",
}


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
            fm = yaml.safe_load(m.group(1))
        except yaml.YAMLError as e:
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

    print(f"checked {len(files)} files ({len(names)} skills + agents)")
    if failures:
        for f in failures:
            print(f"FAIL {f}")
        return 1
    print("OK: YAML frontmatter, names, triggers, changelogs, cross-references")
    return 0


if __name__ == "__main__":
    sys.exit(main())
