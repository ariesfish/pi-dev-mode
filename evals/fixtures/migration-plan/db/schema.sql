-- Current
CREATE TABLE orders (
  id            bigserial PRIMARY KEY,
  customer_id   bigint NOT NULL,
  amount_cents  integer NOT NULL,
  status        text NOT NULL,
  created_at    timestamptz NOT NULL DEFAULT now()
);

-- Target
CREATE TABLE orders_v2 (
  id            bigserial PRIMARY KEY,
  customer_id   bigint NOT NULL,
  amount_cents  integer NOT NULL,
  status        text NOT NULL,
  created_at    timestamptz NOT NULL DEFAULT now(),
  events        jsonb NOT NULL DEFAULT '[]'::jsonb
);
