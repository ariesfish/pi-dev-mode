// pi/status.ts — the status bar (T-103..T-105): one nerd-icon status line
// ABOVE the editor (📁 path (branch) ↑in ↓out ⚡cache · 12-cell ctx meter ·
// used/window % · right-aligned 🤖-style provider model effort), the agents
// line BELOW the editor, and the other extensions' setStatus texts in the
// footer. Layout, field order, spacing, and palette follow the 2026-10-22
// reference screenshot (see .dev/feature-statusbar/spec.md); the built-in
// footer (↑k ↓k R…k CH… hints) is replaced by OUR file (not vendored) — it
// has no word to say about the background agents this package runs, and its
// token/context line would duplicate this bar.
//
// Data: everything shown is built by pure functions over records and session
// entries (tested in status.test.ts); the components only assemble, color,
// and fit. Agent state is re-read only at two deliberate points — the
// persist funnel's onChange hook (agents.ts) and a 30s tick — because
// AgentRunner.list() may probe processes (fate checks spawn `ps` on macOS),
// never per frame.
import { isAbsolute, relative, resolve } from "node:path";
import type { AgentRecord } from "./agents.ts";
import type { ExtensionAPI, SessionEntry } from "@earendil-works/pi-coding-agent";
import { mixColors, truncateToWidth, visibleWidth, type Color } from "@earendil-works/pi-tui";

/** Every nerd-font glyph the bar prints; width 1 pinned by test. U+26A1 (the
 * screenshot's hollow bolt) is width 2 in pi-tui's width table, so the hollow
 * bolt is nf-oct-zap. All codepoints verified against the installed
 * JetBrainsMono Nerd Font (fc-list :charset=). */
export const ICONS = {
  folder: "\uF07B", // nf-fa-folder
  in: "\uF062", // nf-fa-arrow_up
  out: "\uF063", // nf-fa-arrow_down
  cache: "\uF26A", // nf-oct-zap — hollow bolt
  model: "\uF544", // nf-fa-robot
  running: "\uF1CE", // nf-fa-circle_o_notch
  done: "\uF00C", // nf-fa-check
  failed: "\uF00D", // nf-fa-times
  stopped: "\uF04D", // nf-fa-stop
  meterFill: "\u2588", // █ solid cell
  meterTrack: "\u283F", // ⠿ braille dot lattice
} as const;

/** Refresh cadence for the agents line (elapsed minutes, missed records). */
const TICK_MS = 30_000;
/** Display caps for the agents line; the truth stays in the counts. */
const RUNNING_MAX = 6;
const ENDED_MAX = 3;

/** What the runner hands the bar; AgentRunner satisfies this structurally. */
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

// ─── the status line: pure segments ─────────────────────────────────────────

/** How the renderer colors a segment; meter specials resolve via theme.style. */
export type StatusColor = "plain" | "dim" | "success" | "accent" | "text" | "meterFill" | "meterTrack";

export interface StatusSegment {
  text: string;
  color: StatusColor;
}

/** The context meter is 12 cells in the reference screenshot. */
export const METER_WIDTH = 12;

/** █ fill on a ⠿ dot lattice; percent null renders an empty track. */
export function meterSegments(percent: number | null): StatusSegment[] {
  const filled =
    percent === null ? 0 : Math.min(METER_WIDTH, Math.max(0, Math.round((percent / 100) * METER_WIDTH)));
  const segments: StatusSegment[] = [];
  if (filled > 0) segments.push({ text: ICONS.meterFill.repeat(filled), color: "meterFill" });
  if (METER_WIDTH - filled > 0)
    segments.push({ text: ICONS.meterTrack.repeat(METER_WIDTH - filled), color: "meterTrack" });
  return segments;
}

/** Icon-led stats in screenshot order (↑ in, ↓ out, ⚡ cache), zeros omitted. */
export function usageSegments(totals: UsageTotals): StatusSegment[] {
  const segments: StatusSegment[] = [];
  if (totals.input > 0) segments.push({ text: `  ${ICONS.in}${formatTokens(totals.input)}`, color: "success" });
  if (totals.output > 0) segments.push({ text: `  ${ICONS.out}${formatTokens(totals.output)}`, color: "accent" });
  const cache = totals.cacheRead + totals.cacheWrite;
  if (cache > 0) segments.push({ text: `  ${ICONS.cache}${formatTokens(cache)}`, color: "text" });
  return segments;
}

