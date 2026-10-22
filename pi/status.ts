// pi/status.ts — the status footer (T-102): the default footer answers every
// question in shorthand (↑k ↓k R…k CH…) and has no word to say about the
// background agents this package runs. This file replaces it (OUR FILE, not
// vendored) with: a model segment on the left (◆ provider/model · effort),
// icon-led stats on the right (↑ in, ↓ out, ≡ cache hit, ◔ ctx, $ cost), live
// agent segments, and the other extensions' setStatus texts unchanged below.
//
// Data: everything shown is built by a pure function over records and session
// entries (tested in status.test.ts); the component only assembles, colors,
// and fits. Agent state is re-read only at two deliberate points — the
// persist funnel's onChange hook (agents.ts) and a 30s tick — because
// AgentRunner.list() may probe processes (fate checks spawn `ps` on macOS),
// never per frame.
import { isAbsolute, relative, resolve } from "node:path";
import type { AgentRecord } from "./agents.ts";
import type { ExtensionAPI, SessionEntry } from "@earendil-works/pi-coding-agent";
import { truncateToWidth, visibleWidth } from "@earendil-works/pi-tui";

/** Every glyph the footer prints; width 1 pinned by test. */
export const ICONS = {
  model: "◆",
  in: "↑",
  out: "↓",
  cache: "≡",
  ctx: "◔",
  done: "✓",
  failed: "✗",
  stopped: "–",
} as const;

/** Refresh cadence for the agents line (elapsed minutes, missed records). */
const TICK_MS = 30_000;
/** Display caps for the agents line; the truth stays in the counts. */
const RUNNING_MAX = 6;
const ENDED_MAX = 3;

/** What the runner hands the footer; AgentRunner satisfies this structurally. */
export interface StatusSource {
  list(): AgentRecord[];
  /** Called at the end of every persist — the funnel for state changes. */
  onChange?: () => void;
}

// ─── numbers ────────────────────────────────────────────────────────────────

/** Same shape as pi's built-in footer: 999 / 1.0k / 12k / 123k / 1.2M. */
export function formatTokens(count: number): string {
  if (count < 1000) return count.toString();
  if (count < 10000) return `${(count / 1000).toFixed(1)}k`;
  if (count < 1_000_000) return `${Math.round(count / 1000)}k`;
  if (count < 10_000_000) return `${(count / 1_000_000).toFixed(1)}M`;
  return `${Math.round(count / 1_000_000)}M`;
}

// ─── usage totals ───────────────────────────────────────────────────────────

export interface UsageTotals {
  input: number;
  output: number;
  cacheRead: number;
  cacheWrite: number;
  cost: number;
  /** Latest assistant prompt's cache hit, percent; undefined before one. */
  cacheHitRate?: number;
}

/** Session-wide usage, the same entries and the same arithmetic as pi's footer. */
export function summarizeUsage(entries: readonly SessionEntry[]): UsageTotals {
  const totals: UsageTotals = { input: 0, output: 0, cacheRead: 0, cacheWrite: 0, cost: 0 };
  let latestHit: number | undefined;
  for (const entry of entries) {
    const usage =
      entry.type === "usage"
        ? entry.usage
        : entry.type === "message" && entry.message.role === "assistant"
          ? entry.message.usage
          : entry.type === "message" && entry.message.role === "toolResult" && entry.message.usage
            ? entry.message.usage
            : (entry.type === "branch_summary" || entry.type === "compaction") && entry.usage
              ? entry.usage
              : undefined;
    if (!usage) continue;
    totals.input += usage.input;
    totals.output += usage.output;
    totals.cacheRead += usage.cacheRead;
    totals.cacheWrite += usage.cacheWrite;
    totals.cost += usage.cost.total;
    if (entry.type === "message" && entry.message.role === "assistant") {
      const prompt = usage.input + usage.cacheRead + usage.cacheWrite;
      latestHit = prompt > 0 ? (usage.cacheRead / prompt) * 100 : undefined;
    }
  }
  if (latestHit !== undefined) totals.cacheHitRate = latestHit;
  return totals;
}

// ─── line 2: model left, stats right ────────────────────────────────────────

/** The scarce half of the context line: icon-led tokens, ctx before cost, zeros omitted. */
export function statsTokens(
  totals: UsageTotals,
  context?: { percent: number | null; contextWindow: number },
): { tokens: string[]; ctxIndex: number } {
  const tokens: string[] = [];
  if (totals.input > 0) tokens.push(`${ICONS.in}${formatTokens(totals.input)}`);
  if (totals.output > 0) tokens.push(`${ICONS.out}${formatTokens(totals.output)}`);
  if ((totals.cacheRead > 0 || totals.cacheWrite > 0) && totals.cacheHitRate !== undefined)
    tokens.push(`${ICONS.cache}${totals.cacheHitRate.toFixed(1)}%`);
  const ctxIndex = tokens.length;
  if (context) {
    const percent = context.percent === null ? "?" : context.percent.toFixed(1);
    tokens.push(`${ICONS.ctx}${percent}%/${formatTokens(context.contextWindow)}`);
  }
  if (totals.cost > 0) tokens.push(`$${totals.cost.toFixed(3)}`);
  return { tokens, ctxIndex: context ? ctxIndex : -1 };
}

