import { describe, expect, test } from "bun:test";

import {
  BOX_BORDER_OVERHEAD,
  boxBottomBorder,
  boxTopBorder,
  buildItems,
  contextPreview,
  countdownText,
  escapeAction,
  filterItems,
  formatAnswers,
  markedItem,
  OTHER_LABEL,
  OTHER_VALUE,
  SUBMIT_VALUE,
  withSubmitRow,
} from "./ask.ts";

describe("buildItems", () => {
  test("appends the freeform pseudo-option last", () => {
    const items = buildItems([
      { label: "Redis", description: "fast" },
      { label: "In-memory" },
    ]);
    expect(items.map((i) => i.value)).toEqual(["Redis", "In-memory", OTHER_VALUE]);
    expect(items[2].label).toBe(OTHER_LABEL);
    expect(items[0].description).toBe("fast");
  });
});

describe("filterItems", () => {
  const items = buildItems([
    { label: "Redis cache" },
    { label: "In-memory cache" },
    { label: "File cache" },
  ]);
  test("empty query preserves order and length", () => {
    expect(filterItems("", items)).toHaveLength(4);
    expect(filterItems("   ", items)).toHaveLength(4);
  });
  test("fuzzy matches substrings in order, not consecutive", () => {
    const got = filterItems("rc", items);
    expect(got[0]?.value).toBe("Redis cache");
  });
  test("subsequence keeps 'cache' rows reachable", () => {
    const got = filterItems("imc", items);
    expect(got.map((i) => i.value)).toContain("In-memory cache");
  });
  test("no match returns empty (panel falls back to full list)", () => {
    expect(filterItems("zzz", items)).toHaveLength(0);
  });
});

describe("markedItem", () => {
  test("multi-select prefixes picks, single-select stays bare, OTHER never marked", () => {
    expect(markedItem({ value: "a", label: "Alpha" }, new Set(["a"]), true).label).toBe("[x] Alpha");
    expect(markedItem({ value: "a", label: "Alpha" }, new Set(), true).label).toBe("[ ] Alpha");
    expect(markedItem({ value: "a", label: "Alpha" }, new Set(["a"]), false).label).toBe("Alpha");
    expect(markedItem({ value: OTHER_VALUE, label: OTHER_LABEL }, new Set([OTHER_VALUE]), true).label).toBe(OTHER_LABEL);
  });
});

describe("contextPreview", () => {
  test("short context stays whole", () => {
    expect(contextPreview(["a", "b"])).toEqual(["a", "b"]);
  });
  test("long context collapses to threshold-1 lines plus ellipsis unless expanded", () => {
    const long = ["1", "2", "3", "4", "5"];
    expect(contextPreview(long)).toEqual(["1", "2", "3", "…"]);
    expect(contextPreview(long, 4, true)).toEqual(long);
    // exactly at threshold: stays whole
    expect(contextPreview(["1", "2", "3", "4"])).toEqual(["1", "2", "3", "4"]);
  });
});

describe("countdownText", () => {
  test("rounds up to seconds and clamps at zero", () => {
    expect(countdownText(1000)).toBe("(1s)");
    expect(countdownText(1)).toBe("(1s)");
    expect(countdownText(0)).toBe("(0s)");
    expect(countdownText(-5)).toBe("(0s)");
    expect(countdownText(65_000)).toBe("(65s)");
  });
});

describe("escapeAction", () => {
  test("dirty filter clears first, clean filter cancels, typing returns to list", () => {
    expect(escapeAction("list", "red")).toBe("clear-search");
    expect(escapeAction("list", "")).toBe("cancel");
    expect(escapeAction("typing", "partial answer")).toBe("back-to-list");
  });
});

describe("withSubmitRow", () => {
  test("submit row appears only in multi-select with at least one pick", () => {
    const items = buildItems([{ label: "A" }, { label: "B" }]);
    expect(withSubmitRow(items, false, 2)).toBe(items);
    expect(withSubmitRow(items, true, 0)).toBe(items);
    const got = withSubmitRow(items, true, 2);
    expect(got.at(-1)?.value).toBe(SUBMIT_VALUE);
    expect(got.at(-1)?.label).toContain("2 selected");
  });
});

describe("box borders", () => {
  test("top border with a title embeds it, without falls back to plain", () => {
    expect(boxTopBorder(14, "ask_user")).toBe("╭─ ask_user ─╮");
    expect(boxTopBorder(12)).toBe("╭──────────╮");
    expect(boxTopBorder(4, "longer title than width")).toBe("╭──╮");
  });
  test("bottom border matches width", () => {
    expect(boxBottomBorder(12)).toBe("╰──────────╯");
    expect(boxBottomBorder(2)).toBe("╰╯");
  });
  test("overhead is the two side borders", () => {
    expect(BOX_BORDER_OVERHEAD).toBe(4);
  });
});

describe("formatAnswers", () => {
  test("single-choice answer formats without marker", () => {
    const got = formatAnswers([{ question: "Q1", answer: "Redis", freeform: false }]);
    expect(got.text).toBe('"Q1"="Redis"');
    expect(got.allAnswered).toBe(true);
  });
  test("freeform answer carries the marker", () => {
    const got = formatAnswers([{ question: "Q1", answer: "use nginx", freeform: true }]);
    expect(got.text).toBe('"Q1"="use nginx (freeform answer)"');
  });
  test("batch joins with commas; any dismissal flips allAnswered", () => {
    const got = formatAnswers([
      { question: "A", answer: "x", freeform: false },
      { question: "B", answer: "y, z", freeform: false },
    ]);
    expect(got.text).toBe('"A"="x", "B"="y, z"');
    expect(got.allAnswered).toBe(true);
    const partial = formatAnswers([{ question: "A", answer: "x", freeform: false }, null]);
    expect(partial.allAnswered).toBe(false);
    expect(partial.text).toBe('"A"="x"');
  });
  test("all dismissed yields empty text and not allAnswered", () => {
    const got = formatAnswers([null]);
    expect(got.text).toBe("");
    expect(got.allAnswered).toBe(false);
  });
});