/** The left half of the status line, in the reference screenshot's field order. */
export function statusSegments(
  totals: UsageTotals,
  context: { percent: number | null; contextWindow: number } | undefined,
  pwd: string,
  identity: string | undefined,
): StatusSegment[] {
  const segments: StatusSegment[] = [{ text: `${ICONS.folder} ${pwd}`, color: "dim" }];
  if (identity) segments.push({ text: ` (${identity})`, color: "dim" });
  segments.push(...usageSegments(totals));
  if (context) {
    // Wide gap before the meter once stats exist, single space otherwise.
    segments.push({ text: segments.length > 1 ? "     " : " ", color: "plain" });
    segments.push(...meterSegments(context.percent));
    const used =
      context.percent === null ? "?" : formatTokens(Math.round((context.percent / 100) * context.contextWindow));
    segments.push({ text: `  ${used}/${formatTokens(context.contextWindow)}`, color: "dim" });
    if (context.percent !== null) segments.push({ text: ` ${context.percent.toFixed(1)}%`, color: "dim" });
  }
  return segments;
}

/** The right-aligned half: robot icon, provider model effort (effort only when the model reasons). */
export function modelSegment(
  model: { provider: string; id: string; reasoning: boolean } | undefined,
  thinkingLevel: string | undefined,
): StatusSegment {
  const name = model ? `${model.provider} ${model.id}` : "no-model";
  const effort = model?.reasoning ? ` ${thinkingLevel ?? "off"}` : "";
  return { text: `${ICONS.model} ${name}${effort}`, color: "dim" };
}

// ─── line fitting (pure, test-pinned) ───────────────────────────────────────

export interface FittedLine {
  left: string;
  right: string;
  /** Spaces between left and right; 0 only when the right side was dropped. */
  gap: number;
}

/** Right-aligned model segment, flexible gap, right truncates first, then the
 * left's tail (meter/ctx give way, the path survives). */
export function fitStatusLine(leftPlain: string, rightPlain: string, width: number): FittedLine {
  const leftWidth = visibleWidth(leftPlain);
  const rightWidth = visibleWidth(rightPlain);
  if (leftWidth + rightWidth + 1 <= width) {
    return { left: leftPlain, right: rightPlain, gap: width - leftWidth - rightWidth };
  }
  if (leftWidth + 1 < width) {
    const right = truncateToWidth(rightPlain, width - leftWidth - 1, "");
    return { left: leftPlain, right, gap: width - leftWidth - visibleWidth(right) };
  }
  return { left: truncateToWidth(leftPlain, width, "…"), right: "", gap: 0 };
}

// ─── theme glue ─────────────────────────────────────────────────────────────

/** The slice of Theme the bar needs; structural so tests can fake it. */
export interface StatusTheme {
  fg(color: "dim" | "success" | "accent", text: string): string;
  style(text: string, options: { fg: Color; bg: Color }): string;
  colors: Readonly<{ success: Color; dim: Color; toolSuccessBg: Color }>;
}

/** Segment color → theme call. Meter fill/track sit on the dark green plate
 * (toolSuccessBg ≈ the reference's #0D2219); the track is success dimmed down. */
export function colorize(segment: StatusSegment, theme: StatusTheme): string {
  switch (segment.color) {
    case "plain":
    case "text":
      return segment.text;
    case "meterFill":
      return theme.style(segment.text, { fg: theme.colors.success, bg: theme.colors.toolSuccessBg });
    case "meterTrack":
      return theme.style(segment.text, {
        fg: mixColors(theme.colors.success, theme.colors.dim, 0.55),
        bg: theme.colors.toolSuccessBg,
      });
    default:
      return theme.fg(segment.color, segment.text);
  }
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
    if (item.status === "running")
      segments.push({ text: `${ICONS.running} ${item.description} (${elapsed(item.startedAt ?? "", now)})`, color: "accent" });
    else if (item.status === "completed") segments.push({ text: `${ICONS.done} ${item.description}`, color: "success" });
    else if (item.status === "failed") segments.push({ text: `${ICONS.failed} ${item.description}`, color: "error" });
    else segments.push({ text: `${ICONS.stopped} ${item.description}`, color: "dim" });
  }
  if (summary.more > 0) segments.push({ text: `+${summary.more}`, color: "dim" });
  return segments;
}

// ─── the bar: three slots around the editor ─────────────────────────────────

/**
 * Installs the three-part status bar when this session is the parent (depth 0,
 * interactive mode): the status line above the editor, the agents line below
 * it, and the extension statuses in the footer. Re-installed on every
 * session_start, so a switched session rebinds a fresh ctx and a /reload
 * (which drops custom footers and widgets) gets its bar back.
 */
