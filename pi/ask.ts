import type { ExtensionAPI, ExtensionContext, Theme } from "@earendil-works/pi-coding-agent";
import { Type } from "typebox";
import { fuzzyFilter, Input, Key, matchesKey, SelectList, type SelectListTheme, Text, truncateToWidth, type SelectItem, type TUI } from "@earendil-works/pi-tui";

import type { Attention } from "./attention.ts";
import type { OneShot } from "./one-shot.ts";

// Rich ask dialog, native pi-dev implementation. Interaction model:
// - one focus surface: a single Input that doubles as search (list mode) and
//   free-form answer (typing mode), so no focus juggling and IME stays sane
// - fuzzy filtering over option labels (pi-tui fuzzyFilter), prefix-free
// - true multi-select in one interaction: enter toggles, ctrl+enter submits
// - freeform: "Other (type an answer)" row -> typing mode, enter submits
// - per-question context block, collapsed past a threshold, ctrl+x expands
// - optional per-question timeout with live countdown in the header
// The panel renders inline in the editor dock (full-width box, pi-ask-user
// style) at its natural height; the host's overlay path is size-constrained
// and clipped the panel (incomplete + tiny).
// Headless sessions (no UI, print mode, RPC children) refuse in plain text.

export interface AskOption {
  label: string;
  description?: string;
}

export interface AskQuestion {
  question: string;
  header?: string;
  /** Short context shown above the options; collapsed past 4 rendered lines. */
  context?: string;
  /** Seconds; 1..3600. Absent or non-positive disables the countdown. */
  timeout?: number;
  options: AskOption[];
  multiSelect?: boolean;
}

export const OTHER_VALUE = "__other__";
export const OTHER_LABEL = "Other (type an answer)";
export const SUBMIT_VALUE = "__submit__";
export const SUBMIT_LABEL = "Submit";
export const COLLAPSE_THRESHOLD = 4;
export const MAX_TIMEOUT_S = 3600;
const MAX_VISIBLE = 6;

const questionSchema = Type.Object({
  question: Type.String({ description: "The complete question to ask the user" }),
  header: Type.Optional(Type.String({ description: "Very short label for the question (max 12 chars)" })),
  context: Type.Optional(Type.String({ description: "Short context the user needs to weigh the options; collapsed past 4 lines" })),
  timeout: Type.Optional(Type.Number({ description: "Seconds until the question auto-dismisses (1-3600); omit for no timeout" })),
  options: Type.Array(
    Type.Object({ label: Type.String(), description: Type.Optional(Type.String()) }),
    { minItems: 2, maxItems: 4 },
  ),
  multiSelect: Type.Optional(Type.Boolean({ description: "Allow more than one answer" })),
});
const questionParams = Type.Object({ questions: Type.Array(questionSchema, { minItems: 1, maxItems: 4 }) });

export interface AskAnswer {
  question: string;
  answer: string;
  freeform: boolean;
}
export type AskOutcome = AskAnswer | null; // null = dismissed/timeout

type Ui = ExtensionContext["ui"];
type Mode = "list" | "typing";

// --- pure helpers (unit-tested) -------------------------------------------

export function buildItems(options: AskOption[]): SelectItem[] {
  const items: SelectItem[] = options.map((o) => ({ value: o.label, label: o.label, description: o.description }));
  items.push({ value: OTHER_VALUE, label: OTHER_LABEL });
  return items;
}

/** Fuzzy-filtered view of `items` for `query`; empty query keeps order. */
export function filterItems(query: string, items: SelectItem[]): SelectItem[] {
  const q = query.trim();
  if (!q) return items;
  return fuzzyFilter(items, q, (item) => item.label);
}

/** Multi-select rows carry an explicit pick mark so one interaction suffices. */
export function markedItem(item: SelectItem, picked: ReadonlySet<string>, multiSelect: boolean): SelectItem {
  if (!multiSelect || item.value === OTHER_VALUE || item.value === SUBMIT_VALUE) return item;
  const mark = picked.has(item.value) ? "[x]" : "[ ]";
  return { ...item, label: `${mark} ${item.label}` };
}

/** Options plus the submit row, plain-Enter reachable: modifier keys (ctrl+enter)
 * do not survive every terminal relay, a list row always does. */
