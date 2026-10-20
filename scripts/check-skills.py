#!/usr/bin/env python3
"""Static acceptance for the pi-dev-mode skill tree.

Validated, in order:
  1. frontmatter on every skills/*/SKILL.md and agents/*.md parses as YAML
     (a regex frontmatter check let a broken quoted description through once —
     see benchmark-checklist's P2.1 changelog)
  2. name present and equals the skill's directory name (skills only)
  3. description present, non-empty, and carries Chinese triggers
  4. H1 agrees with the frontmatter name: normalize (lowercase alphanumerics,
     drop a/an/the from the H1), then name must equal or be contained in the
     H1 (the P5.2/P6 renames once left three stale H1s behind — # Tasks,
     # Align, # Use the Stack — nothing caught them)
  5. no duplicated long paragraph (>=80 chars, verbatim): a P0 audit found
     one in grill-me riding as tokens on every firing
  6. cross-references on every authored surface (skills, agents, package
     README, references/, hooks/, gates/): a backtick `skill-name` token
     must resolve to an existing skill directory, and must never be a
     RETIRED name (died in the P5.2/P6 rename waves: issues, tasks,
     wayfinder, align, use-the-stack, prd). references/README.md once
     mapped `spec → issues` for weeks because the scan stopped at skills/.
  7. pointer files in skill bodies: backticked or md-linked paths under this
     package's own trees (references/ scripts/ gates/ skills/ agents/
     adapters/ hooks/ pi/ evals/) resolve from the skill's own directory or
     the package root. Target-repo placeholders (docs/GLOSSARY.md, .dev/*,
     .pi/*) are deliberately out of scope — those name the USER's repo.

Skill history lives in git log and docs/03 landing records, not in the files
  (P6.4: changelog blocks removed — they rode as tokens every time a skill
  fired).

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

# Skill names killed by the P5.2/P6 rename waves. A backtick reference to any
# of these on an authored surface is a stale pointer: fail it. When a skill is
# renamed, add its old name here (KILLS below is derived from the dirs).
RETIRED = {"issues", "tasks", "wayfinder", "align", "use-the-stack", "prd"}

# Words a candidate-facing eval prompt must never carry: they leak the meta.
META_WORDS = re.compile(r"\b(skill|skills|principle|principles|rubric|judge|grader|score|compare|experiment|pi-dev-mode)\b|SKILL\.md", re.I)

# Path roots this package owns — pointer targets inside skill bodies must
# resolve under one of these (skill-dir- or package-root-anchored). docs/ is
# NOT here: skill bodies use docs/* to name the TARGET repo's files.
PACKAGE_ROOTS = ("references", "scripts", "gates", "skills", "agents",
                 "adapters", "hooks", "pi", "evals")
PATH_TOKEN = (r"(?:(?:\.{1,2}/)+)?(?:" + "|".join(PACKAGE_ROOTS) + r")/"
              r"[\w./-]*\.(?:md|sh|ts|py|json)")

H1_STOPWORDS = {"a", "an", "the"}


def norm_name(s: str) -> str:
    return re.sub(r"[^a-z0-9]", "", s.lower())


def h1_norm(s: str) -> str:
    return "".join(w for w in s.lower().split() if w not in H1_STOPWORDS)


def pointer_missing(tok: str, bases: list[Path]) -> bool:
    return not any((b / tok).resolve(strict=False).exists() for b in bases)


def main() -> int:
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

    for f in skill_files + agent_files:
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
    for f in wide_files:
        rel = f.relative_to(root)
        text = f.read_text()
        for mm in re.finditer(r"`([a-z][a-z0-9-]*)`", text):
            n = mm.group(1)
            if n in RETIRED:
                failures.append(f"{rel}: reference to retired skill name `{n}`")

    # per-skill structural checks (H1, duplicate paragraphs, pointer paths)
    for f in skill_files:
        rel = f.relative_to(root)
        text = f.read_text()
        m = re.match(r"^---\n(.*?)\n---\n", text, re.S)
        if not m:
            continue  # already failed above
        fm_name = (yaml.safe_load(m.group(1)) if yaml is not None else _FM.safe_load(m.group(1))).get("name", "")
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
        # pointer files resolve (skill-dir or package-root anchored)
        for tok in set(re.findall(r"`(" + PATH_TOKEN + r")`", body)) | set(re.findall(r"\]\((" + PATH_TOKEN + r")\)", body)):
            if pointer_missing(tok, [f.parent, root]):
                failures.append(f"{rel}: pointer `{tok}` resolves under neither the skill dir nor the package root")

    # catalog completeness: the router table (`pi-dev-mode`) and the discovery
    # page (`dev-mode-help`) are the two inventory surfaces — every shipped
    # skill must be cited in both. Found by audit: the router table lacked
    # `constraints`, `tdd`, and the verification pair for weeks; nothing noticed.
    INVENTORY_FILES = ("pi-dev-mode", "dev-mode-help")
    for inv in INVENTORY_FILES:
        f = root / "skills" / inv / "SKILL.md"
        if not f.exists():
            continue
        t = f.read_text()
        for n in sorted(names):
            if n != inv and f"`{n}`" not in t:
                failures.append(f"skills/{inv}/SKILL.md: skill `{n}` missing from this inventory surface")

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
    print("OK: frontmatter, names, triggers, H1s, cross-references (retired-safe), pointers, duplicate paragraphs")
    return 0


if __name__ == "__main__":
    sys.exit(main())
