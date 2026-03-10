import { Router, type Request, type Response } from "express";
import { z } from "zod";
import { pool } from "../db/pool.js";

const router = Router();

const createSchema = z.object({
  account_id: z.string().min(1).max(64),
  type: z.enum(["credit", "debit"]),
  amount: z.number().positive(),
  currency: z.string().length(3).default("USD"),
  description: z.string().optional(),
});

const updateSchema = createSchema.partial().refine(
  (data) => Object.keys(data).length > 0,
  { message: "At least one field must be provided" },
);

const listQuerySchema = z.object({
  account_id: z.string().optional(),
  type: z.enum(["credit", "debit"]).optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  offset: z.coerce.number().int().min(0).default(0),
});

// GET /transactions
router.get("/", async (req: Request, res: Response) => {
  const parsed = listQuerySchema.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }

  const { account_id, type, limit, offset } = parsed.data;
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

  res.json(rows);
});

// GET /transactions/:id
router.get("/:id", async (req: Request, res: Response) => {
  const { rows } = await pool.query(
    "SELECT * FROM transactions WHERE id = $1",
    [req.params["id"]],
  );

  if (rows.length === 0) {
    res.status(404).json({ error: "Transaction not found" });
    return;
  }
  res.json(rows[0]);
});

// POST /transactions
router.post("/", async (req: Request, res: Response) => {
  const parsed = createSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }

  const { account_id, type, amount, currency, description } = parsed.data;
  const { rows } = await pool.query(
    `INSERT INTO transactions (account_id, type, amount, currency, description)
     VALUES ($1, $2, $3, $4, $5) RETURNING *`,
    [account_id, type, amount, currency, description ?? null],
  );

  res.status(201).json(rows[0]);
});

// PUT /transactions/:id
router.put("/:id", async (req: Request, res: Response) => {
  const parsed = updateSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }

  const fields = parsed.data;
  const setClauses: string[] = [];
  const params: unknown[] = [];

  for (const [key, value] of Object.entries(fields)) {
    params.push(value);
    setClauses.push(`${key} = $${params.length}`);
  }
  params.push(new Date().toISOString());
  setClauses.push(`updated_at = $${params.length}`);

  params.push(req.params["id"]);

  const { rows } = await pool.query(
    `UPDATE transactions SET ${setClauses.join(", ")} WHERE id = $${params.length} RETURNING *`,
    params,
  );

  if (rows.length === 0) {
    res.status(404).json({ error: "Transaction not found" });
    return;
  }
  res.json(rows[0]);
});

// DELETE /transactions/:id
router.delete("/:id", async (req: Request, res: Response) => {
  const { rowCount } = await pool.query(
    "DELETE FROM transactions WHERE id = $1",
    [req.params["id"]],
  );

  if (rowCount === 0) {
    res.status(404).json({ error: "Transaction not found" });
    return;
  }
  res.status(204).send();
});

export default router;
