# Skill Evals — 用例库与运行格式

> 依据:三池分层(Tier 1 结构 = `scripts/check-skills.py`,CI 免费;Tier 2 触发回归 = 本库
> 的 fires/stays-quiet 用例,由 `eval` 技能 Mode A 驱动;Tier 3 行为 A/B = `eval` 技能
> Mode B)。盲评纪律与"从 transcript 验链"继承 pstack Eval playbook;用例格式与 fires/
> stays-quiet 思想、拒案账本取自 addyosmani evals/。

## 目录格式

```
evals/
  README.md            本文件
  skill-impact.md      拒案账本(eval 证据否决的技能改动,append-only)
  <skill>/<case>/
    prompt.md          正文 = 候选可见的有机用户请求(禁一切元词)
    graders/*.md       每文件一条 PASS/FAIL 规则(判分者可见)
```

`prompt.md` frontmatter 字段:

| 字段 | 说明 |
|---|---|
| description | 这个用例在测什么(仅判分/维护者可见口径) |
| kind | `dialogue`(判助手回复与 transcript)/ `execution`(判真实执行产物,fixture 机制) |
| target | `<skill>:fires` 或 `<skill>:stays-quiet[,<别的不得触发的技能>]` |
| expected_outcome | 一句话的期望终态(人话,判分对照) |
| fixture | 可选(dialogue)/ 必需(execution):`evals/fixtures/<name>/` 的最小假项目名 |

## 添加用例

1. 从**真实会话**里找到触发对了/错了的一次对话(organic 是用例生命的全部)。
2. 正文写有机 prompt:不许出现任何技能名、`eval/judge/rubric/skill/principle/score`
   等元词(check-skills.py 会 lint)。
3. 每个判分点一条 grader 规则,写 PASS 的充分条件与 FAIL 的典型形态。
4. 跑 `python3 scripts/check-skills.py` 过结构检查。

## 运行

超时形状(2026-10-18 起):dialogue 案 700s;execution 案 1500s(视觉案刑期长——
渲染+像素 diff 流水线是合法路径,别把它掐死在半路)。

隔离与反作弊(runner v3 形状,2026-10-18):每案把 `skills/` **拷贝**进该案
临时目录并以拷贝为 `--skill` 路径(候选只见拷贝,题库不可从技能绝对路径顺藤
摸到);判分前机械检查 transcript,出现 `pi-dev-mode/evals/` 即判 CHEAT/FAIL。
起因:一次重跑里候选翻进题库读了判分文件照着表演("The eval intent is now
clear"),行为级通过被作废。

判分喂养(2026-10-18 事故):判分 prompt 必须喂**全量或压缩转写**(工具结果
正文压到行首 200 字符即可),绝不 `head -c` 截断——一次 60KB 截断把决定性的
渲染流水线切掉,出了假 FAIL 差点采信。另:`pi -p "$(…)"` 单参数上限 128KB,
超限走压缩转写;转写含 NUL 字节先 `tr -d '\0'`。

盲测纪律(2026-10-18 事故,P4 验收教训):**行为形盲测只在一次性克隆/fixture 上
跑,永不在活仓**——盲测任务带全量工具会在活仓真改产品码;盲测 prompt 禁止
编造不存在的上下文("他之前讨论过的 X"会让会话把虚构立成真项)。

由 `eval` 技能驱动(Mode A 触发回归 / Mode B 变体盲评)。候选会话的固定形状:

```bash
cd $(mktemp -d)
# dialogue 档:限 read 工具——能打开技能文件(链证据)但不会无限考古/动手,
# 判分才有界;case 声明 fixture 时先把 fixture 拷进本目录供考察。
cp -r <repo>/evals/fixtures/<name>/. .   # 仅当 prompt.md 声明了 fixture(内容拷入 cwd)
pi -p --session-dir "$PWD/session" --no-extensions --no-skills \
  --tools read --skill <技能树路径> "<用例正文>"
# execution 档:全量工具,以 fixture 副本为 cwd(execution 用例必须声明 fixture),
# 限时运行(全工具候选会挖仓库,900s 观察够用,300s 不够);路由行为类追加
# -e <repo>/pi/index.ts——mandate/repo-state 是产品的一部分。
# transcript 落在 --session-dir;判分者以 @file 附 transcript 与回复
```

**fixture 机制(2026-10-17 增补)**:`evals/fixtures/<name>/` 是 case 通过
`fixture:` frontmatter 引用的最小假项目。dialogue 档把 fixture 内容拷进空
cwd(候选的 cwd 即项目根)供 read 考察;execution 档以 fixture 内容为 cwd、
放开全量工具。fixture 内容会被候选看到,必须零元词。**fixture 的 README 必须
点名确切文件路径**——read-only 候选列不了目录,只能照 README 找文件。
`check-skills.py` 校验:execution 用例必须声明存在的 fixture,未被任何用例
引用的 fixture 目录报错。

**用例环境分两档(2026-10-16 增补)**:
- **触发判别类**(fires/stays-quiet 单技能):候选不带扩展(`--no-extensions`)——看纯 description 的自然命中;
- **路由行为类**(多区域拆分等):候选带扩展(`-e <repo>/pi/index.ts`)——mandate/repo-state 是产品的一部分,路由判别必须在真实环境里测。
