// pi/session-state.ts — one session's state directory: <agentDir>/pi-dev/
// <sessionId>/ and every path this package files under it. The layout lives
// here and only here; the join() arithmetic it replaces was spread over
// agents/intercom/durable/index/artifacts with dirname() back-derivations.
// Records persist these paths (a record's sessionDir is <root>/agents), so
// fromSessionDir is the accepted way from a record back to its state.

import { join } from "node:path";

import { STATE_DIR } from "./config.ts";

export class SessionState {
  readonly root: string;
  readonly agents: string;
  readonly prompts: string;
  readonly identities: string;
  readonly intercom: string;
  readonly durableSqlite: string;

  constructor(agentDir: string, sessionId: string) {
    this.root = join(agentDir, STATE_DIR, sessionId);
    this.agents = join(this.root, "agents");
    this.prompts = join(this.root, "prompts");
    this.identities = join(this.root, "identities");
    this.intercom = join(this.root, "intercom");
    this.durableSqlite = join(this.root, "durable.sqlite");
  }

  /** The state a persisted record belongs to: records carry <root>/agents. */
  static fromSessionDir(sessionDir: string): SessionState {
    const state = Object.create(SessionState.prototype) as SessionState;
    state.root = sessionDir.slice(0, sessionDir.lastIndexOf("/")) || ".";
    state.agents = sessionDir;
    state.prompts = join(state.root, "prompts");
    state.identities = join(state.root, "identities");
    state.intercom = join(state.root, "intercom");
    state.durableSqlite = join(state.root, "durable.sqlite");
    return state;
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