export function withSubmitRow(items: SelectItem[], multiSelect: boolean, pickedCount: number): SelectItem[] {
  if (!multiSelect || pickedCount === 0) return items;
  return [...items, { value: SUBMIT_VALUE, label: `▸ ${SUBMIT_LABEL} (${pickedCount} selected)` }];
}

/**
 * Context preview lines: past `threshold` rendered lines, keep the first
 * `threshold - 1` lines and append a hint; expansion is the panel's state.
 */
export function contextPreview(lines: string[], threshold = COLLAPSE_THRESHOLD, expanded = false): string[] {
  if (lines.length <= threshold) return lines;
  return expanded ? lines : [...lines.slice(0, threshold - 1), "…"];
}

export function countdownText(remainingMs: number): string {
  const s = Math.max(0, Math.ceil(remainingMs / 1000));
  return `(${s}s)`;
}

/** Escape on a dirty filter clears it first; the second escape cancels. */
export function escapeAction(mode: Mode, filterText: string): "clear-search" | "back-to-list" | "cancel" {
  if (mode === "typing") return "back-to-list";
  return filterText.length > 0 ? "clear-search" : "cancel";
}

export function formatAnswers(outcomes: (AskOutcome | null)[]): {
  text: string;
  allAnswered: boolean;
} {
  const answered = outcomes.filter((o): o is AskAnswer => o !== null);
  const text = answered.map((a) => `"${a.question}"="${a.answer}${a.freeform ? " (freeform answer)" : ""}"`).join(", ");
  return { text, allAnswered: answered.length === outcomes.length && outcomes.length > 0 };
}

/** Inline box frame (pi-ask-user style): top border with optional title. */
export function boxTopBorder(width: number, title?: string): string {
  const inner = Math.max(0, width - 2);
  if (!title || inner < title.length + 4) return `╭${"─".repeat(inner)}╮`;
  const label = ` ${title} `;
  return `╭─${label}${"─".repeat(Math.max(0, inner - label.length - 1))}╮`;
}

export function boxBottomBorder(width: number): string {
  return `╰${"─".repeat(Math.max(0, width - 2))}╯`;
}

export const BOX_BORDER_LEFT = "│ ";
export const BOX_BORDER_RIGHT = " │";
export const BOX_BORDER_OVERHEAD = BOX_BORDER_LEFT.length + BOX_BORDER_RIGHT.length;

// --- dialog ---------------------------------------------------------------

interface Args {
  q: AskQuestion;
  tui: TUI;
  theme: Theme;
  signal: AbortSignal | undefined;
  done: (outcome: AskOutcome) => void;
}

