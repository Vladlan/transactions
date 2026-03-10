import { Router, type Request, type Response } from "express";
import {
  createSchema,
  updateSchema,
  listQuerySchema,
  listTransactions,
  getTransaction,
  createTransaction,
  updateTransaction,
  deleteTransaction,
} from "../services/transactions.js";

const router = Router();

// GET /transactions
router.get("/", async (req: Request, res: Response) => {
  const parsed = listQuerySchema.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }

  const rows = await listTransactions(parsed.data);
  res.json(rows);
});

// GET /transactions/:id
router.get("/:id", async (req: Request, res: Response) => {
  const result = await getTransaction(req.params.id as string);
  if (!result) {
    res.status(404).json({ error: "Transaction not found" });
    return;
  }
  res.json(result);
});

// POST /transactions
router.post("/", async (req: Request, res: Response) => {
  const parsed = createSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }

  const result = await createTransaction(parsed.data);
  res.status(201).json(result);
});

// PUT /transactions/:id
router.put("/:id", async (req: Request, res: Response) => {
  const parsed = updateSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }

  const result = await updateTransaction(req.params.id as string, parsed.data);
  if (!result) {
    res.status(404).json({ error: "Transaction not found" });
    return;
  }
  res.json(result);
});

// DELETE /transactions/:id
router.delete("/:id", async (req: Request, res: Response) => {
  const deleted = await deleteTransaction(req.params.id as string);
  if (!deleted) {
    res.status(404).json({ error: "Transaction not found" });
    return;
  }
  res.status(204).send();
});

export default router;
