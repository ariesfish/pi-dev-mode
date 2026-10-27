export interface Order {
  id: number;
  customerId: number;
  amountCents: number;
  status: string;
  createdAt: string;
}

// The only reader of the old table today.
export async function listOrders(db: { query(sql: string): Promise<{ rows: Order[] }> }): Promise<Order[]> {
  const { rows } = await db.query("SELECT * FROM orders ORDER BY created_at DESC");
  return rows;
}
