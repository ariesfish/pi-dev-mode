import { describe, expect, test } from "bun:test";

import { isForegroundWait, shellText, sleepSeconds } from "./sleep-wait.ts";

// sleep-wait.test.ts — the decision table sleep-wait.ts's docblock promised a
// test file for ("changing one is a visible decision"): every named miss and
// over-block from the token rule, plus the literal-duration grammar. The
// tool_call gate in agent-tools.ts leans on isForegroundWait; this table is
// where its edges are chosen.
describe("isForegroundWait (decision table)", () => {
  test("blocks: sleeps the model should not run while a background agent runs", () => {
    for (const blocked of [
      "sleep 30",
      "sleep 2.5",
      "sleep 1m",
      "sleep 1m30s",
      "sleep infinity",
      "echo first && sleep 30",
      "sleep 30 # wait-for-it",
      'wait; sleep 30; echo done',
      "echo sleep 30", // an echo that only prints the word still blocks: "anywhere in the line" errs toward blocking
    ]) {
      expect(isForegroundWait(blocked)).toBe(true);
    }
  });

  test("passes: sub-two-second sleeps, and waits that are not sleeps", () => {
    for (const allowed of [
      "sleep 1",
      "wait",
      "tail -f build.log",
      "python -m timeit -n 100 'sum(range(10))'",
    ]) {
      expect(isForegroundWait(allowed)).toBe(false);
    }
  });

  // Known misses — documented in the docblock, decided here:
  test("known misses: quoted script bodies, quoted/variable durations, sub-2s poll loops", () => {
    for (const missed of [
      "bash -c 'sleep 30'",
      'sleep "30"',
      "sleep $N",
      "while true; do sleep 1; done", // every sleep is sub-two-second
    ]) {
      expect(isForegroundWait(missed)).toBe(false);
    }
  });

  // Known over-blocks — the price of erring toward blocking, decided here:
  test("known over-blocks: it blocks a sleep already backgrounded through a group or a redirection", () => {
    for (const over of [
      "(sleep 30; echo done) &",
      "sleep 30 > /dev/null &",
      "timeout 5 sleep 30",
    ]) {
      expect(isForegroundWait(over)).toBe(true);
    }
  });

  test("a directly backgrounded sleep passes; `&&` keeps it foreground, so it blocks", () => {
    expect(isForegroundWait("sleep 30 &")).toBe(false);
    expect(isForegroundWait("sleep 30 && echo next")).toBe(true); // `&&` never reads as backgrounding
  });
});

describe("sleepSeconds (literal-duration grammar)", () => {
  test("plain, fractional, unit-combined, infinity; zero when not a literal", () => {
    expect(sleepSeconds("30")).toBe(30);
    expect(sleepSeconds("2.5")).toBe(2.5);
    expect(sleepSeconds("1m")).toBe(60);
    expect(sleepSeconds("1m30s")).toBe(90);
    expect(sleepSeconds("infinity")).toBe(Infinity);
    expect(sleepSeconds('"30"')).toBe(0);
    expect(sleepSeconds("$N")).toBe(0);
  });
});

describe("shellText (what the shell would run)", () => {
  test("quoted strings become \"\", a comment is cut, heredoc bodies are dropped, the opener line is kept", () => {
    expect(shellText('echo "sleep 30" # not a sleep')).toBe('echo "" '); // the space before # is kept
    expect(shellText("cat <<EOF\necho hidden\nEOF\necho after")).toBe("cat <<EOF\necho after");
  });
});
