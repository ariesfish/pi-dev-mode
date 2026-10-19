#!/usr/bin/env bash
# gate.sh — SDLC ledger gates (P5, opt-in). Zero deps beyond bash + python3.
#
# The ledger lives in the TARGET project: .dev/lifecycle/items/<id>/state.json.
# Its absence is the OFF state — every command here refuses (exit 2) without
# one, so a closed ledger never changes skill behavior.
#
# Gate classes (docs/04 P5):
#   D — deterministic script gate (tdd / check / constraints): run cmd, record exit.
#   A — adjudicated gate (review verdict): record file hash + parsed verdict.
#
# Ledger discipline: history is append-only; `replay` re-executes D-class
# history in order and re-hashes A-class verdict files, reporting drift —
# it never mutates state.
set -euo pipefail

GATE_HOME="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PY=python3
command -v "$PY" >/dev/null 2>&1 || { echo "gate.sh: python3 required" >&2; exit 3; }

die() { echo "gate.sh: $*" >&2; exit 2; }
usage() {
  cat <<'EOF'
Usage: gate.sh <command> [args]        (run from the target project root)
  open <id> "<title>"                  open item ledger (.dev/lifecycle/ opt-in)
  run <id> <gate> [-d dir] [--note s] -- <cmd...>
                                       run D-class gate, append history
  verdict <id> --from <verdict.json> [--note s]
                                       record A-class verdict (hash + verdict)
  close <id> [--note s]                close item
  show <id>                            print state (gates + history)
  replay <id>                          re-execute D history, re-hash A; drift report (read-only)
  mine                                 first-pass rate + verdict flips across items
EOF
  exit 2
}

# --- dispatch -------------------------------------------------------------
cmd="${1:-}"; [ $# -gt 0 ] && shift
case "$cmd" in
  open|run|verdict|close|show|replay)
    id="${1:-}"; [ -n "$id" ] || usage; shift || true
    ;;
  mine) ;;
  *) usage ;;
esac

case "$cmd" in
  open)
    title="${1:-}"; [ -n "$title" ] || die "open needs a title"
    exec "$PY" - "$GATE_HOME" "$id" "$title" <<'PYEOF'
import json, sys, pathlib, datetime
gate_home, item, title = sys.argv[1], sys.argv[2], sys.argv[3]
root = pathlib.Path.cwd()
sdlc = root / ".dev/lifecycle"
state_f = sdlc / "items" / item / "state.json"
if state_f.exists():
    sys.exit(f"gate.sh: item {item} already open at {state_f}")