export function registerStatusBar(pi: ExtensionAPI, runner: StatusSource, settings: { depth: number }): void {
  if (settings.depth !== 0) return;
  let invalidateStatus: (() => void) | undefined;
  let invalidateAgents: (() => void) | undefined;
  const notify = () => {
    invalidateStatus?.();
    invalidateAgents?.();
  };
  const existing = runner.onChange;
  runner.onChange = existing ? () => (existing(), notify()) : notify;

  pi.on("session_start", (_event, ctx) => {
    if (ctx.mode !== "tui") return;

    // The footer is the only slot that hands out footerData — the git branch
    // and its change events — so the branch is shared with the status widget
    // above the editor through this state.
    const branchState: { branch: string | null } = { branch: null };

    ctx.ui.setFooter((tui, theme, footerData) => {
      const offBranch = footerData.onBranchChange(() => {
        branchState.branch = footerData.getGitBranch();
        invalidateStatus?.();
        tui.requestRender();
      });
      branchState.branch = footerData.getGitBranch();
      return {
        dispose: offBranch,
        invalidate() {},
        render(width: number): string[] {
          const statuses = footerData.getExtensionStatuses();
          if (statuses.size === 0) return [];
          const text = [...statuses.entries()]
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([, t]) => t.replace(/[\r\n\t]/g, " ").replace(/ +/g, " ").trim())
            .join(" ");
          return [truncateToWidth(text, width, theme.fg("dim", "…"))];
        },
      };
    });

    ctx.ui.setWidget(
      "pi-dev-status",
      (tui, theme) => {
        let stats:
          | { key: string; totals: UsageTotals; context: { percent: number | null; contextWindow: number } | undefined }
          | undefined;
        const invalidate = () => tui.requestRender();
        invalidateStatus = invalidate;
        return {
          dispose() {
            if (invalidateStatus === invalidate) invalidateStatus = undefined;
          },
          invalidate,
          render(width: number): string[] {
            const session = ctx.sessionManager;
            // ReadonlySessionManager omits getEntryCount from its Pick; the
            // method exists (and avoids the getEntries() copy per render).
            const count = (session as unknown as { getEntryCount(): number }).getEntryCount();
            const key = `${session.getSessionId()}|${session.getLeafId()}|${count}|${ctx.model?.id ?? "-"}|${ctx.thinkingLevel ?? "-"}`;
            if (stats?.key !== key) {
              const usage = ctx.getContextUsage();
              stats = {
                key,
                totals: summarizeUsage(session.getEntries()),
                context: usage ? { percent: usage.percent, contextWindow: usage.contextWindow } : undefined,
              };
            }
            const pwd = homeRelative(session.getCwd());
            const identity = branchState.branch ?? session.getSessionName();
            const leftSegments = statusSegments(stats.totals, stats.context, pwd, identity);
            const rightSegment = modelSegment(ctx.model, ctx.thinkingLevel);
            const leftPlain = leftSegments.map((s) => s.text).join("");
            const rightPlain = rightSegment.text;
            const fit = fitStatusLine(leftPlain, rightPlain, width);
            const leftColored = leftSegments.map((s) => colorize(s, theme)).join("");
            const leftOut = fit.right === "" && fit.left !== leftPlain ? truncateToWidth(leftColored, width, "…") : leftColored;
            const rightOut =
              fit.right === rightPlain
                ? colorize(rightSegment, theme)
                : truncateToWidth(colorize(rightSegment, theme), Math.max(0, width - visibleWidth(leftPlain) - 1), "");
            return [truncateToWidth(leftOut + " ".repeat(fit.gap) + rightOut, width, "…")];
          },
        };
      },
      { placement: "aboveEditor" },
    );

    ctx.ui.setWidget(
      "pi-dev-agents",
      (tui, theme) => {
        let dirty = true;
        let agents: AgentsSummary | undefined;
        const invalidate = () => {
          dirty = true;
          tui.requestRender();
        };
        invalidateAgents = invalidate;
        const tick = setInterval(invalidate, TICK_MS);
        return {
          dispose() {
            clearInterval(tick);
            if (invalidateAgents === invalidate) invalidateAgents = undefined;
          },
          invalidate,
          render(width: number): string[] {
            if (dirty) {
              agents = agentsSummary(runner.list());
              dirty = false;
            }
            if (!agents || agents.running + agents.ended === 0) return [];
            const parts: string[] = [];
            for (const [index, segment] of agentSegments(agents, Date.now()).entries()) {
              if (index > 0) parts.push(theme.fg("dim", " · "));
              parts.push(theme.fg(segment.color, segment.text));
            }
            return [truncateToWidth(parts.join(""), width, theme.fg("dim", "…"))];
          },
        };
      },
      { placement: "belowEditor" },
    );
  });
}
