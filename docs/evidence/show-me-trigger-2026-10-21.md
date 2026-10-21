# show-me 新技能落地触发门(2026-10-21)

背景:`skills/show-me/`(2026-10-21 重建,前一日被会话误删,从未入 git)按用户三方政策改写完全体——对话默认=讲人话+Markdown 内小图;关键产出物/重文本总结=单页自包含 HTML;同时去除 `disable-model-invocation: true`(对话内自动触发是本技能的存在理由)。按 docs/CONSTRAINTS.md Trigger-surface 行,description 属新增触发面,须过 eval 门。本文件为门证据。

环境:pi 1.3.0;候选默认模型 cfgpu/glm-5-3;两跑并行,dialogue 档配方(evals/README):`pi -p --session-dir … --no-extensions --no-skills --tools read --skill <temp>/skills "<正文>"`,skills 树拷贝进各自临时目录 `/tmp/eval-show-me-20261021/run{1,2}/`。

判分:机械判定 + 全文通读(transcript 中 SKILL.md 读取路径 grep + 终回复对照 grader 规则;本次未另起判分会话,两例判定点均为可机械验证的链证据,判分文附注)。

## 结果(2 用例,2 跑次,首建基线)

| 用例 | 档位 | 判定 | 链证据 |
|---|---|---|---|
| show-me/lost-in-jargon | 触发(fires) | **PASS** | 读 `show-me/SKILL.md`(途中另读了 pi-dev-mode/dev-mode-help/setup 定位语境);终回复全中文大白话,逐个解码 session hook/mandate 注入、before_provider_request 探针、子会话挂账;视觉=1 处 mermaid + 1 处 text 树;无 HTML 文件写入;错误未核实处如实标注 |
| show-me/stays-quiet-on-small-edit | 触发(stays-quiet) | **PASS** | **零 SKILL.md 读取(正确静默)**;直接作答并基于仓库证据推翻包名(`pi` 实为 `@earendil-works/pi-coding-agent`);无 HTML 文件、无图解流程 |

观察(给 retro,不是门):丢失重建后正文为 Claude Code 语法(`Bash(open …)`)的原始版本已按 pi-host 语法改写为 `bash` 工具 + `open`;若后续再从 Claude 血统仓库收编 "show me" 类技能,注意同一坑。

## 判定

门位全绿:新 description 的 fires/stays-quiet 两面首建基线均 PASS;show-me 按 27 号技能入列(router + dev-mode-help 双清单面 + README 计数同步)。
