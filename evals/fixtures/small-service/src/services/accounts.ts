export interface Account {
  id: string;
  name: string;
  balanceCents: number;
}

const pool = { query: async (_sql: string, _params?: unknown[]): Promise<{ rows: Account[] }> => ({ rows: [] }) };

export async function listAccounts(): Promise<Account[]> {
  const { rows } = await pool.query("SELECT id, name, balance_cents FROM accounts ORDER BY name");
  return rows;
}

export async function getAccount(id: string): Promise<Account | undefined> {
  const { rows } = await pool.query("SELECT id, name, balance_cents FROM accounts WHERE id = $1", [id]);
  return rows[0];
}
