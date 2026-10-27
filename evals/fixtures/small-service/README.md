# accounts-api

A small HTTP service. Express routes over a service layer, Postgres via `pg`.

Files in this fixture: `package.json`, `README.md`, `.gitignore`,
`src/routes/accounts.ts` (the one existing endpoint), `src/services/accounts.ts`
(business rules + queries), `src/server.ts` (app + route wiring),
`tests/accounts.test.ts`, `scripts/verify.sh` (typecheck + tests + a curl smoke),
and two directories that must not be touched: `node_modules/` and `vendor/`.
