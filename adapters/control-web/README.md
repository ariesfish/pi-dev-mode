# adapters/control-web — 验证域 CDP 驱动 harness(冻结接口)

> **来路注记(2026-10-18 更新)**:donor 已到位并识别——
> [browser-use/browser-harness](https://github.com/browser-use/browser-harness)
> v0.1.13(Python/uv 安装于本机,daemon + cdp_use,附 `browser-harness skill` 文本与
> domain-skills 复利机制)。经比对,**不采用 vendored fork 而采用使用域分家**
> (docs/04 风险登记表预判的哲学冲突解):browser-harness 面向联网任务/复用用户
> 登录态,按设计附着用户运行中的 Chrome;control-web 面向验证取证,必须自起
> 隔离实例、永不碰用户浏览器。两者共存:联网浏览用 browser-harness,
> 验证驱动用本目录。机制借鉴(非代码拷贝):ensure/doctor 体检面、
> domain-skills 复利机制(对应 create-verification-skill 的 feature map)、
> "plain fetch 就用 curl"的升级门槛。原 docs/01/02 的 fork-三纠偏计划
> 由本目录从零建的骨架直接履行三纠偏。

## 用途域

本 harness 只做**验证驱动**:launch → doctor → drive → evidence → cleanup,
供 `verify-<app>` 技能(由 create-verification-skill 生成)与 repro/debug
取证调用。它不是上网冲浪器,不接代理,不认任何非本机端口。

## 例外审批日志(冻结规则 #3)

- 2026-10-18:修复 findNode 旧 `data-pdm-hit` 标签劫持后续步骤(boxExpr/read 取文档序首个标签,第二步起点击全落在前一步元素)→ 打新标签前先 `removeAttribute` 清理旧标签;对既有调用方行为不变(每步仍解析当前命中元素)。触发场景:verify-pie P3 自证(workspace 输入步骤点击落空)。批准人：ariesfish——2026-10-18 harness 维护方会话复核 diff 后批准（缺陷实锤：页面实测残留 5 个旧标签；修复面最小；调用方语义不变）。

- 2026-10-18:观察不动手——cleanup 后 chrome_crashpad 可能重建
  `$userDataDir/Default` 个别文件(chrome 主进程已死、端口已关、无功能影响);
  helper 不改,残留由调用方 `rm -rf /tmp/verify-<runId>` 收尾。

## 三条构造约束(frozen)

1. **自起隔离实例**:launch 永远 `chrome --headless=new --user-data-dir=/tmp/verify-$RUN_ID
   --remote-debugging-port=<auto>`,绝不附着既有浏览器(共享实例 = 脏状态 +
   并发互踩)。$RUN_ID 缺省为时间戳,可显式传以便复用同一隔离实例。
2. **ARIA/可访问名优先,坐标兜底**:定位次序 aria-label / accessible-name
   (textContent 近似) → 显式 CSS selector → 文本匹配;仅当步骤显式给
   `coords` 才用坐标(并打 `coordinate-fallback` 标记进 report)。
3. **helper 冻结**:`harness/` 下文件进 git 后视为约定接口;变更须走例外
   审批(在本 README 追加一行:日期 + 变更 + 批准人),不做静默重构。

## harness/(冻结)接口

```bash
# 启动隔离实例;输出 JSON {pid, devtoolsPort, userDataDir, targetWsUrl, runId}
node harness/control.mjs launch [--run-id ID] [--no-headless]

# 只读体检:可达 / 实例活 / 端口归我 / 隔离目录吻合;输出 JSON {ok, checks[]}
node harness/control.mjs doctor --port P

# 驱动 + 取证:steps.json 见下;输出 JSON report(evidence 路径在内)
node harness/control.mjs drive --port P --steps steps.json --out DIR

# 收尾:只杀自己起的 pid,只删自己的 user-data-dir;证据目录永不删
node harness/control.mjs cleanup --port P
```

steps.json:`{navigate: url, settleMs?, steps: [...]}` 每步
`{find?: {aria|selector|text|coords}, click?, type?, read?, expectVisible?,
shot?}`——find 命中即返回节点,click/type 按命中元素驱动真实
Input 事件,shot 落 PNG 到 out 目录,read 抓元素文本。report 每步记录
`{step, found, via(aria|selector|text|coords), ok, evidence}`。

## 依赖面

Node ≥ 22(原生 WebSocket;本机 Node 26),chrome/chromium
(`google-chrome-stable` 优先,`CHROME_BIN` 可覆写),无任何 npm 依赖。
