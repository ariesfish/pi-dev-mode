# Issues projects hit (field reports)

- `require.context` in the i18n loader — the last thing most projects migrate;
  `import.meta.glob` returns promises unless `{ eager: true }`.
- `process.env.NODE_ENV` in dependency code is fine (Vite defines it), but
  custom `process.env.FOO` in app code silently becomes `undefined`.
- Jest setups that rely on webpack `moduleNameMapper` need a separate
  `vitest.config.ts`; the guide does not cover this.
- monorepo hoisting: a hoisted `vite` version can mismatch a workspace's
  `@vitejs/plugin-react`; pin both per workspace.
- SSR/`ssrLoadModule` differences are out of scope of the migration guide.
