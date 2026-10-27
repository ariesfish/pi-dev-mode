import { _ledger } from "./orders";
import { _invoices, voidInvoice } from "./billing";

export interface Refund {
  orderId: string;
  reason: string;
}

export function refund(request: Refund): void {
  const order = _ledger.get(request.orderId);
  if (!order) throw new Error(`no order ${request.orderId}`);
  const invoice = _invoices().get(request.orderId);
  if (!invoice) throw new Error(`no invoice for ${request.orderId}`);
  voidInvoice(invoice);
  // Reaches in and rewrites the order's status itself.
  _ledger.set(request.orderId, { ...order, status: "refunded" });
}
