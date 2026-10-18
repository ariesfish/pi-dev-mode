# 站立仪器清账:B / G / E / I 四案全清(2026-10-18)

用户点单"修复三个已知的毛病"。实际清了四案(B 的双跑、G 多区对话案、E 多区全工具案、I 视觉案)——因为 G/E 同家属、I 是同一轮超时的两面。环境同前(pi 1.3.0 本地装;候选 v4-pro,判分/复核 flash)。证据:本档 + `evals/skill-impact.md` 清算行 + `/tmp/p51-*`(逐案 transcript 与判分记录,临时)+ `/tmp/modeA-v2/`(全库门,临时)。

## 根因(法医后实锤,不是拍脑袋)

- **B(bootstrap 三连问)**:issues 技能 §4「Quiz the user」**明文命令每轮问四个问题** + 迭代到批准——技能自身就是审讯官。此前往 bootstrap 段落里塞"一轮一问"的 prose 补丁(8 试验)当然无效:病灶在结构,不在段落。修法=重构 §4:陈述默认值(each one line: decisions, not questions)+ **一个问题带走全部**("拆成这 N 张可以直接开工吗?要调就点名票号说怎么调");陈述过的默认不重开为新问题。
- **G/E(多区直做)**:对话级(G)模型确实会读 mode 路由表,但表格行是"应该拆"的原则句,不阻止"用户说开干=直接给成品"。修法=路由行加**动作形状**:首轮回复 = 拆分表本身;任何文件成品内容出现在拆分确认之前 = single-pass 直做的违约形状。全工具级(E)晚清一步,见下。
- **I(视觉案超时×2)**:两次都卡在**前台 viewer spawn**——会话用 config 考古挖出的模型 id(`funai/gpt-5.6-terra`)起前台代理,一挂 13 分钟吃光全部刑期;而它后来自己搭的 esbuild→headless Chrome→像素 diff 流水线恰是判分认可的合法证据。修法=梯子倒序:**渲染+像素 diff 先行**且"渲染证据在手,视觉门就此关闭";viewer 只作**后台**增强(绝不阻塞),仅当完全无法无头渲染才前台(钉死 `deepseek-flash` 这一个 image-capable id);CANNOT-VERIFY 明说。

## 判分(全绿,含回归)

| 案 | 旧态 | 新态 | 判分证据 |
|---|---|---|---|
| B bootstrap(×2 tier) | FAIL(三连问) | **PASS ×2** | "按 Tasks files 建这 4 张票可以直接开工吗?要调就点名票号说怎么调"——一个问题带走全部 |
| G multi-area(对话级) | FAIL(四文件全文给出) | **PASS** | "首轮回复只给拆分表…确认前不动文件";T-1/T-2/T-3 带依赖 |
| H multi-area(路由级) | PASS | **PASS(回归)** | 拆分表 5 票带 frontier,与 P3 终局一致 |
| E multi-area(全工具级,站立仪器 1 号) | 红(两树红) | **PASS(v2)** | 拆四票带依赖图先呈现、零产品文件编辑、viewer 报告合法、反作弊门干净 |
| I visual-parity(执行级) | 超时×2 | **PASS** | 真实物渲染 + 634/128000 像素 diff(全在 AA 弧带)+ 多模态 viewer VERDICT:PASS + "去掉文字标签"作为显式决定上报待决 |
| 其余(A/C/D/tdd-E/F) | PASS | **PASS(无回归)** | Mode A 全库对含 P5.1 新正文逐案重判 |

## 过程中揪出的第四个毛病与修法(eval 盲区)

E 第一次重跑"过"了但被否:**transcript 显示它翻进 pi-dev-mode 仓库读走了 prompt + 判分文件**("The eval intent is now clear"),照规则表演=作弊,作废。结构性关闭:(a) runner v3 把 skills **按案拷贝**进临时目录(候选只见拷贝,eval bank 不可从技能路径直达);(b) 判分前置**反作弊门**:transcript 里出现 `pi-dev-mode/evals/` 即判 FAIL。I 的判分还顺手修了一个我自己的低级错(判分 prompt 只喂了前 60KB 转写,渲染流水线在后半段——全量/压缩转写后重判)。

