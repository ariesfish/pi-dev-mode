// pi/session-state.ts — one session's state directory: <agentDir>/pi-dev/
// <sessionId>/ and every path this package files under it. The layout lives
// here and only here; the join() arithmetic it replaces was spread over
// agents/intercom/durable/index/artifacts with dirname() back-derivations.
// Records persist these paths (a record's sessionDir is <root>/agents), so
// fromSessionDir is the accepted way from a record back to its state.

import { dirname, join } from "node:path";

import { STATE_DIR } from "./config.ts";

export class SessionState {
  readonly root: string;
  readonly agents: string;
  readonly prompts: string;
  readonly identities: string;
  readonly intercom: string;
  readonly durableSqlite: string;

  // Both ways in go through a factory: the layout is derived once here, so
  // no caller (or restore path) re-derives it by string arithmetic.
  private constructor(root: string, agents: string) {
    this.root = root;
    this.agents = agents;
    this.prompts = join(root, "prompts");
    this.identities = join(root, "identities");
    this.intercom = join(root, "intercom");
    this.durableSqlite = join(root, "durable.sqlite");
  }

  /** The state of one session: <agentDir>/pi-dev/<sessionId>/. */
  static forSession(agentDir: string, sessionId: string): SessionState {
    const root = join(agentDir, STATE_DIR, sessionId);
    return new SessionState(root, join(root, "agents"));
  }

  /** The state a persisted record belongs to: records carry <root>/agents. */
  static fromSessionDir(sessionDir: string): SessionState {
    return new SessionState(dirname(sessionDir), sessionDir);
  }

  /** The system-prompt file of one agent run (its type's body). */
  promptFile(id: string): string {
    return join(this.prompts, `${id}.md`);
  }

  /** The identity sidecar a child quotes when it self-records its artifact. */
  identityFile(id: string): string {
    return join(this.identities, `${id}.json`);
  }

  /** One run's durable artifact: cwd-anchored explicit output, or the default. */
  artifactFile(id: string, explicitOutput?: string): string {
    return explicitOutput ? join(process.cwd(), explicitOutput) : join(this.root, "artifacts", `${id}.md`);
  }
}
