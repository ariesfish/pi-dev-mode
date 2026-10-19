import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";

import { readSheet, type Settings } from "./config.ts";

const MANDATE_SECTION = "pi-dev-session-start";
const SHEET_SECTION = "pi-dev-models";
const PARALLEL_SECTION = "pi-dev-parallel-calls";
const TOOLS_SECTION = "pi-dev-pi-tools";
const STATE_SECTION = "pi-dev-repo-state";

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

// One glance at the repo's stack artifacts, injected so routing to setup (or
// to a lazy-bootstrapping skill) happens before the user hits a
// missing-config wall. A fully configured repo pays nothing: the note stays
// absent. Read failures inject nothing; state is a hint, not a gate.
function repoStateNote(cwd: string): string | undefined {
  try {
    const has = (...paths: string[]) => paths.some((p) => existsSync(join(cwd, p)));
    const glossary = has("docs/GLOSSARY.md", "docs/GLOSSARY-MAP.md");
    const tracker = has("docs/agents/issue-tracker.md", ".dev");
    if (glossary && tracker) return undefined;
    const lines = ["This repo is not yet configured for the skills:"];
    if (!glossary)
      lines.push("- no domain glossary: docs/GLOSSARY.md (grill-me seeds it lazily)");
    if (!tracker)
      lines.push(
        "- no issue-tracker config: docs/agents/issue-tracker.md or a local `.dev/` tracker (one slugged dir per feature; tickets/triage-issue bootstrap it on first use, one confirmation; or run the setup skill)",
      );
    if (!has("docs/CONSTRAINTS.md"))
      lines.push("- no docs/CONSTRAINTS.md: define the quality bar before an autonomous run (constraints skill)");
    return lines.join("\n");
  } catch {
    return undefined;
  }
}

// Claude Code runs the session hook and loads the sheet through a CLAUDE.md
// include; Pi has neither, so both ride as system prompt sections, set again
// on every agent start so compaction cannot drop them.
// A child gets the sheet, as a Claude Code subagent sees CLAUDE.md, but not
// the mandate or the repo state: SessionStart does not run for subagents.
export function registerPromptSections(pi: ExtensionAPI, settings: Settings): void {
  const mandateFile = join(settings.pluginRoot, "hooks", "session-start-context.md");
  pi.on("before_agent_start", (event) => {
    const sheet = readSheet(settings.agentDir);
    const sections = event.systemPromptOptions.sections;
    sections[PARALLEL_SECTION] = PARALLEL_CALLS;
    sections[TOOLS_SECTION] = piHostNote(settings.pluginRoot);
    if (settings.depth === 0 && !sheet?.hookOff) {
      sections[MANDATE_SECTION] = readFileSync(mandateFile, "utf8");
      const state = repoStateNote(event.systemPromptOptions.cwd);
      if (state) sections[STATE_SECTION] = state;
    }
    if (sheet) sections[SHEET_SECTION] = sheet.text;
  });
}
