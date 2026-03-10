import express from "express";
import swaggerUi from "swagger-ui-express";
import transactionsRouter from "./routes/transactions.js";
import { openApiDocument } from "./openapi.js";

const app = express();
const port = Number(process.env["PORT"] || 3001);

app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.get("/openapi.json", (_req, res) => {
  res.json(openApiDocument);
});

app.use("/docs", swaggerUi.serve, swaggerUi.setup(openApiDocument));

app.use("/transactions", transactionsRouter);

app.listen(port, () => {
  console.log(`Bank transactions server listening on port ${port}`);
});
