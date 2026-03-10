import express from "express";
import transactionsRouter from "./routes/transactions.js";

const app = express();
const port = Number(process.env["PORT"] || 3001);

app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.use("/transactions", transactionsRouter);

app.listen(port, () => {
  console.log(`Bank transactions server listening on port ${port}`);
});
