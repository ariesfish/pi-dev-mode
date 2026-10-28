# Capability map — when one spec becomes several

Read this only when the scope test says "capability map". The default is one spec.

**Propose a capability map before writing any module spec** — a module table
plus a build order, reviewed like every gate:

```markdown
# Capability Map: [Initiative]

| Module id | Responsibility | Depends on |
|---|---|---|
| identity | Accounts, sessions, SSO | — |
| billing | Plans, invoices, payments | identity |

Build order: identity → billing
```

- Stable kebab-case ids, chosen once. Specs, slices, and builds select work
  by these ids.
- Dependency arrows point one way; a cycle means one module.
- The map, not filename guessing, is the index: a multi-module initiative
  lands inside that initiative's feature dir `.dev/<initiative>/` — `map.md`
  plus one `SPEC-<id>.md` per module alongside it.
