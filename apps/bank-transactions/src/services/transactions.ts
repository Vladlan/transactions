import { z } from "zod";
import { pool } from "../db/pool.js";

export const createSchema = z.object({
  account_id: z.string().min(1).max(64),
  type: z.enum(["credit", "debit"]),
  amount: z.number().positive(),
  currency: z.string().length(3).default("USD"),
  description: z.string().optional(),
});

export const updateSchema = createSchema.partial().refine(
  (data) => Object.keys(data).length > 0,
  { message: "At least one field must be provided" },
);

export const listQuerySchema = z.object({
  account_id: z.string().optional(),
  type: z.enum(["credit", "debit"]).optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  offset: z.coerce.number().int().min(0).default(0),
});

export async function listTransactions(query: z.infer<typeof listQuerySchema>) {
  const { account_id, type, limit, offset } = query;
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
  params.push(limit, offset);

  const { rows } = await pool.query(
    `SELECT * FROM transactions ${where} ORDER BY created_at DESC LIMIT $${params.length - 1} OFFSET $${params.length}`,
    params,
  );

  return rows;
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
