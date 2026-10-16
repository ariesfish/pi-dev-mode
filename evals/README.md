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
| kind | `dialogue`(判助手回复与 transcript)/ `execution`(判真实执行产物,待 fixture 机制) |
| target | `<skill>:fires` 或 `<skill>:stays-quiet[,<别的不得触发的技能>]` |
| expected_outcome | 一句话的期望终态(人话,判分对照) |

## 添加用例

1. 从**真实会话**里找到触发对了/错了的一次对话(organic 是用例生命的全部)。
2. 正文写有机 prompt:不许出现任何技能名、`eval/judge/rubric/skill/principle/score`
   等元词(check-skills.py 会 lint)。
3. 每个判分点一条 grader 规则,写 PASS 的充分条件与 FAIL 的典型形态。
4. 跑 `python3 scripts/check-skills.py` 过结构检查。

## 运行

由 `eval` 技能驱动(Mode A 触发回归 / Mode B 变体盲评)。候选会话的固定形状:

```bash
cd $(mktemp -d)
pi -p --session-dir "$PWD/session" --no-extensions --no-skills \
  --skill <技能树路径> "<用例正文>"
# transcript 落在 $PWD/session;判分者以 @file 附 transcript 与回复
```
