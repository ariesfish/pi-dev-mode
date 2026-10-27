# order-history-migration

A small billing service whose order history is being migrated to a new table.

Files in this fixture: `README.md`, `docs/migration-plan.md` (the plan under
review — statements, backfill, rollback), `db/schema.sql` (current and target
schema), `src/orders.ts` (the only reader of the old table).
