import { type Money, negate } from "./money";
import type { Order } from "./orders";

export interface Invoice {
  orderId: string;
  amount: Money;
  state: "open" | "paid" | "void";
}

const invoices = new Map<string, Invoice>();

export function applyBilling(order: Order): Invoice {
  const invoice: Invoice = { orderId: order.id, amount: order.total, state: "open" };
  invoices.set(order.id, invoice);
  return invoice;
}

// refunds.ts calls this and then mutates the returned object's state directly.
export function _invoices(): Map<string, Invoice> {
  return invoices;
}

export function voidInvoice(invoice: Invoice): void {
  invoices.set(invoice.orderId, { ...invoice, amount: negate(invoice.amount), state: "void" });
}
