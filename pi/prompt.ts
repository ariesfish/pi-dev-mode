import { readFileSync } from "node:fs";
import { join } from "node:path";
import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";

import { readSheet, type Settings } from "./config.ts";

const MANDATE_SECTION = "pi-dev-session-start";
const SHEET_SECTION = "pi-dev-models";
const PARALLEL_SECTION = "pi-dev-parallel-calls";
const TOOLS_SECTION = "pi-dev-pi-tools";

// The skills come from a Claude Code lineage (mattp) and occasionally name its
// tools and models. A session with no mandate, a child agent, or a skill
// invoked directly may never see the routing skill, so every session gets
// this pointer here.
function piHostNote(pluginRoot: string): string {
  const file = join(pluginRoot, "references", "pi-host.md");
  return `The skills in this package occasionally name Claude Code conventions (the Skill tool, the Agent tool, AskUserQuestion) or model family names. When one does, read ${file} for the Pi equivalent before following it.`;
}
// Claude Code's system prompt, word for word but for its function_calls block.
// Skills that say "spawn both subagents in the same message" or "call two
// skills together" rely on it.
const PARALLEL_CALLS =
  "If you intend to call multiple tools and there are no dependencies between the calls, make all of the independent calls in the same response, otherwise you MUST wait for previous calls to finish first to determine the dependent values.";

// Claude Code runs the session hook and loads the sheet through a CLAUDE.md
// include; Pi has neither, so both ride as system prompt sections, set again
// on every agent start so compaction cannot drop them.
// A child gets the sheet, as a Claude Code subagent sees CLAUDE.md, but not
// the mandate: SessionStart does not run for subagents.
export function registerPromptSections(pi: ExtensionAPI, settings: Settings): void {
  const mandateFile = join(settings.pluginRoot, "hooks", "session-start-context.md");
  pi.on("before_agent_start", (event) => {
    const sheet = readSheet(settings.agentDir);
    const sections = event.systemPromptOptions.sections;
    sections[PARALLEL_SECTION] = PARALLEL_CALLS;
    sections[TOOLS_SECTION] = piHostNote(settings.pluginRoot);
    if (settings.depth === 0 && !sheet?.hookOff) sections[MANDATE_SECTION] = readFileSync(mandateFile, "utf8");
    if (sheet) sections[SHEET_SECTION] = sheet.text;
  });
}