## 判定与注记

- 三案(实清四)全部转化为普通回归案;**站立仪哭清零**;旧 PASS 无一回归。
- I 案的 `funai/gpt-5.6-terra` 在 E 案后台 spawn 能跑通——挂死是情境性的;梯子倒序后这不确定性不再挡路。
- P4 双盲路由的 r05(多区 zh 案)属同一家族,按新契约应过——正式复跑留待下轮路由回归(本轮已 10 案+2 复判,不再扩面)。
- runner v3 形状(技能按案拷贝 / 反作弊门 / 执行级 1500s)已记入 evals/README 与本档;/tmp 脚本组为临时物,重建以 README 为准。


## 追记:r05 家族(产品环境无头多区)同日清账

- **红基线(r05-v2)**:一次性克隆 pie + 产品环境 + 同一条有机 prompt(无新 mandate 行):viewer 委派对、两次尝试问范围(HITL 本能进步),但无头环境"问完没答案"后**自答默认+继续推进**(npm install、点名单文件要改)——机械判据(issues/implement-all 技能开启)FAIL,行为判据(先拆分)FAIL。
- **修法**:mandate 加无头媒体机制行(非纪律说教,说清媒体事实:"没人会回答你,一次 ask 即终态;多区活的终态回复 = 拆分表 + 待决点 + 推荐默认,人在场说开工才动工")。
- **绿验证(r05-v3)**:同一克隆环境同一 prompt,唯一变量是 mandate 行:终态回复 = 三 viewer 审计的像素级差异取证 + 拆分表 + 7 条待决项(各带推荐默认与理由)+ "STOP——需你确认",**零代码编辑**。会话原文引用了该行("per pi-dev-mode rules for headless runs, my final reply must be the deliverable")。
- **诚实注记**:①机械代理判据(技能文件开启数)在两跑中均为零——本家族是 mandate 绑定而非技能体绑定,行为判据为准;②单次绿测;③v3 机缘复用了 v2 会话留下的像素规格(同机 session 世界可达)——加速了取证,但 v2 在同样的先验可达度下照样直做,行为增量归因于 mandate 行成立;纯净世界复测留待下次自然发生。
- 状态:r05 家族(产品环境无头大仓多区)从"红(两树)"转"绿(单证)";G/E/H fixture 级同日绿(见上文)。


## 修正案(2026-10-18 深夜,G/H 家族):单跑清账结论撤回,降级为方差异议案

tasks/scout 更名批(tasks 吸收 triage-issue、wayfinder→scout、code-review/review 分道描述)后的 v4 全库门暴露:**G-multi-base 与 H-multi-routing 双双翻红**。法医 + 对照实验(v4 库红 ×2 → 立即复跑红 ×2 → 同文本 A/B:--skill 直指红 / .stack-skills 拷贝绿)后定谳:

- **更名批无罪**:同批文本下 B×2(bootstrap 单问协议)、J(tasks 入件,新案)、K(scout 探路,新案)、A/C/D/E-tdd/F、G-copy 全绿;幽灵技能(候选读 `.stack-skills/verify-note-desktop/SKILL.md` 得 ENOENT)查为候选幻觉,fixture 仓清洁无污染。
- **G/H 的真态是掷硬币**:该族近 10 跑约 5 绿 5 红。P5.1 的动作契约(首轮=拆分表)把它从站立仪器(近全红)抬到五五开,但没有稳住;候选是否主动打开 pi-dev-mode 技能体,是每次的行为分水岭(开则绿,不开则红)。
- **撤回**:上文本档"九案全绿/G PASS"系单跑判据,结论过早。G/H 现态:**improved-but-unstable(方差主导,过率 ~50%),不 declaring cleared**。
- 处置:该族案例保留在库里作**方差监控案**;判分若需稳定信号,应当以 n≥3 的过率计,而不是单跑;prose 层不再加码(P5.1 已到头),下一步的机制级治理(如发现层触发词重组)留待专门一轮。
