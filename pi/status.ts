// pi/status.ts — the status bar (T-103..T-105): one nerd-icon status line
// ABOVE the editor — model first, then ↑in ↓out ⚡cache-hit-rate, context
// group, $cost, and the right-aligned 📁 path + git branch — the agents line
// BELOW the editor, and the other extensions' setStatus texts in the footer.
// Field order follows the owner's 2026-10-22 steering (model first, path
// last); the built-in footer (↑k ↓k R…k CH… hints) is replaced by OUR file
// (not vendored) — it has no word to say about the background agents this
// package runs, and its token/context line would duplicate this bar.
//
// Glyph choice is NOT from the official codepoint cheatsheet: the user's
// terminals render Maple Mono NF CN, whose PUA map is the v2 layout (the v3
// table renders unrelated logos — probe-verified, see the feature dir). Every
// glyph below was rendered and visually confirmed against Maple itself.
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
import { truncateToWidth, visibleWidth } from "@earendil-works/pi-tui";

/** Every glyph the bar prints; widths pinned by test — the cache bolt
 * (U+26A1, the reference screenshot's own glyph) is the one 2-wide entry in
 * pi-tui's width table; Maple draws it in one cell with the same ink
 * overflow the reference shows. */
export const ICONS = {
  folder: "\uF07B", // nf-fa-folder — rendered ✓
  in: "\uF062", // nf-fa-arrow_up — rendered ✓
  out: "\uF063", // nf-fa-arrow_down — rendered ✓
  cache: "\u26A1", // ⚡ hollow bolt, the reference glyph — rendered ✓
  context: "\uF1C0", // nf-fa-database cylinder — rendered ✓ (v2 map)
  model: "\uF17B", // nf-fa-android robot head — rendered ✓ (Maple has F544 absent)
  branch: "\uF126", // nf-fa-code_branch — rendered ✓ (git branch pictogram)
  running: "\uF1CE", // nf-fa-circle_o_notch — rendered ✓
  done: "\uF00C", // nf-fa-check — rendered ✓
  failed: "\uF00D", // nf-fa-times — rendered ✓
  stopped: "\uF04D", // nf-fa-stop — rendered ✓
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

/** Token numbers in the owner's uppercase style: 999 / 1.0K / 12K / 123K /
 * 1.2M (pi's built-in footer uses lowercase k; the owner overrode it). */
export function formatTokens(count: number): string {
  if (count < 1000) return count.toString();
  if (count < 10000) return `${(count / 1000).toFixed(1)}K`;
  if (count < 1_000_000) return `${Math.round(count / 1000)}K`;
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

/** How the renderer colors a segment; all resolve through theme.fg. */
export type StatusColor = "dim" | "success" | "accent" | "text";

export interface StatusSegment {
  text: string;
  color: StatusColor;
}

/** Icon-led stats in the owner's order (↑ in, ↓ out, ⚡ cache hit rate), one
 * space between icon and number (the bolt's extra cell is pi-tui's width-2
 * accounting, so no explicit space after it), zeros omitted. */
export function usageSegments(totals: UsageTotals): StatusSegment[] {
  const segments: StatusSegment[] = [];
  if (totals.input > 0)
    segments.push({ text: `  ${ICONS.in} ${formatTokens(totals.input)}`, color: "success" });
  if (totals.output > 0)
    segments.push({ text: `  ${ICONS.out} ${formatTokens(totals.output)}`, color: "accent" });
  if ((totals.cacheRead > 0 || totals.cacheWrite > 0) && totals.cacheHitRate !== undefined)
    segments.push({ text: `  ${ICONS.cache}${totals.cacheHitRate.toFixed(1)}%`, color: "text" });
  return segments;
}

/** The context group: database icon + used/window + percent, dim (the meter
 * was dropped on owner request 2026-10-22). */
export function contextSegments(context: { percent: number | null; contextWindow: number } | undefined): StatusSegment[] {
  if (!context) return [];
  const used =
    context.percent === null ? "?" : formatTokens(Math.round((context.percent / 100) * context.contextWindow));
  const segments: StatusSegment[] = [
    { text: `  ${ICONS.context} ${used}/${formatTokens(context.contextWindow)}`, color: "dim" },
  ];
  if (context.percent !== null) segments.push({ text: ` ${context.percent.toFixed(1)}%`, color: "dim" });
  return segments;
}

/** The cumulative cost: plain $ + 3 decimals, dim, zero omitted (restored on
 * owner request 2026-10-22). */
export function costSegments(totals: UsageTotals): StatusSegment[] {
  return totals.cost > 0 ? [{ text: `  $${totals.cost.toFixed(3)}`, color: "dim" }] : [];
}

/** The left half of the status line, in the owner's field order: model first,
 * then ↑in ↓out ⚡hit-rate, context, cost. */
export function statusSegments(
  totals: UsageTotals,
  context: { percent: number | null; contextWindow: number } | undefined,
  model: { provider: string; id: string; reasoning: boolean } | undefined,
  thinkingLevel: string | undefined,
): StatusSegment[] {
  return [
    modelSegment(model, thinkingLevel),
    ...usageSegments(totals),
    ...contextSegments(context),
    ...costSegments(totals),
  ];
}

/** The right-aligned half: folder + cwd, then the git branch with its icon
 * (session name in parens as the fallback when no branch). */
export function pathSegments(
  pwd: string,
  branch: string | undefined,
  sessionName: string | undefined,
): StatusSegment[] {
  const segments: StatusSegment[] = [{ text: `${ICONS.folder} ${pwd}`, color: "dim" }];
  if (branch) segments.push({ text: ` ${ICONS.branch} ${branch}`, color: "dim" });
  else if (sessionName) segments.push({ text: ` (${sessionName})`, color: "dim" });
  return segments;
}

/** The right-aligned half: robot icon, Provider/model Effort (effort only when
 * the model reasons). */
export function modelSegment(
  model: { provider: string; id: string; reasoning: boolean } | undefined,
  thinkingLevel: string | undefined,
): StatusSegment {
  const name = model ? `${model.provider}/${model.id}` : "no-model";
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
 * left's tail (ctx give way, the path survives). */
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
  fg(color: StatusColor, text: string): string;
}

/** Segment color → theme call. "text" pins the theme's near-white (the
 * reference's bright #C8C9C9) instead of the terminal's default foreground. */
export function colorize(segment: StatusSegment, theme: StatusTheme): string {
  return theme.fg(segment.color, segment.text);
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
            const sessionName = session.getSessionName() || undefined;
            const leftSegments = statusSegments(stats.totals, stats.context, ctx.model, ctx.thinkingLevel);
            const rightSegments = pathSegments(pwd, branchState.branch ?? undefined, sessionName);
            const leftPlain = leftSegments.map((s) => s.text).join("");
            const rightPlain = rightSegments.map((s) => s.text).join("");
            const fit = fitStatusLine(leftPlain, rightPlain, width);
            const leftColored = leftSegments.map((s) => colorize(s, theme)).join("");
            const rightColored = rightSegments.map((s) => colorize(s, theme)).join("");
            const leftOut = fit.right === "" && fit.left !== leftPlain ? truncateToWidth(leftColored, width, "…") : leftColored;
            const rightOut =
              fit.right === rightPlain
                ? rightColored
                : truncateToWidth(rightColored, Math.max(0, width - visibleWidth(leftPlain) - 1), "");
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
