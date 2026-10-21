import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { join } from "node:path";

import { registerAgentTools } from "./agent-tools.ts";
import { AgentRunner } from "./agents.ts";
import { writeSelfArtifact, readIdentitySidecar } from "./artifacts.ts";
import { registerAsk } from "./ask.ts";
import { ARTIFACT_FLAG, DEPTH_FLAG, IDENTITY_FLAG, STATE_DIR, defaultSettings, type Settings } from "./config.ts";
import { INTERCOM_FLAG, registerAnswerChild, registerAskParent, watchIntercom } from "./intercom.ts";
import { registerOneShot } from "./one-shot.ts";
import { registerPathSkills } from "./path-skills.ts";
import { registerPromptSections } from "./prompt.ts";
import { registerSchedule, Scheduler } from "./schedule.ts";

export function install(pi: ExtensionAPI, settings: Settings): void {
  const runner = new AgentRunner(pi, settings);
  const scheduler = new Scheduler(pi);
  const oneShot = registerOneShot(pi, settings, runner);
  registerAgentTools(pi, runner);
  registerAsk(pi, oneShot);
  registerSchedule(pi, scheduler, oneShot);
  registerPromptSections(pi, settings);
  registerPathSkills(pi, settings);
  // T-026: the intercom lives in the parent session — answer_child plus one
  // notice per pending ask_parent request. Children register ask_parent
  // themselves from the channel flag this process passes them.
  let stopIntercom: (() => void) | undefined;
  if (settings.depth === 0) {
    registerAnswerChild(pi, settings);
    pi.on("session_start", (_event, ctx) => {
      stopIntercom?.();
      stopIntercom = watchIntercom(
        (message) => runner.notify(message, true),
        join(settings.agentDir, STATE_DIR, ctx.sessionManager.getSessionId(), "intercom"),
      );
    });
  }
  // Children run detached, in their own process group, so a parent that exits
  // without session_shutdown would leave them running: this exit hook signals
  // them, and each child pi then ends the bash command it has running.
  const onExit = () => runner.signalAll();
  process.on("exit", onExit);
  // Every entry, not the active branch: an agent started on a branch the user
  // later left is still a process, and its record is the only handle on it.
  pi.on("session_start", (_event, ctx) => runner.restore(ctx.sessionManager.getEntries(), ctx.modelRegistry));
  pi.on("session_shutdown", async (_event, ctx) => {
    process.off("exit", onExit);
    stopIntercom?.();
    // A child session writes its own artifact first: the run's durable output
    // must not ride on its parent noticing the exit.
    writeSelfArtifact(pi.getFlag(ARTIFACT_FLAG), readIdentitySidecar(pi.getFlag(IDENTITY_FLAG)), () => ctx.sessionManager.getBranch() as unknown[]);
    oneShot.dispose();
    scheduler.stopAll();
    // Children are detached in their own process groups: they keep running,
    // self-write their artifacts, and the next session discovers and delivers
    // — T-025's detached-survive semantics. No stopAll here. Durable children
    // park their storage instead (T-030): in-flight work is written back
    // pending, and the session that reopens their sqlite resumes it.
    runner.parkDurable();
  });
}

export default function piDevStack(pi: ExtensionAPI): void {
  pi.registerFlag(DEPTH_FLAG, { type: "string", description: "Layers below the main session; pi-dev sets it on the agents it starts." });
  pi.registerFlag(ARTIFACT_FLAG, { type: "string", description: "Where this child session writes its run artifact at shutdown." });
  pi.registerFlag(IDENTITY_FLAG, { type: "string", description: "Sidecar JSON with the identity fields the self-written artifact quotes." });
  pi.registerFlag(INTERCOM_FLAG, { type: "string", description: "Intercom channel directory; the parent passes it so this child can ask_parent." });
  // Flags are only readable once the session starts (pi parses extension
  // flags after it loads this extension) — register ask_parent there, once.
  let askParentRegistered = false;
  pi.on("session_start", () => {
    if (askParentRegistered) return;
    const intercom = pi.getFlag(INTERCOM_FLAG);
    if (typeof intercom === "string" && intercom) {
      registerAskParent(pi, intercom);
      askParentRegistered = true;
    }
  });
  install(pi, defaultSettings(() => Number(pi.getFlag(DEPTH_FLAG)) || 0));
}
