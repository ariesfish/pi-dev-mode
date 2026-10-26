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

- 2026-10-22:**drive 引擎置换**——手写 CDP 驱动(Input 域注入 + data-pdm-hit 定位)换为
  playwright-core `connectOverCDP`(只连本目录 launch 出来的隔离端口,`browser.close()`
  只断连,chrome 关停仍归 cleanup)。冻结接口不变:四命令、steps.json、report.json 字段
  全保留,report 增设 `pageErrors[]`(纯增量,干净时不出场)。行为变化:
  - auto-wait:定位/点击/读取自动等待至 `timeoutMs`(steps.json 可调,默认 8000ms),
    `settleMs` 从默认 1200 改为默认 0(纯可选附加延迟)
  - 视口外元素自动滚动到位再点——消"点空仍报 ok"假阳性
  - `type` 改 fill 语义(清空后整体置值;textarea 换行原生,不再模拟逐键 Enter)
  - aria 判据收窄为 getByLabel 语义(子串匹配;aria-label/aria-labelledby/
    label);可见文本按钮等无标签交互件改用 text/selector 判据
  - 严格模式:判据命中多元素即报错(旧引擎静默取首个)
  - coords 兜底明确为仅支持 click;与 type/read/expectVisible 组合报错,
    不再静默 ok(这是审查抓到的假阳性回归,已修并加测)
  - Cdp 类中从未被读取的 events 队列(死代码)一并移除;launch/doctor/
    cleanup 输出契约经实测逐字段一致
  新增 `tests/` 缝测试(`node --test "adapters/control-web/tests/*.test.mjs"`,
    红灯先行:视口外点击/慢渲染/pageErrors/fill 清空/严格模式/coords-only
    等在旧引擎红,十二测在新引擎全绿;Node 26 起 --test 不收目录参数)。
  同日修订:playwright-core 依赖自本目录嵌套包**提升至包根 dependencies**
    (嵌套包在 pi 的 git/npm 源安装下不会被安装,三种安装方式均不自洽;
    根依赖在 git/npm 源下由 pi 统一安装,local 源由作者包根 npm install),
    本目录 package.json/package-lock.json 删除,安装提示与依赖面同步改写。
  批准人:ariesfish——2026-10-22 会话批准("好的,换吧,用更强大的工具武装自己")。

- 2026-10-18:观察不动手——cleanup 后 chrome_crashpad 可能重建
  `$userDataDir/Default` 个别文件(chrome 主进程已死、端口已关、无功能影响);
  helper 不改,残留由调用方 `rm -rf /tmp/verify-<runId>` 收尾。

### 2026-10-26:harness 自证一轮(审计驱动)

审计发现 harness 的三处"文档说到了、代码没做到",本行即冻结规则 #3 的例外审批:

- **浏览器解析进 harness**:`control.mjs` 原来只认 `CHROME_BIN || google-chrome-stable`
  (Linux 名),macOS 上 README 自己的命令 12/12 失败;解析顺序改为
  `CHROME_BIN` → macOS 应用包 → PATH 名,`check.sh` 同步删除自带的 20 行解析。
- **归属记录**:launch 在隔离目录写 `harness.json`(runId/port/pid/userDataDir);
  `doctor` 补上文档声称的 `port-owned-by-us` / `user-data-dir-matches` 两检(四项全),
  `cleanup` 只关/只删这条记录指向的实例,端口有应答但无记录时**拒绝**;已清理端口的
  重复调用幂等。原先按 `--port` 关任意浏览器、并按 mtime 删**所有** 15 秒前的
  `/tmp/verify-*`(并发验证互删)。
- **输出契约补齐**:launch 输出补 `targetWsUrl`(README 早已列出、代码从未发);
  `--run-id` 限定 `[A-Za-z0-9][A-Za-z0-9._-]*`,不能逃出 `/tmp/verify-*`。
- **测试**:12 → 16(launch 键集、run-id 越界、未认领端口拒绝、cleanup 幂等)。

批准人:ariesfish——2026-10-26 会话指令("未做的按你的建议修改")。

## 三条构造约束(frozen)

1. **自起隔离实例**:launch 永远 `chrome --headless=new --user-data-dir=/tmp/verify-$RUN_ID
   --remote-debugging-port=<auto>`,绝不附着既有浏览器(共享实例 = 脏状态 +
   并发互踩)。$RUN_ID 缺省为时间戳,可显式传以便复用同一隔离实例。
2. **ARIA 优先,坐标兜底**:定位次序 aria(getByLabel 语义:aria-label /
   aria-labelledby / label,子串匹配)→ 显式 CSS selector → 文本匹配;仅当
   步骤显式给 `coords` 才用坐标(仅支持 click,并打 `coordinate-fallback`
   标记进 report)。
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

# 收尾:只认 harness.json 记录的那次 run;端口有应答但无记录 -> 拒绝;证据目录永不删
node harness/control.mjs cleanup --port P
```

steps.json:`{navigate: url, settleMs?, timeoutMs?, steps: [...]}` 每步
`{find?: {aria|selector|text|coords}, click?, type?, read?, expectVisible?,
shot?, label?, navigate?, required?}`(`required: false` 容忍该步失败;每步可自带
`navigate` 换页;`label` 只改善报告可读性)——aria 走 getByLabel 子串匹配,selector 是 CSS 选择器,text 匹配
可见文本;命中后由引擎(playwright-core,`connectOverCDP` 只连本目录 launch
的隔离端口)滚动到位、等待 actionable 再驱动;`type` 是 fill 语义(清空后
整体置值,textarea 换行原生);`shot` 是字符串标签,落 PNG 到 out 目录;
`read` 抓元素文本;`coords` 仅支持 `click`。自动等待上限 `timeoutMs`
(默认 8000ms)。report 每步记录
`{step, label, via(aria|selector|text|coords), ok, text, read?, shot?, note?, error?}`;
顶层另附 `pageErrors[]`(页面 uncaught 错误;干净时省略,保持旧报告兼容)。

## 依赖面

launch 解析浏览器顺序:`CHROME_BIN` → macOS 应用包(Chrome/Chromium/Edge)→
  PATH 名(`google-chrome-stable|google-chrome|chromium|chromium-browser`);
  harness 自己解析,不依赖调用方导出 `CHROME_BIN`。

依赖声明在**包根** `package.json`(`@earendil-works/chord`、
`@earendil-works/pi-durable`、`playwright-core`,均 npm registry 正式发布),
不在本目录——pi 以 git/npm 源安装本包时按根清单统一安装,本 harness 随包可用;

- launch / doctor / cleanup:零 npm 依赖——Node ≥ 22(原生 WebSocket)+
  chrome/chromium(`google-chrome-stable` 优先,`CHROME_BIN` 可覆写)。
- drive(引擎):playwright-core 14MB,零浏览器二进制下载——`connectOverCDP`
  连到 launch 自起的系统 Chrome 隔离实例。engine 的 import 自本包根
  node_modules 向上解析。local 路径安装不装依赖(pi 的作者责任制):
  包根 `npm install` 一次即可,根 `package-lock.json` 随仓库提交。
- 缝测试:`node --test "adapters/control-web/tests/*.test.mjs"`(包根已
  npm install;无需网络,data: URL 驱动)。
