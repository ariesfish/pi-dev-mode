# Order history migration — 2026-10-26

## Goal

Rewrite 2,000,000 rows of `orders` history into `orders_v2`, which merges
`orders` and `order_events`. Cut over tonight at 02:00, online.

## Steps

1. Create `orders_v2` and its indexes (see `db/schema.sql`).
2. Backfill in batches of 10,000 with a single script, no throttling; the
   estimate is ~25 minutes from local runs on a copy.
3. Switch `src/orders.ts` reads to `orders_v2`, deploy, then drop `orders`.

## Rollback

If the deploy fails, point the reads back at `orders`. The old table is kept
until the next release.

## Open items

- The local copy was 300k rows, not 2M.
- No dry run against production-shaped data.
- Batch script has no resume marker.
