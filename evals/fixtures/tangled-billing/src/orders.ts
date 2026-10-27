import { type Money, add } from "./money";
import { applyBilling } from "./billing";

export interface Order {
  id: string;
  total: Money;
  status: "draft" | "placed" | "settled" | "refunded";
  lines: { sku: string; price: Money }[];
}

const orders = new Map<string, Order>();

export function place(order: Order): Order {
  const total = order.lines.reduce((sum, line) => add(sum, line.price), { amountCents: 0, currency: "USD" });
  const placed: Order = { ...order, total, status: "placed" };
  orders.set(placed.id, placed);
  applyBilling(placed);
  return placed;
}

// Called from refunds.ts, which reaches into this map directly.
export const _ledger = orders;
