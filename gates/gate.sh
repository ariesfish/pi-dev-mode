#!/usr/bin/env bash
# gate.sh — SDLC ledger gates (P5, opt-in). Zero deps beyond bash + python3.
#
# The ledger lives in the TARGET project: .dev/lifecycle/items/<id>/state.json.
# Its absence is the OFF state — every command here refuses (exit 2) without
# one, so a closed ledger never changes skill behavior.
#
# Gate classes (gates/README.md):
#   D — deterministic script gate (tdd / check / repro / land / constraints):
#       run cmd, record exit. Evidence = argv + dir + exit + output tail —
#       re-executable by `replay`.
#   A — adjudicated gate (review verdict): record file hash + parsed verdict;
#       replay re-hashes.
#
# Rework budget (item-level): consecutive FAILs per gate count up in
# state.json; reaching the budget (default 3, `open --budget N`) sets
# state.blocked and exits 4. While blocked, every run/verdict/close for that
# item refuses with exit 4 until a human runs `resume <id> --note "<reason>"`
# (note required, appended to history, counters reset). A PASS (or PASS+
# verdict, a passing run, a resume) resets the counter. `show` / `replay` /
# `mine` are read-only and work while blocked. Blocked state is per-item:
# other items keep running.
#
# Exit codes: 0 PASS · 1 FAIL · 2 refusal/usage (no ledger, bad args) ·
# 3 missing python3 · 4 BLOCKED (budget tripped / blocked item).
set -euo pipefail

GATE_HOME="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PY=python3
command -v "$PY" >/dev/null 2>&1 || { echo "gate.sh: python3 required" >&2; exit 3; }

die() { echo "gate.sh: $*" >&2; exit 2; }
refuse() { echo "gate.sh: $*" >&2; exit 2; }  # without-ledger / bad-arg refusals
usage() {
  cat <<'EOF'
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
EOF
  exit 2
}

# --- dispatch -------------------------------------------------------------
cmd="${1:-}"; [ $# -gt 0 ] && shift
case "$cmd" in
  open|run|verdict|close|show|replay|resume)
    id="${1:-}"; [ -n "$id" ] || usage; shift || true
    ;;
  mine) ;;
  *) usage ;;
esac

case "$cmd" in
  open)
    title="${1:-}"; [ -n "$title" ] || die "open needs a title"
    shift
    budget=3
    while [ $# -gt 0 ]; do
      case "$1" in
        --budget)
          [ $# -ge 2 ] || usage
          budget="$2"; shift 2 ;;
        *) usage ;;
      esac
    done
    exec "$PY" - "$GATE_HOME" "$id" "$title" "$budget" <<'PYEOF'
import json, sys, pathlib, datetime, re
gate_home, item, title, budget = sys.argv[1], sys.argv[2], sys.argv[3], sys.argv[4]
if not re.fullmatch(r"[1-9][0-9]*", budget or ""):
    print("gate.sh: --budget must be a positive integer", file=sys.stderr)
    sys.exit(2)
budget = int(budget)
root = pathlib.Path.cwd()
sdlc = root / ".dev/lifecycle"
state_f = sdlc / "items" / item / "state.json"
if state_f.exists():
    print(f"open {item}: already open at {state_f} (reuse)")
    sys.exit(0)