function askPanel({ q, tui, theme, signal, done }: Args) {
  let mode: Mode = "list";
  let expanded = false;
  let disposed = false;
  const picked = new Set<string>();
  const allItems = buildItems(q.options ?? []);
  const multi = q.multiSelect === true;

  const search = new Input({ prompt: "❯ ", placeholder: "type to filter…" });
  const finish = (outcome: AskOutcome) => {
    if (disposed) return;
    disposed = true;
    stopCountdown();
    signal?.removeEventListener("abort", onAbort);
    done(outcome);
  };
  const onAbort = () => finish(null);

  const list = () => {
    const marked = filterItems(search.getValue(), allItems).map((i) => markedItem(i, picked, multi));
    const visible = withSubmitRow(marked, multi, picked.size);
    const sel = new SelectList(visible.length > 0 ? visible : withSubmitRow(allItems, multi, picked.size), MAX_VISIBLE, selectTheme(theme));
    sel.onCancel = () => finish(null);
    return sel;
  };
  let select: SelectList = list();

  const syncFilter = () => {
    const at = select.getSelectedItem();
    select = list();
    if (at) {
      const idx = filterItems(search.getValue(), allItems).findIndex((i) => markedItem(i, picked, multi).label === at.label);
      if (idx >= 0) select.setSelectedIndex(idx);
    }
    invalidate();
  };

  // countdown
  const deadline = q.timeout && q.timeout > 0 ? Date.now() + Math.min(q.timeout, MAX_TIMEOUT_S) * 1000 : 0;
  let remaining = deadline ? deadline - Date.now() : 0;
  let tick: ReturnType<typeof setInterval> | undefined;
  function stopCountdown() {
    if (tick) clearInterval(tick);
    tick = undefined;
  }
  if (deadline) {
    tick = setInterval(() => {
      remaining = deadline - Date.now();
      if (remaining <= 0) finish(null);
      invalidate();
    }, 1000);
  }

  const questionText = new Text("");
  const contextText = new Text("");
  let footer = "";
  const invalidate = () => {
    questionText.invalidate();
    contextText.invalidate();
    search.invalidate();
    select.invalidate();
    tui.requestRender();
  };
  const refresh = () => {
    const badge = deadline ? ` ${theme.fg("error", countdownText(remaining))}` : "";
    questionText.setText(`${theme.fg("accent", q.header ? `${q.header}: ${q.question}` : q.question)}${badge}`);
    contextText.setText("");
    footer =
      mode === "typing"
        ? `${theme.fg("muted", "enter submit · esc back to options")}`
        : [
            theme.fg("muted", "type filters · ↑↓ moves"),
            multi ? theme.fg("muted", "enter toggles · ↓ to Submit row · esc cancel") : theme.fg("muted", "enter selects"),
            q.context ? theme.fg("muted", "ctrl+x context") : "",
            theme.fg("muted", "esc cancel"),
          ]
            .filter(Boolean)
            .join(theme.fg("muted", " · "));
    invalidate();
  };

  const toTyping = () => {
    mode = "typing";
    search.setValue("");
    search.onSubmit = (v) => {
      const t = v.trim();
      if (t) finish({ question: q.question, answer: t, freeform: true });
    };
    search.onEscape = undefined;
    refresh();
  };
  const toList = () => {
    mode = "list";
    search.onSubmit = undefined;
    search.setValue("");
    syncFilter();
    refresh();
  };

  const ctxLines = (width: number) => (q.context ? contextPreview(new Text(q.context).render(width), COLLAPSE_THRESHOLD, expanded) : []);

  const panel = {
    get focused() {
      return true;
    },
    set focused(v: boolean) {
      search.focused = v; // IME: the visible input owns the cursor
    },
    invalidate,
    render(width: number) {
      // Inline panel spans the editor dock: box at full width, content inset
      // by the side borders (pi-ask-user inline layout).
      const box = Math.max(20, width - 2);
      const w = Math.max(16, box - BOX_BORDER_OVERHEAD);
      const border = (s: string) => theme.fg("border", s);
      const frame = (line: string) => `${border(BOX_BORDER_LEFT)}${truncateToWidth(line, w, "", true)}${border(BOX_BORDER_RIGHT)}`;
      const lines: string[] = [];
      lines.push(border(boxTopBorder(box, "ask_user")));
      lines.push(...questionText.render(w).map(frame));
      const cl = ctxLines(w);
      if (q.context) {
        lines.push(...cl.map((l) => frame(theme.fg("muted", l))));
        if (cl.length < contextPreview(new Text(q.context).render(w), COLLAPSE_THRESHOLD, true).length) {
          lines.push(frame(theme.fg("muted", expanded ? "(ctrl+x collapse context)" : "(ctrl+x expand context)")));
        }
      }
      lines.push(frame(""));
      if (mode === "typing") {
        lines.push(...search.render(w).map(frame));
        lines.push(frame(""));
        lines.push(frame(footer));
      } else {
        lines.push(...search.render(w).map(frame));
        lines.push(...select.render(w).map(frame));
        if (multi && picked.size > 0) lines.push(frame(theme.fg("success", `${picked.size} selected`)));
        lines.push(frame(""));
        lines.push(frame(footer));
      }
      lines.push(border(boxBottomBorder(box)));
      return lines;
    },
    handleInput(data: string) {
      if (signal?.aborted) return;
      if (matchesKey(data, "ctrl+c") || matchesKey(data, Key.escape)) {
        const action = escapeAction(mode, search.getValue());
        if (action === "cancel") return finish(null);
        if (action === "back-to-list") return toList();
        search.setValue("");
        syncFilter();
        return;
      }
      if (mode === "typing") {
        search.handleInput(data);
        invalidate();
        return;
      }
      if (matchesKey(data, Key.tab) || matchesKey(data, "ctrl+x")) {
        if (matchesKey(data, "ctrl+x")) {
          expanded = !expanded;
          invalidate();
        }
        return;
      }
      if (multi && matchesKey(data, "ctrl+enter")) {
        if (picked.size > 0) {
          return finish({
            question: q.question,
            answer: [...picked].join(", "),
            freeform: false,
          });
        }
        // nothing picked yet: fall through to plain enter on the highlighted row
      }
      if (
        matchesKey(data, Key.up) ||
        matchesKey(data, Key.down) ||
        matchesKey(data, Key.enter) ||
        matchesKey(data, Key.pageUp) ||
        matchesKey(data, Key.pageDown)
      ) {
        if (matchesKey(data, Key.enter)) {
          const at = select.getSelectedItem();
          if (!at) return;
          if (at.value === SUBMIT_VALUE) {
            return finish({
              question: q.question,
              answer: [...picked].join(", "),
              freeform: false,
            });
          }
          if (at.value === OTHER_VALUE) return toTyping();
          if (multi) {
            if (picked.has(at.value)) picked.delete(at.value);
            else picked.add(at.value);
            syncFilter();
            return;
          }
          return finish({ question: q.question, answer: at.value, freeform: false });
        }
        select.handleInput(data);
        invalidate();
        return;
      }
      search.handleInput(data); // printable, backspace, word-kill, IME: the search box
      syncFilter();
    },
    dispose() {
      stopCountdown();
      signal?.removeEventListener("abort", onAbort);
    },
  };
  signal?.addEventListener("abort", onAbort, { once: true });
  refresh();
  return panel;
}

