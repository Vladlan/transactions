import { z } from "zod";
import { pool } from "../db/pool.js";

export const createSchema = z.object({
  account_id: z.string().min(1).max(64),
  type: z.enum(["credit", "debit"]),
  amount: z.number().positive(),
  currency: z.string().length(3).default("USD"),
  description: z.string().optional(),
  status: z.string().max(16).optional(),
  category: z.string().max(64).optional(),
  merchant_name: z.string().max(128).optional(),
  merchant_category_code: z.string().max(4).optional(),
  reference_number: z.string().max(64).optional(),
  transaction_date: z.string().optional(),
  value_date: z.string().optional(),
  original_amount: z.number().optional(),
  original_currency: z.string().length(3).optional(),
  exchange_rate: z.number().optional(),
  fee_amount: z.number().optional(),
  tax_amount: z.number().optional(),
  payment_method: z.string().max(32).optional(),
  card_last4: z.string().length(4).optional(),
  card_network: z.string().max(32).optional(),
  location_city: z.string().max(64).optional(),
  location_country: z.string().length(3).optional(),
  is_recurring: z.boolean().optional(),
  original_description: z.string().optional(),
  counterparty_name: z.string().max(128).optional(),
  counterparty_account_number: z.string().max(64).optional(),
  counterparty_bank_code: z.string().max(32).optional(),
  balance_after: z.number().optional(),
  statement_period: z.string().max(16).optional(),
  metadata: z.any().optional(),
  auth_code: z.string().max(32).optional(),
  channel: z.string().max(16).optional(),
  risk_score: z.number().optional(),
  labels: z.array(z.string()).optional(),
  notes: z.string().optional(),
  parent_transaction_id: z.number().int().optional(),
  reconciliation_id: z.string().max(64).optional(),
});

export const updateSchema = createSchema.partial().refine(
  (data) => Object.keys(data).length > 0,
  { message: "At least one field must be provided" },
);

const sortableColumns = [
  "id", "account_id", "type", "amount", "currency", "description", "created_at",
  "status", "category", "merchant_name", "transaction_date", "value_date", "original_amount",
  "fee_amount", "tax_amount", "payment_method", "location_city", "location_country",
  "is_recurring", "counterparty_name", "balance_after", "risk_score"
] as const;

export const listQuerySchema = z.object({
  account_id: z.string().optional(),
  type: z.enum(["credit", "debit"]).optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  offset: z.coerce.number().int().min(0).default(0),
  sort_field: z.enum(sortableColumns).optional(),
  sort_direction: z.enum(["asc", "desc"]).optional(),
});

export async function listTransactions(query: z.infer<typeof listQuerySchema>) {
  const { account_id, type, limit, offset, sort_field, sort_direction } = query;
  const conditions: string[] = [];
  const params: unknown[] = [];

  if (account_id) {
    params.push(account_id);
    conditions.push(`account_id = $${params.length}`);
  }
  if (type) {
    params.push(type);
    conditions.push(`type = $${params.length}`);
  }

  const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
  const orderBy = sort_field ? `${sort_field} ${sort_direction ?? "asc"}` : "created_at DESC";
  params.push(limit, offset);

  const { rows } = await pool.query(
    `SELECT * FROM transactions ${where} ORDER BY ${orderBy} LIMIT $${params.length - 1} OFFSET $${params.length}`,
    params,
  );

  return rows;
}

export const countQuerySchema = z.object({
  account_id: z.string().optional(),
  type: z.enum(["credit", "debit"]).optional(),
});

export async function countTransactions(query: z.infer<typeof countQuerySchema>) {
  const conditions: string[] = [];
  const params: unknown[] = [];

  if (query.account_id) {
    params.push(query.account_id);
    conditions.push(`account_id = $${params.length}`);
  }
  if (query.type) {
    params.push(query.type);
    conditions.push(`type = $${params.length}`);
  }

  const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
  const { rows } = await pool.query(
    `SELECT count(*)::int AS count FROM transactions ${where}`,
    params,
  );

  return rows[0].count as number;
}

export async function getTransaction(id: string) {
  const { rows } = await pool.query(
    "SELECT * FROM transactions WHERE id = $1",
    [id],
  );

  if (rows.length === 0) return null;
  return rows[0];
}

export async function createTransaction(data: z.infer<typeof createSchema>) {
  const { account_id, type, amount, currency, description } = data;
  const { rows } = await pool.query(
    `INSERT INTO transactions (account_id, type, amount, currency, description)
     VALUES ($1, $2, $3, $4, $5) RETURNING *`,
    [account_id, type, amount, currency, description ?? null],
  );

  return rows[0];
}

export async function updateTransaction(id: string, fields: z.infer<typeof updateSchema>) {
  const setClauses: string[] = [];
  const params: unknown[] = [];

  for (const [key, value] of Object.entries(fields)) {
    params.push(value);
    setClauses.push(`${key} = $${params.length}`);
  }
  params.push(new Date().toISOString());
  setClauses.push(`updated_at = $${params.length}`);

  params.push(id);

  const { rows } = await pool.query(
    `UPDATE transactions SET ${setClauses.join(", ")} WHERE id = $${params.length} RETURNING *`,
    params,
  );

  if (rows.length === 0) return null;
  return rows[0];
}

export async function deleteTransaction(id: string) {
  const { rowCount } = await pool.query(
    "DELETE FROM transactions WHERE id = $1",
    [id],
  );

  return rowCount !== 0;
}