state_f.parent.mkdir(parents=True, exist_ok=True)
readme = sdlc / "README.md"
if not readme.exists():
    readme.write_text(
        "# .dev/lifecycle/ ledger (opt-in)\n\n"
        "Opened by gate.sh (pi-dev-mode P5). Removing/renaming this dir closes the\n"
        "ledger — all skills then behave exactly as P1-P4 (no .dev/lifecycle, no ledger).\n\n"
        "- items/<id>/state.json — gates + append-only history (replayable)\n"
        "- item rework budget: consecutive gate FAILs (default 3) block the item until\n"
        "  `gate.sh resume <id> --note \"<human reason>\"` (see gates/README.md)\n"
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
ts = datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
state = {"id": item, "title": title, "opened": ts, "closed": None, "budget": budget,
         "blocked": None, "gates": {},
         "history": [{"step": 1, "ts": ts, "type": "open", "budget": budget}]}
state_f.write_text(json.dumps(state, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
print(f"open {item}: {state_f} (budget {budget})")
PYEOF
    ;;

  run)
    gate="${1:-}"; [ -n "$gate" ] || usage; shift
    dir="."; note=""
    while [ $# -gt 0 ]; do
      case "$1" in
        -d)
          [ $# -ge 2 ] || usage
          dir="$2"; shift 2 ;;
        --note)
          [ $# -ge 2 ] || usage
          note="$2"; shift 2 ;;
        --) shift; break ;;
        *) usage ;;
      esac
    done
    [ $# -gt 0 ] || die "run needs a command after --"
    exec "$PY" - "$GATE_HOME" "$id" "$gate" "$dir" "$note" "$@" <<'PYEOF'
import json, subprocess, sys, pathlib, datetime
item, gate, dir_, note, argv = sys.argv[2], sys.argv[3], sys.argv[4], sys.argv[5], sys.argv[6:]
f = pathlib.Path.cwd() / ".dev/lifecycle" / "items" / item / "state.json"
if not f.exists():
    print("gate.sh: item not opened (no .dev/lifecycle ledger)", file=sys.stderr)
    sys.exit(2)
state = json.loads(f.read_text())
blocked = state.get("blocked")
if blocked:
    print(f"gate.sh: BLOCKED item {item} — gate {blocked.get('gate')}: "
          f"{blocked.get('reason')} ({blocked.get('ts')}). Resume with: "
          f"gate.sh resume {item} --note \"<human reason>\"", file=sys.stderr)
    sys.exit(4)
budget = state.get("budget", 3)
proc = subprocess.run(argv, cwd=dir_, capture_output=True, text=True)
ts = datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
entry = {"step": len(state["history"]) + 1, "ts": ts, "type": "run", "gate": gate,
         "class": "D", "argv": argv, "dir": dir_, "exit": proc.returncode,
         "pass": proc.returncode == 0, "evidence": (proc.stdout + proc.stderr)[-2000:]}
if note: entry["note"] = note
state["history"].append(entry)
g = state["gates"].get(gate, {"class": "D", "pass": False, "runs": 0, "first_pass": None})
g["runs"] += 1
if g["first_pass"] is None: g["first_pass"] = proc.returncode == 0
g["pass"] = proc.returncode == 0
g["fails"] = 0 if proc.returncode == 0 else g.get("fails", 0) + 1
g["ts"] = ts
state["gates"][gate] = g
exit_code = 0 if g["pass"] else 1
if not g["pass"] and g["fails"] >= budget:
    state["blocked"] = {"gate": gate, "reason": f"{g['fails']} consecutive FAILs (budget {budget})", "ts": ts}
    state["history"].append({"step": len(state["history"]), "ts": ts, "type": "blocked",
                             "gate": gate, "budget": budget})
    exit_code = 4
f.write_text(json.dumps(state, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
print(f"run {gate}: {'PASS' if g['pass'] else 'FAIL'} (exit {proc.returncode}) step {entry['step']}")
if exit_code == 4:
    print(f"BLOCKED {item}: {state['blocked']['reason']} — "
          f"gate.sh resume {item} --note \"<human reason>\"")
sys.exit(exit_code)
PYEOF
    ;;

  verdict)
    file=""; note=""
    if [ "${1:-}" = "--from" ]; then
      [ $# -ge 2 ] || usage
      file="$2"; shift 2
    else
      file="${1:-}"; [ -n "$file" ] || usage; shift
    fi
    while [ $# -gt 0 ]; do
      case "$1" in
        --note) [ $# -ge 2 ] || usage; note="$2"; shift 2 ;;
        *) usage ;;
      esac
    done
    exec "$PY" - "$GATE_HOME" "$id" "$file" "$note" <<'PYEOF'
import json, hashlib, sys, pathlib, datetime
item, file, note = sys.argv[2], sys.argv[3], sys.argv[4]
PASS_WORDS = {"PASS", "PASS+NOTES"}
KNOWN = PASS_WORDS | {"FAIL", "BLOCKED"}
f = pathlib.Path.cwd() / ".dev/lifecycle" / "items" / item / "state.json"
vf = pathlib.Path(file)
if not f.exists():
    print("gate.sh: item not opened (no .dev/lifecycle ledger)", file=sys.stderr)
    sys.exit(2)
if not vf.exists():
    print(f"gate.sh: verdict file not found: {file}", file=sys.stderr)
    sys.exit(2)
raw = vf.read_bytes()
try:
    v = json.loads(raw)
    verdict = str(v.get("verdict") or v.get("pass") or "UNKNOWN").upper()
except Exception:
    verdict = "UNPARSEABLE"
ts = datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
state = json.loads(f.read_text())
blocked = state.get("blocked")
if blocked:
    print(f"gate.sh: BLOCKED item {item} — gate {blocked.get('gate')}: "
          f"{blocked.get('reason')} ({blocked.get('ts')}). Resume with: "
          f"gate.sh resume {item} --note \"<human reason>\"", file=sys.stderr)
    sys.exit(4)
budget = state.get("budget", 3)
entry = {"step": len(state["history"]) + 1, "ts": ts, "type": "verdict", "gate": "review",
         "class": "A", "file": file, "sha256": hashlib.sha256(raw).hexdigest()[:16],
         "verdict": verdict}
if note: entry["note"] = note
state["history"].append(entry)
g = state["gates"].get("review", {"class": "A", "verdict": None, "runs": 0})
g["runs"] += 1; g["verdict"] = verdict; g["ts"] = ts; g["file"] = file
if verdict in PASS_WORDS:
    g["fails"] = 0
elif verdict in KNOWN:
    g["fails"] = g.get("fails", 0) + 1
state["gates"]["review"] = g
exit_code = 0 if verdict in PASS_WORDS else (1 if verdict in KNOWN else 2)
if verdict in KNOWN and verdict not in PASS_WORDS and g["fails"] >= budget:
    state["blocked"] = {"gate": "review", "reason": f"{g['fails']} consecutive FAIL verdicts (budget {budget})", "ts": ts}
    state["history"].append({"step": len(state["history"]), "ts": ts, "type": "blocked",
                             "gate": "review", "budget": budget})
    exit_code = 4
f.write_text(json.dumps(state, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
print(f"verdict {item}: {verdict} ({file} sha:{entry['sha256']})")
if exit_code == 4:
    print(f"BLOCKED {item}: {state['blocked']['reason']} — "
          f"gate.sh resume {item} --note \"<human reason>\"")
sys.exit(exit_code)
PYEOF
    ;;

  resume)
    note=""
    while [ $# -gt 0 ]; do
      case "$1" in
        --note) [ $# -ge 2 ] || usage; note="$2"; shift 2 ;;
        *) usage ;;
      esac
    done
    [ -n "$note" ] || die "resume needs --note \"<human reason>\""
    exec "$PY" - "$GATE_HOME" "$id" "$note" <<'PYEOF'
import json, sys, pathlib, datetime
item, note = sys.argv[2], sys.argv[3]
f = pathlib.Path.cwd() / ".dev/lifecycle" / "items" / item / "state.json"
if not f.exists():
    print("gate.sh: item not opened (no .dev/lifecycle ledger)", file=sys.stderr)
    sys.exit(2)
state = json.loads(f.read_text())
blocked = state.get("blocked")
if not blocked:
    print(f"resume {item}: not blocked, nothing to resume")
    sys.exit(0)
ts = datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
was = blocked.get("gate")
state["blocked"] = None
for g in state["gates"].values():
    g["fails"] = 0
state["history"].append({"step": len(state["history"]) + 1, "ts": ts, "type": "resume",
                         "was": was, "note": note})
f.write_text(json.dumps(state, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
print(f"resume {item}: unblocked (was gate {was}) — {note}")
PYEOF
    ;;

  close)
    note=""
    while [ $# -gt 0 ]; do
      case "$1" in
        --note) [ $# -ge 2 ] || usage; note="$2"; shift 2 ;;
        *) usage ;;
      esac
    done
    exec "$PY" - "$GATE_HOME" "$id" "$note" <<'PYEOF'
import json, sys, pathlib, datetime
item, note = sys.argv[2], sys.argv[3]
f = pathlib.Path.cwd() / ".dev/lifecycle" / "items" / item / "state.json"
if not f.exists():
    print("gate.sh: item not opened (no .dev/lifecycle ledger)", file=sys.stderr)
    sys.exit(2)
state = json.loads(f.read_text())
blocked = state.get("blocked")
if blocked:
    print(f"gate.sh: BLOCKED item {item} — gate {blocked.get('gate')}: "
          f"{blocked.get('reason')} ({blocked.get('ts')}). Resume with: "
          f"gate.sh resume {item} --note \"<human reason>\"", file=sys.stderr)
    sys.exit(4)
ts = datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
state["closed"] = ts
entry = {"step": len(state["history"]) + 1, "ts": ts, "type": "close"}
if note: entry["note"] = note
state["history"].append(entry)
f.write_text(json.dumps(state, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
print(f"close {item} at step {entry['step']}")
PYEOF
    ;;

  show)
    exec "$PY" - "$GATE_HOME" "$id" <<'PYEOF'
import json, sys, pathlib
f = pathlib.Path.cwd() / ".dev/lifecycle" / "items" / sys.argv[2] / "state.json"
if not f.exists():
    print("gate.sh: item not opened (no .dev/lifecycle ledger)", file=sys.stderr)
    sys.exit(2)
print(f.read_text())
PYEOF
    ;;

  replay)
    exec "$PY" - "$GATE_HOME" "$id" <<'PYEOF'
import json, subprocess, sys, pathlib, hashlib
item = sys.argv[2]
f = pathlib.Path.cwd() / ".dev/lifecycle" / "items" / item / "state.json"
if not f.exists():
    print("gate.sh: item not opened (no .dev/lifecycle ledger)", file=sys.stderr)
    sys.exit(2)
state = json.loads(f.read_text())
drift = 0
for e in state["history"]:
    if e["type"] == "run":
        proc = subprocess.run(e["argv"], cwd=e["dir"], capture_output=True, text=True)
        same = (proc.returncode == 0) == e["pass"]
        print(f"step {e['step']} run {e['gate']}: recorded {'PASS' if e['pass'] else 'FAIL'} / "
              f"replay exit {proc.returncode} -> {'OK' if same else 'DRIFT'}")
        drift += 0 if same else 1
    elif e["type"] == "verdict":
        vf = pathlib.Path(e["file"])
        h = hashlib.sha256(vf.read_bytes()).hexdigest()[:16] if vf.exists() else "GONE"
        print(f"step {e['step']} verdict {e['gate']}: {e['verdict']} sha:{e['sha256']} / now {h} -> "
              f"{'OK' if h == e['sha256'] else 'DRIFT'}")
        drift += 0 if h == e["sha256"] else 1
    else:
        print(f"step {e['step']} {e['type']}: (no-op)")
print(f"replay {item}: {'CLEAN' if drift == 0 else f'{drift} DRIFT'}")
sys.exit(0 if drift == 0 else 1)
PYEOF
    ;;

  mine)
    exec "$PY" - "$GATE_HOME" <<'PYEOF'
import json, pathlib, sys
sdlc = pathlib.Path.cwd() / ".dev/lifecycle"
if not sdlc.exists():
    print("gate.sh: no .dev/lifecycle ledger (closed)", file=sys.stderr)
    sys.exit(2)
rows = []
states = []
for f in sorted(sdlc.glob("items/*/state.json")):
    s = json.loads(f.read_text())
    states.append(s)
    for g, d in sorted(s.get("gates", {}).items()):
        if d["class"] == "D":
            rows.append((s["id"], g, "D", f"runs={d['runs']} first_pass={d.get('first_pass')} pass={d['pass']}"))
        else:
            rows.append((s["id"], g, "A", f"verdict={d['verdict']} runs={d['runs']}"))
# verdict flips per item: count verdict entries whose outcome differs from previous verdict entry
flips = 0
for s in states:
    vs = [e["verdict"] for e in s["history"] if e["type"] == "verdict"]
    flips += sum(1 for a, b in zip(vs, vs[1:]) if a != b)
blocked = sum(1 for s in states if s.get("blocked"))
if not rows:
    print("mine: empty ledger")
else:
    for r in rows: print(f"{' '.join(map(str, r[:3]))} {r[3]}")
    fp = [r for r in rows if r[2] == "D"]
    first_pass = sum(1 for line in (r[3] for r in fp) if "first_pass=True" in line)
    print(f"mine: D-gates={len(fp)} first_pass={first_pass} first-pass-rate="
          f"{(first_pass / len(fp)):.2f}" if fp else "mine: no D gates")
    print(f"mine: verdict-flips={flips} (disagreement; skip-test rate lives in .audit tsv)")
print(f"mine: blocked-items={blocked}")
PYEOF
    ;;
esac