/** The model half: ◆ provider/model · effort (effort only when the model reasons). */
export function modelToken(
  model: { provider: string; id: string; reasoning: boolean } | undefined,
  thinkingLevel: string | undefined,
): string {
  if (!model) return `${ICONS.model} no-model`;
  const base = `${ICONS.model} ${model.provider}/${model.id}`;
  return model.reasoning ? `${base} · ${thinkingLevel ?? "off"}` : base;
}

function homeRelative(cwd: string): string {
  const home = process.env.HOME || process.env.USERPROFILE;
  if (!home) return cwd;
  const rel = relative(resolve(home), resolve(cwd));
  if (rel === "") return "~";
  return !rel.startsWith("..") && !isAbsolute(rel) ? `~/${rel.split("\\").join("/")}` : cwd;
}

// ─── the agents line ────────────────────────────────────────────────────────

export function elapsed(startedAt: string, now: number): string {
  const ms = Math.max(0, now - Date.parse(startedAt));
  const seconds = Math.floor(ms / 1000);
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h${String(minutes % 60).padStart(2, "0")}m`;
  return `${Math.floor(hours / 24)}d${hours % 24}h`;
}

export interface AgentItem {
  id: string;
  description: string;
  status: "running" | "completed" | "failed" | "stopped";
  startedAt?: string;
}

export interface AgentsSummary {
  /** Truth in the counts, not the items: items are the display cap. */
  running: number;
  ended: number;
  items: AgentItem[];
  more: number;
}

/** Running oldest first, ended newest first, both capped; `more` counts the clipped. */
export function agentsSummary(records: readonly AgentRecord[]): AgentsSummary | undefined {
  if (records.length === 0) return undefined;
  const running = records
    .filter((r): r is Extract<AgentRecord, { status: "running" }> => r.status === "running")
    .sort((a, b) => a.agent.startedAt.localeCompare(b.agent.startedAt));
  const ended = records
    .filter((r): r is Extract<AgentRecord, { status: "completed" | "failed" | "stopped" }> => r.status !== "running")
    .sort((a, b) => b.endedAt.localeCompare(a.endedAt));
  const items: AgentItem[] = [
    ...running.slice(0, RUNNING_MAX).map((r) => ({ id: r.agent.id, description: r.agent.description, status: "running" as const, startedAt: r.agent.startedAt })),
    ...ended.slice(0, ENDED_MAX).map((r) => ({ id: r.agent.id, description: r.agent.description, status: r.status })),
  ];
  return {
    running: running.length,
    ended: ended.length,
    items,
    more: Math.max(0, running.length - RUNNING_MAX) + Math.max(0, ended.length - ENDED_MAX),
  };
}

export interface AgentSegment {
  text: string;
  color: "dim" | "accent" | "success" | "error";
}

/** The agents line as color-named segments: prefix, items, +more. */
export function agentSegments(summary: AgentsSummary, now: number): AgentSegment[] {
  const prefix =
    summary.running > 0
      ? summary.ended > 0
        ? `agents ${summary.running}/${summary.running + summary.ended} running`
        : `agents ${summary.running} running`
      : `agents ${summary.ended} ended`;
  const segments: AgentSegment[] = [{ text: prefix, color: "dim" }];
  for (const item of summary.items) {
    if (item.status === "running") segments.push({ text: `${item.description} (${elapsed(item.startedAt ?? "", now)})`, color: "accent" });
    else if (item.status === "completed") segments.push({ text: `${ICONS.done} ${item.description}`, color: "success" });
    else if (item.status === "failed") segments.push({ text: `${ICONS.failed} ${item.description}`, color: "error" });
    else segments.push({ text: `${ICONS.stopped} ${item.description}`, color: "dim" });
  }
  if (summary.more > 0) segments.push({ text: `+${summary.more}`, color: "dim" });
  return segments;
}

// ─── the footer ─────────────────────────────────────────────────────────────

/**
 * Replaces the TUI footer when this session is the parent (depth 0, interactive
 * mode). Re-installed on every session_start, so a switched session rebinds a
 * fresh ctx and a /reload (which drops custom footers) gets its footer back.
 */
export function registerStatusFooter(pi: ExtensionAPI, runner: StatusSource, settings: { depth: number }): void {
  if (settings.depth !== 0) return;
  let redraw: (() => void) | undefined;
  const notify = () => redraw?.();
  const existing = runner.onChange;
  runner.onChange = existing ? () => (existing(), notify()) : notify;

  pi.on("session_start", (_event, ctx) => {
    if (ctx.mode !== "tui") return;
    ctx.ui.setFooter((tui, theme, footerData) => {
      let dirty = true;
      let agents: AgentsSummary | undefined;
      let stats: { key: string; totals: UsageTotals; context: { percent: number | null; contextWindow: number } | undefined } | undefined;
      const markDirty = () => {
        dirty = true;
        tui.requestRender();
      };
      redraw = markDirty;
      const offBranch = footerData.onBranchChange(() => tui.requestRender());
      const tick = setInterval(markDirty, TICK_MS);

      return {
        dispose() {
          clearInterval(tick);
          offBranch();
          if (redraw === markDirty) redraw = undefined;
        },
        invalidate() {},
        render(width: number): string[] {
          const lines: string[] = [];
          const session = ctx.sessionManager;
          let line2: string;

          // Line 1: cwd (branch) • session name
          let pwd = homeRelative(session.getCwd());
          const branch = footerData.getGitBranch();
          if (branch) pwd += ` (${branch})`;
          const name = session.getSessionName();
          if (name) pwd += ` • ${name}`;
          lines.push(truncateToWidth(theme.fg("dim", pwd), width, theme.fg("dim", "…")));

          // Line 2: ◆ provider/model · effort <pad> ↑in ↓out ≡cache ◔ctx $cost
          const key = `${session.getSessionId()}|${session.getLeafId()}|${session.getEntryCount()}|${ctx.model?.id ?? "-"}`;
          if (stats?.key !== key) {
            const usage = ctx.getContextUsage();
            stats = {
              key,
              totals: summarizeUsage(session.getEntries()),
              context: usage ? { percent: usage.percent, contextWindow: usage.contextWindow } : undefined,
            };
          }
          const leftPlain = modelToken(ctx.model, ctx.thinkingLevel);
          const { tokens, ctxIndex } = statsTokens(stats.totals, stats.context);
          const rightVisible = tokens.join(" ");
          // Fit on plain text first (default footer arithmetic), color after:
          // plain left, plain right, an absolute ctx range within the right side.
          const leftWidth = visibleWidth(leftPlain);
          let plainLeft = leftPlain;
          let plainRight = rightVisible;
          if (rightVisible !== "" && leftWidth + 2 + visibleWidth(rightVisible) <= width) {
            plainLeft = leftPlain + " ".repeat(width - leftWidth - visibleWidth(rightVisible));
          } else if (rightVisible !== "" && width - leftWidth - 2 > 0) {
            plainRight = truncateToWidth(rightVisible, width - leftWidth - 2, "");
            plainLeft = leftPlain + " ".repeat(Math.max(0, width - leftWidth - visibleWidth(plainRight)));
          } else {
            plainRight = "";
            plainLeft = truncateToWidth(leftPlain, width, "…");
          }
          let rightStart = 0;
          for (let i = 0; i < ctxIndex; i++) rightStart += visibleWidth(tokens[i]) + 1;
          const ctxEnd = rightStart + (ctxIndex >= 0 ? visibleWidth(tokens[ctxIndex]) : 0);
          const percent = stats.context?.percent ?? null;
          const ctxColor = percent === null || percent <= 70 ? undefined : percent > 90 ? "error" : "warning";
          // fg() emits a reset, so an outer dim wrapper drops: dim the slices
          // around the colored ctx token instead of wrapping the whole line.
          line2 =
            theme.fg("dim", plainLeft + plainRight.slice(0, rightStart)) +
            (ctxIndex >= 0 && ctxColor ? theme.fg(ctxColor, plainRight.slice(rightStart, ctxEnd)) : plainRight.slice(rightStart, ctxEnd)) +
            theme.fg("dim", plainRight.slice(ctxEnd));
          lines.push(truncateToWidth(line2, width, "…"));

          // Line 3: agents (only when there are any)
          if (dirty) {
            agents = agentsSummary(runner.list());
            dirty = false;
          }
          if (agents && agents.running + agents.ended > 0) {
            const parts: string[] = [];
            for (const [index, segment] of agentSegments(agents, Date.now()).entries()) {
              if (index > 0) parts.push(theme.fg("dim", " · "));
              parts.push(theme.fg(segment.color, segment.text));
            }
            lines.push(truncateToWidth(parts.join(""), width, theme.fg("dim", "…")));
          }

          // Line 4: other extensions' setStatus texts, pi's own footer order
          const statuses = footerData.getExtensionStatuses();
          if (statuses.size > 0) {
            const text = [...statuses.entries()]
              .sort(([a], [b]) => a.localeCompare(b))
              .map(([, t]) => t.replace(/[\r\n\t]/g, " ").replace(/ +/g, " ").trim())
              .join(" ");
            lines.push(truncateToWidth(text, width, theme.fg("dim", "…")));
          }
          return lines;
        },
      };
    });
  });
}
