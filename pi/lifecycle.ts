import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";

/**
 * Lifecycle commands (P4): /spec /build /review /ship.
 *
 * Each command frames a user message that routes to its owning skill in
 * prose (tier-2 direct invocation is the user's /skill:name form, which
 * expandPromptTemplates would expand; these frames come pre-framed), with
 * the command's args carried through. Sources: addyosmani commands shapes,
 * folded into this stack's own routing semantics.
 */

interface LifecycleCommand {
  name: string;
  description: string;
  skill: string;
  frame: (args: string) => string;
}

const COMMANDS: LifecycleCommand[] = [
  {
    name: "spec",
    description: "Start spec-driven development — SPEC before code (/spec <ask>)",
    skill: "spec",
    frame: (args) => `请把这个需求按 spec 技能产出六节决策合同:三类验收标注齐全,写入 .dev/<slug>/spec.md,等待审批。需求:${args || "(延续当前上下文)"}`,
  },
  {
    name: "build",
    description: "Build the (ticketed) work — implement or implement-all auto (/build [args])",
    skill: "implement-all",
    frame: (args) =>
      args.includes("--auto")
        ? `implement-all auto 启动:${args.replace("--auto", "").trim() || "按 tracker 里就绪的工单开工"}——单审批后自主跑完,每票一 commit + decisions tsv 留痕,停止条件照技能。`
        : `按 implement/implement-all 技能实现:${args || "当前 tracker 里就绪的工单"}。单区单票走 implement;多区/多票走 implement-all。若没有 SPEC 与工单,先按技能拒绝并指引 spec/tickets 路径。`,
  },
  {
    name: "review",
    description: "Gate a merge/ship — four lenses + aggregate verdict (/review <fixed-point>)",
    skill: "review",
    frame: (args) => `review 技能把关:${args || "当前分支待合并改动"}。先确认固定点与 diff 非空再起飞四镜头,聚合裁决 APPROVE / REQUEST CHANGES / INCONCLUSIVE;高风险(auth/迁移/公共 API/数据)加独立裁决者自写 verdict 文件。`,
  },
  {
    name: "ship",
    description: "Ship a green stack — gate then land (/ship [scope])",
    skill: "pi-dev-mode",
    frame: (args) => `ship 流程:${args || "当前绿色栈"}。先 review 过门(APPROVE 或知情接受),然后按 ship playbook 落地:版本/发布说明(一个主数字为纲)、发布后验证、证据留档。未过门不出货。`,
  },
];

export default function lifecycleCommands(pi: ExtensionAPI): void {
  registerLifecycleCommands(pi);
}

export function registerLifecycleCommands(pi: ExtensionAPI): void {
  for (const cmd of COMMANDS) {
    // If another extension already owns the lifecycle name, registration
    // refuses — stay out of its way rather than shadowing. (getCommands()
    // is an action method and cannot run at load time, hence try/catch.)
    try {
      pi.registerCommand(cmd.name, {
        description: cmd.description,
        async handler(args, ctx) {
          const text = cmd.frame(args ?? "");
          // Follow-up delivery: still one question per turn for the user, and
          // it queues behind a run in flight instead of steering it.
          pi.sendUserMessage(text, { deliverAs: "followUp", expandPromptTemplates: false });
          ctx.ui.notify(`${cmd.skill} engaged — ${cmd.description}`, "info");
        },
      });
    } catch {
      // Name already owned — skip; we do not overwrite it.
    }
  }
}
