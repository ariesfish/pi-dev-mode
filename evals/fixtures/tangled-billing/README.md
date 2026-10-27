# billing

A billing service split in three, nominally: orders, billing, refunds.

Files in this fixture: `README.md`, `src/orders.ts`, `src/billing.ts`,
`src/refunds.ts`, `src/money.ts`. Each service imports functions out of the
others' internals; `src/money.ts` is a small shared helper.