function selectTheme(theme: Theme): SelectListTheme {
  return {
    selectedPrefix: (t) => theme.fg("accent", t),
    selectedText: (t) => theme.fg("accent", t),
    description: (t) => theme.fg("muted", t),
    scrollInfo: (t) => theme.fg("muted", t),
    noMatch: (t) => theme.fg("warning", t),
  };
}

async function askOne(ui: Ui, q: AskQuestion, signal: AbortSignal | undefined): Promise<AskOutcome> {
  // Inline (no overlay options): the host swaps the component into the editor
  // dock at its natural height, so the whole panel is visible. The overlay
  // path is size-constrained in the host TUI and clips the panel.
  return await ui.custom<AskOutcome>((tui, theme, _kb, done) => {
    return askPanel({ q, tui, theme, signal, done });
  });
}

// model-only exposure keeps the tool declared under codemode.mode "only".
export function registerAsk(pi: ExtensionAPI, oneShot: OneShot, attention?: Attention): void {
  pi.registerTool({
    name: "ask_user_question",
    label: "Ask user",
    exposure: "model-only",
    description:
      "Ask the user 1-4 structured questions, each with 2-4 options plus a freeform answer row: searchable list, true multi-select in one interaction, optional per-question context and timeout. Use it for genuine preference calls the user must make.",
    parameters: questionParams,
    executionMode: "sequential",
    async execute(_id, params, signal, _onUpdate, ctx) {
      // An rpc child reports a UI, but its parent cancels every dialog, so asking
      // could only report a dismissal.
      if (!ctx.hasUI || oneShot.exits(ctx)) {
        throw new Error(
          "ask_user_question needs an interactive UI, and this session has none. Ask the user in plain text instead and wait for the reply.",
        );
      }
      const outcomes: (AskOutcome | null)[] = [];
      // The dialog is a custom component, so pi core's blocked reporting (which
      // knows select/confirm/input/editor) does not see it: say it ourselves.
      const questions = params.questions as AskQuestion[];
      attention?.askOpened(questions[0]?.question ?? "");
      try {
        for (const q of questions) {
          outcomes.push(await askOne(ctx.ui, q, signal));
          if (outcomes[outcomes.length - 1] === null) break;
        }
      } finally {
        attention?.askClosed();
      }
      const { text, allAnswered } = formatAnswers(outcomes);
      const answered = text ? `User has answered your questions: ${text}. ` : "";
      const status = allAnswered
        ? "You can now continue with the user's answers in mind."
        : outcomes[0] === null && outcomes.length === 1
          ? "The user dismissed the question without answering."
          : "The user dismissed the remaining questions without answering.";
      return {
        content: [{ type: "text", text: answered + status }],
        details: { outcomes, dismissed: !allAnswered },
      };
    },
  });
}
