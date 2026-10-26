#!/usr/bin/env python3
"""gates/ledger.py — the SDLC ledger state machine (stdlib only).

`gates/gate.sh` is a shim over this module. The ledger lives in the TARGET
project: `.dev/lifecycle/items/<id>/state.json`. Its absence is the OFF state —
every command refuses (exit 2) without one, so a closed ledger never changes
skill behavior.

Gate classes:
  D — deterministic script gate: run a command, record its exit + output tail;
      `replay` re-executes it.
  A — adjudicated gate (review verdict): record file hash + parsed verdict;
      `replay` re-hashes the file.

Rework budget (item-level): consecutive FAILs per gate count up in state.json;
reaching the budget sets state.blocked and exits 4. While blocked, every
run/verdict/close for that item refuses with exit 4 until a human runs
`resume <id> --note "<reason>"`. show/replay/mine are read-only and work while
blocked. Blocked state is per-item.

Exit codes: 0 PASS · 1 FAIL · 2 refusal/usage (no ledger, bad args) ·
3 missing python3 (raised by the shim) · 4 BLOCKED.
"""

from __future__ import annotations

import datetime
import hashlib
import json
import subprocess
import sys
from pathlib import Path

USAGE = """\
Usage: gate.sh <command> [args]        (run from the target project root)
  open <id> "<title>" [--budget N]     open item ledger (.dev/lifecycle/, opt-in);
                                       --budget N = consecutive-FAIL budget (default 3).
                                       Idempotent: re-open of a live item reuses it.
  run <id> <gate> [-d dir] [--note s] -- <cmd...>
                                       run D-class gate, append history.
                                       FAIL counts toward the item budget; budget
                                       tripped -> state.blocked + exit 4.
  verdict <id> --from <verdict.json> [--note s]
                                       record A-class verdict (hash + verdict).
                                       FAIL/BLOCKED verdicts count toward the budget.
  resume <id> --note "<reason>"        clear blocked (note required, human-written),
                                       reset counters, append history. No-op if unblocked.
  close <id> [--note s]                close item (refused while blocked)
  show <id>                            print state (gates + history; works while blocked)
  replay <id>                          re-execute D history, re-hash A; drift report (read-only)
  mine                                 first-pass rate + verdict flips + blocked count
"""

PASS_WORDS = {"PASS", "PASS+NOTES"}
KNOWN_VERDICTS = PASS_WORDS | {"FAIL", "BLOCKED"}
ITEMS = Path(".dev/lifecycle/items")


def usage() -> "NoReturn":  # noqa: F821 - typing only
    print(USAGE, end="")
    raise SystemExit(2)


def stamp() -> str:
    return datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


def state_file(item: str) -> Path:
    return ITEMS / item / "state.json"


def load(item: str) -> dict:
    path = state_file(item)
    if not path.exists():
        raise SystemExit(_refuse("gate.sh: item not opened (no .dev/lifecycle ledger)"))
    return json.loads(path.read_text(encoding="utf-8"))


