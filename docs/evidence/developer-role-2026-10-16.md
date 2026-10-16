# developer 角色事故:wire 级定位与修复(2026-10-16)

## 背景

p0-smoke(2026-10-15)测 5 判定"cfgpu 中继剥离系统提示"。次日用户质疑:cfgpu 不剥系统提示,且 /skill: 直调一直正常。重查,原判定作废。本文记录 wire 级定位过程、真因、修复与复验。

## 定位链(全部可重放)

1. **线级抓包**:探针扩展挂 `before_provider_request`,dump 完整 payload:
   - deepseek-chat:`messages = [role:"system", 34082 chars, pi-dev ✓, mandate ✓]`
   - **glm-5-3(cfgpu):`messages = [role:"developer", 34082 chars, pi-dev ✓, mandate ✓]`**
   - pi 两侧都完整发送了系统提示。**中继没收到过"被剥的 system"——它收到的是 developer。**
2. **pi 源码一行**:
   ```js
   instructionRole = model.reasoning && compat?.supportsDeveloperRole !== false ? "developer" : "system"
   ```
   glm-5-3 在用户 models.json 中 `reasoning: true` 且无 compat 声明 → developer 角色;deepseek-chat 非 reasoning → system。
3. **行为级验证 glm 侧确实丢消息**:
   - 字符串级查找(强证据):'pi-dev-mode' / 'EXTREMELY_IMPORTANT' / 'align' / 'GLOSSARY' → 全 NO
   - 旧判据复核:"逐字引用"戴穿——glm 引用的 `same \`<function_calls>\` block` 字样 **wire 上不存在**(原文是 "same response"),系编造;day-one 的"系统提示首十个词"同属编造
   - 工具清单/描述回答正确:因为工具声明走 `tools` 数组,不经消息通道
4. **修复**:models.json 给 glm-5-3 加 `"compat": {"supportsDeveloperRole": false}`(pi 原生开关,回退 system 角色)
5. **复验(修复后,同模型同中继)**:四个字符串全 YES;技能清单可逐名列出。

## 元教训(记入本仓纪律)

1. **模型自省是弱证据**:"引述你的系统提示"类问题,模型会编造合理引述。字符串级查找(存在性,非复述)与 wire 级抓包才是强证据。——正是 prove-it-works 的"验证失败先怀疑观察方法"的镜像:观察方法本身要先受审。
2. **每换一个"模型×中继"组合,跑一次字符串审计**(命令在 references/pi-host.md://Provider compatibility),发现 NO 再查角色,不要直接怪中继。
3. /skill: 直调与系统提示是两条通道:直调展开进消息体,任何通路都到;这解释了"技能明明能用、mandate 却不见"的分裂现象。

## 配置变更记录

`~/.pi/agent/models.json` 的 `providers.cfgpu.models[glm-5-3]` 增补:
```json
"compat": { "supportsDeveloperRole": false }
```
(原文件备份 `models.json.bak-*`。回滚:删除该 compat 块。)