state_f.parent.mkdir(parents=True, exist_ok=True)
readme = sdlc / "README.md"
if not readme.exists():
    readme.write_text(
        "# .dev/lifecycle/ ledger (opt-in)\n\n"
        "Opened by gate.sh (pi-dev-mode P5). Removing/renaming this dir closes the\n"
        "ledger — all skills then behave exactly as P1-P4 (no .dev/lifecycle, no ledger).\n\n"
        "- items/<id>/state.json — gates + append-only history (replayable)\n"
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
state = {"id": item, "title": title, "opened": ts, "closed": None,
         "gates": {}, "history": [{"step": 1, "ts": ts, "type": "open"}]}
state_f.write_text(json.dumps(state, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
print(f"open {item}: {state_f}")
PYEOF
    ;;

  run)
    gate="${1:-}"; [ -n "$gate" ] || usage; shift
    dir="."; note=""
    while [ $# -gt 0 ]; do
      case "$1" in
        -d) dir="$2"; shift 2 ;;
        --note) note="$2"; shift 2 ;;
        --) shift; break ;;
        *) usage ;;
      esac
    done
    [ $# -gt 0 ] || die "run needs a command after --"
    exec "$PY" - "$GATE_HOME" "$id" "$gate" "$dir" "$note" "$@" <<'PYEOF'
import json, subprocess, sys, pathlib, datetime, shlex
item, gate, dir_, note, argv = sys.argv[2], sys.argv[3], sys.argv[4], sys.argv[5], sys.argv[6:]
f = pathlib.Path.cwd() / ".dev/lifecycle" / "items" / item / "state.json"
if not f.exists(): sys.exit("gate.sh: item not opened (no .dev/lifecycle ledger)")
state = json.loads(f.read_text())
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
g["ts"] = ts
state["gates"][gate] = g
f.write_text(json.dumps(state, ensure_ascii=False, indent=2) + "\n")
print(f"run {gate}: {'PASS' if entry['pass'] else 'FAIL'} (exit {proc.returncode}) step {entry['step']}")
sys.exit(0 if entry["pass"] else 1)
PYEOF
    ;;

  verdict)
    file="${1:-}"; [ -n "$file" ] || usage
    case "$file" in --from) file="${2:-}"; shift 2 ;; esac
    shift 2 2>/dev/null || true
    note=""; while [ $# -gt 0 ]; do case "$1" in --note) note="$2"; shift 2;; *) shift;; esac; done
    exec "$PY" - "$GATE_HOME" "$id" "$file" "$note" <<'PYEOF'
import json, hashlib, sys, pathlib, datetime
item, file, note = sys.argv[2], sys.argv[3], sys.argv[4]
f = pathlib.Path.cwd() / ".dev/lifecycle" / "items" / item / "state.json"
vf = pathlib.Path(file)
if not f.exists(): sys.exit("gate.sh: item not opened (no .dev/lifecycle ledger)")
if not vf.exists(): sys.exit(f"gate.sh: verdict file not found: {file}")
raw = vf.read_bytes()
try:
    v = json.loads(raw)
    verdict = str(v.get("verdict") or v.get("pass") or "UNKNOWN").upper()
except Exception:
    verdict = "UNPARSEABLE"
ts = datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
state = json.loads(f.read_text())
entry = {"step": len(state["history"]) + 1, "ts": ts, "type": "verdict", "gate": "review",
         "class": "A", "file": file, "sha256": hashlib.sha256(raw).hexdigest()[:16],
         "verdict": verdict}
if note: entry["note"] = note
state["history"].append(entry)
state["gates"]["review"] = {"class": "A", "verdict": verdict, "ts": ts,
                            "file": file, "runs": state["gates"].get("review", {}).get("runs", 0) + 1}
f.write_text(json.dumps(state, ensure_ascii=False, indent=2) + "\n")
print(f"verdict {item}: {verdict} ({file} sha:{entry['sha256']})")
PYEOF
    ;;

  close)
    note=""; while [ $# -gt 0 ]; do case "$1" in --note) note="$2"; shift 2;; *) shift;; esac; done
    exec "$PY" - "$GATE_HOME" "$id" "$note" <<'PYEOF'
import json, sys, pathlib, datetime
item, note = sys.argv[2], sys.argv[3]
f = pathlib.Path.cwd() / ".dev/lifecycle" / "items" / item / "state.json"
if not f.exists(): sys.exit("gate.sh: item not opened (no .dev/lifecycle ledger)")
state = json.loads(f.read_text())
ts = datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
state["closed"] = ts
entry = {"step": len(state["history"]) + 1, "ts": ts, "type": "close"}
if note: entry["note"] = note
state["history"].append(entry)
f.write_text(json.dumps(state, ensure_ascii=False, indent=2) + "\n")
print(f"close {item} at step {entry['step']}")
PYEOF
    ;;

  show)
    exec "$PY" - "$GATE_HOME" "$id" <<'PYEOF'
import json, sys, pathlib
f = pathlib.Path.cwd() / ".dev/lifecycle" / "items" / sys.argv[2] / "state.json"
if not f.exists(): sys.exit("gate.sh: item not opened (no .dev/lifecycle ledger)")
print(f.read_text())
PYEOF
    ;;

  replay)
    exec "$PY" - "$GATE_HOME" "$id" <<'PYEOF'
import json, subprocess, sys, pathlib, hashlib
item = sys.argv[2]
f = pathlib.Path.cwd() / ".dev/lifecycle" / "items" / item / "state.json"
if not f.exists(): sys.exit("gate.sh: item not opened (no .dev/lifecycle ledger)")
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
import json, pathlib
sdlc = pathlib.Path.cwd() / ".dev/lifecycle"
if not sdlc.exists(): sys.exit("gate.sh: no .dev/lifecycle ledger (closed)")
rows = []
for f in sorted(sdlc.glob("items/*/state.json")):
    s = json.loads(f.read_text())
    gates = s.get("gates", {})
    for g, d in sorted(gates.items()):
        if d["class"] == "D":
            rows.append((s["id"], g, "D", f"runs={d['runs']} first_pass={d.get('first_pass')} pass={d['pass']}"))
        else:
            rows.append((s["id"], g, "A", f"verdict={d['verdict']} runs={d['runs']}"))
# verdict flips per item: count verdict entries whose outcome differs from previous verdict entry
flips = 0
for f in sorted(sdlc.glob("items/*/state.json")):
    s = json.loads(f.read_text())
    vs = [e["verdict"] for e in s["history"] if e["type"] == "verdict"]
    flips += sum(1 for a, b in zip(vs, vs[1:]) if a != b)
if not rows:
    print("mine: empty ledger")
else:
    for r in rows: print(f"{' '.join(map(str, r[:3]))} {r[3]}")
    fp = [r for r in rows if r[2] == "D"]
    first_pass = sum(1 for line in (r[3] for r in fp) if "first_pass=True" in line)
    print(f"mine: D-gates={len(fp)} first_pass={first_pass} first-pass-rate="
          f"{(first_pass / len(fp)):.2f}" if fp else "mine: no D gates")
    print(f"mine: verdict-flips={flips} (disagreement; skip-test rate lives in .audit tsv)")
PYEOF
    ;;
esac