def save(item: str, state: dict) -> None:
    state_file(item).write_text(json.dumps(state, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def _refuse(message: str) -> int:
    print(message, file=sys.stderr)
    return 2


def refuse_blocked(item: str, state: dict) -> None:
    blocked = state.get("blocked")
    if not blocked:
        return
    print(
        f"gate.sh: BLOCKED item {item} — gate {blocked.get('gate')}: "
        f"{blocked.get('reason')} ({blocked.get('ts')}). Resume with: "
        f'gate.sh resume {item} --note "<human reason>"',
        file=sys.stderr,
    )
    raise SystemExit(4)


def value_after(args: list[str], index: int, option: str) -> str:
    if index + 1 >= len(args) or not args[index + 1]:
        usage()
    return args[index + 1]


# ---------------------------------------------------------------- commands


def cmd_open(item: str, args: list[str]) -> int:
    if not args or not args[0]:
        usage()
    title = args[0]
    budget = 3
    i = 1
    while i < len(args):
        if args[i] != "--budget":
            usage()
        raw = value_after(args, i, "--budget")
        try:
            budget = int(raw)
        except ValueError:
            print("gate.sh: --budget must be a positive integer", file=sys.stderr)
            return 2
        i += 2
    if budget < 1:
        print("gate.sh: --budget must be a positive integer", file=sys.stderr)
        return 2

    path = state_file(item)
    if path.exists():
        print(f"open {item}: already open at {path} (reuse)")
        return 0

    path.parent.mkdir(parents=True, exist_ok=True)
    sdlc = Path(".dev/lifecycle")
    readme = sdlc / "README.md"
    if not readme.exists():
        readme.write_text(
            "# .dev/lifecycle/ ledger (opt-in)\n\n"
            "Opened by gate.sh (pi-dev-mode P5). Removing/renaming this dir closes the\n"
            "ledger — all skills then behave exactly as P1-P4 (no .dev/lifecycle, no ledger).\n\n"
            "- items/<id>/state.json — gates + append-only history (replayable)\n"
            "- item rework budget: consecutive gate FAILs (default 3) block the item until\n"
            '  `gate.sh resume <id> --note "<human reason>"` (see gates/README.md)\n'
            "- observe/ — L4 tail stub (post-deploy baseline loop; intentionally unimplemented)\n",
            encoding="utf-8",
        )
    (sdlc / "observe").mkdir(exist_ok=True)
    stub = sdlc / "observe" / "README.md"
    if not stub.exists():
        stub.write_text(
            "# observe loop — STUB (P5 item 4, intentionally unimplemented)\n\n"
            "L4 tail, parked by design. When implemented: post-deploy baseline compare,\n"
            "regression auto-opens an intake ticket (items/<new-id>/state.json with\n"
            "gate=observe). Do not hand-edit anything under this dir.\n",
            encoding="utf-8",
        )

    ts = stamp()
    state = {
        "id": item,
        "title": title,
        "opened": ts,
        "closed": None,
        "budget": budget,
        "blocked": None,
        "gates": {},
        "history": [{"step": 1, "ts": ts, "type": "open", "budget": budget}],
    }
    save(item, state)
    print(f"open {item}: {path} (budget {budget})")
    return 0


def cmd_run(item: str, args: list[str]) -> int:
    if not args:
        usage()
    gate = args[0]
    rest = args[1:]
    directory = "."
    note = ""
    i = 0
    while i < len(rest):
        arg = rest[i]
        if arg == "-d":
            directory = value_after(rest, i, "-d")
            i += 2
        elif arg == "--note":
            note = value_after(rest, i, "--note")
            i += 2
        elif arg == "--":
            i += 1
            break
        else:
            usage()
    command = rest[i:]
    if not command:
        print('gate.sh: run needs a command after --', file=sys.stderr)
        return 2

    state = load(item)
    refuse_blocked(item, state)
    budget = state.get("budget", 3)
    proc = subprocess.run(command, cwd=directory, capture_output=True, text=True)
    ts = stamp()
    entry = {
        "step": len(state["history"]) + 1,
        "ts": ts,
        "type": "run",
        "gate": gate,
        "class": "D",
        "argv": command,
        "dir": directory,
        "exit": proc.returncode,
        "pass": proc.returncode == 0,
        "evidence": (proc.stdout + proc.stderr)[-2000:],
    }
    if note:
        entry["note"] = note
    state["history"].append(entry)

    g = state["gates"].get(gate, {"class": "D", "pass": False, "runs": 0, "first_pass": None})
    g["runs"] += 1
    if g["first_pass"] is None:
        g["first_pass"] = proc.returncode == 0
    g["pass"] = proc.returncode == 0
    g["fails"] = 0 if proc.returncode == 0 else g.get("fails", 0) + 1
    g["ts"] = ts
    state["gates"][gate] = g

    code = 0 if g["pass"] else 1
    if not g["pass"] and g["fails"] >= budget:
        state["blocked"] = {"gate": gate, "reason": f"{g['fails']} consecutive FAILs (budget {budget})", "ts": ts}
        state["history"].append({"step": len(state["history"]), "ts": ts, "type": "blocked", "gate": gate, "budget": budget})
        code = 4
    save(item, state)
    print(f"run {gate}: {'PASS' if g['pass'] else 'FAIL'} (exit {proc.returncode}) step {entry['step']}")
    if code == 4:
        print(f"BLOCKED {item}: {state['blocked']['reason']} — gate.sh resume {item} --note \"<human reason>\"")
    return code


def cmd_verdict(item: str, args: list[str]) -> int:
    if not args:
        usage()
    rest = args
    if rest[0] == "--from":
        file = value_after(rest, 0, "--from")
        rest = rest[2:]
    else:
        file = rest[0]
        rest = rest[1:]
    note = ""
    i = 0
    while i < len(rest):
        if rest[i] != "--note":
            usage()
        note = value_after(rest, i, "--note")
        i += 2

    state = load(item)
    refuse_blocked(item, state)
    path = Path(file)
    if not path.exists():
        print(f"gate.sh: verdict file not found: {file}", file=sys.stderr)
        return 2
    raw = path.read_bytes()
    try:
        parsed = json.loads(raw)
        verdict = str(parsed.get("verdict") or parsed.get("pass") or "UNKNOWN").upper()
    except Exception:
        verdict = "UNPARSEABLE"

    ts = stamp()
    budget = state.get("budget", 3)
    entry = {
        "step": len(state["history"]) + 1,
        "ts": ts,
        "type": "verdict",
        "gate": "review",
        "class": "A",
        "file": file,
        "sha256": hashlib.sha256(raw).hexdigest()[:16],
        "verdict": verdict,
    }
    if note:
        entry["note"] = note
    state["history"].append(entry)

    g = state["gates"].get("review", {"class": "A", "verdict": None, "runs": 0})
    g["runs"] += 1
    g["verdict"] = verdict
    g["ts"] = ts
    g["file"] = file
    if verdict in PASS_WORDS:
        g["fails"] = 0
    elif verdict in KNOWN_VERDICTS:
        g["fails"] = g.get("fails", 0) + 1
    state["gates"]["review"] = g

    code = 0 if verdict in PASS_WORDS else (1 if verdict in KNOWN_VERDICTS else 2)
    if verdict in KNOWN_VERDICTS and verdict not in PASS_WORDS and g["fails"] >= budget:
        state["blocked"] = {"gate": "review", "reason": f"{g['fails']} consecutive FAIL verdicts (budget {budget})", "ts": ts}
        state["history"].append({"step": len(state["history"]), "ts": ts, "type": "blocked", "gate": "review", "budget": budget})
        code = 4
    save(item, state)
    print(f"verdict {item}: {verdict} ({file} sha:{entry['sha256']})")
    if code == 4:
        print(f"BLOCKED {item}: {state['blocked']['reason']} — gate.sh resume {item} --note \"<human reason>\"")
    return code


def _note_only(args: list[str], required: bool) -> str:
    note = ""
    i = 0
    while i < len(args):
        if args[i] != "--note":
            usage()
        note = value_after(args, i, "--note")
        i += 2
    if required and not note:
        print('gate.sh: resume needs --note "<human reason>"', file=sys.stderr)
        raise SystemExit(2)
    return note


def cmd_resume(item: str, args: list[str]) -> int:
    note = _note_only(args, required=True)
    state = load(item)
    blocked = state.get("blocked")
    if not blocked:
        print(f"resume {item}: not blocked, nothing to resume")
        return 0
    ts = stamp()
    was = blocked.get("gate")
    state["blocked"] = None
    for g in state["gates"].values():
        g["fails"] = 0
    state["history"].append({"step": len(state["history"]) + 1, "ts": ts, "type": "resume", "was": was, "note": note})
    save(item, state)
    print(f"resume {item}: unblocked (was gate {was}) — {note}")
    return 0


def cmd_close(item: str, args: list[str]) -> int:
    note = _note_only(args, required=False)
    state = load(item)
    refuse_blocked(item, state)
    ts = stamp()
    state["closed"] = ts
    entry = {"step": len(state["history"]) + 1, "ts": ts, "type": "close"}
    if note:
        entry["note"] = note
    state["history"].append(entry)
    save(item, state)
    print(f"close {item} at step {entry['step']}")
    return 0


def cmd_show(item: str, args: list[str]) -> int:
    if args:
        usage()
    path = state_file(item)
    if not path.exists():
        raise SystemExit(_refuse("gate.sh: item not opened (no .dev/lifecycle ledger)"))
    print(path.read_text(encoding="utf-8"), end="")
    return 0


def cmd_replay(item: str, args: list[str]) -> int:
    if args:
        usage()
    state = load(item)
    drift = 0
    for entry in state["history"]:
        if entry["type"] == "run":
            proc = subprocess.run(entry["argv"], cwd=entry["dir"], capture_output=True, text=True)
            same = (proc.returncode == 0) == entry["pass"]
            print(
                f"step {entry['step']} run {entry['gate']}: recorded "
                f"{'PASS' if entry['pass'] else 'FAIL'} / replay exit {proc.returncode} -> "
                f"{'OK' if same else 'DRIFT'}"
            )
            drift += 0 if same else 1
        elif entry["type"] == "verdict":
            path = Path(entry["file"])
            digest = hashlib.sha256(path.read_bytes()).hexdigest()[:16] if path.exists() else "GONE"
            print(
                f"step {entry['step']} verdict {entry['gate']}: {entry['verdict']} "
                f"sha:{entry['sha256']} / now {digest} -> {'OK' if digest == entry['sha256'] else 'DRIFT'}"
            )
            drift += 0 if digest == entry["sha256"] else 1
        else:
            print(f"step {entry['step']} {entry['type']}: (no-op)")
    print(f"replay {item}: {'CLEAN' if drift == 0 else f'{drift} DRIFT'}")
    return 0 if drift == 0 else 1


def cmd_mine(args: list[str]) -> int:
    if args:
        usage()
    sdlc = Path(".dev/lifecycle")
    if not sdlc.exists():
        print("gate.sh: no .dev/lifecycle ledger (closed)", file=sys.stderr)
        return 2
    rows: list[tuple[str, str, str, str]] = []
    states = []
    for path in sorted(sdlc.glob("items/*/state.json")):
        state = json.loads(path.read_text(encoding="utf-8"))
        states.append(state)
        for gate, d in sorted(state.get("gates", {}).items()):
            if d["class"] == "D":
                rows.append((state["id"], gate, "D", f"runs={d['runs']} first_pass={d.get('first_pass')} pass={d['pass']}"))
            else:
                rows.append((state["id"], gate, "A", f"verdict={d['verdict']} runs={d['runs']}"))
    flips = 0
    for state in states:
        verdicts = [e["verdict"] for e in state["history"] if e["type"] == "verdict"]
        flips += sum(1 for a, b in zip(verdicts, verdicts[1:]) if a != b)
    blocked = sum(1 for state in states if state.get("blocked"))
    if not rows:
        print("mine: empty ledger")
    else:
        for row in rows:
            print(" ".join(map(str, row)))
        first = [r for r in rows if r[2] == "D"]
        if first:
            passing = sum(1 for r in first if "first_pass=True" in r[3])
            print(f"mine: D-gates={len(first)} first_pass={passing} first-pass-rate={passing / len(first):.2f}")
        else:
            print("mine: no D gates")
        print(f"mine: verdict-flips={flips} (disagreement; skip-test rate lives in .audit tsv)")
    print(f"mine: blocked-items={blocked}")
    return 0


COMMANDS = {"open", "run", "verdict", "resume", "close", "show", "replay", "mine"}


def main(argv: list[str]) -> int:
    if not argv:
        usage()
    command, rest = argv[0], argv[1:]
    if command not in COMMANDS:
        usage()
    if command == "mine":
        return cmd_mine(rest)
    if not rest:
        usage()
    item, rest = rest[0], rest[1:]
    return {
        "open": cmd_open,
        "run": cmd_run,
        "verdict": cmd_verdict,
        "resume": cmd_resume,
        "close": cmd_close,
        "show": cmd_show,
        "replay": cmd_replay,
    }[command](item, rest)


if __name__ == "__main__":
    raise SystemExit(main(sys.argv[1:]))
