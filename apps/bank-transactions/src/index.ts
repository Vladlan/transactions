import http from "node:http";
import express from "express";
import swaggerUi from "swagger-ui-express";
import transactionsRouter from "./routes/transactions.js";
import { openApiDocument } from "./openapi.js";
import { attachWebSocket } from "./ws/transactions.js";
import { asyncApiDocument } from "./asyncapi.js";

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

app.get("/asyncapi.json", (_req, res) => {
  res.json(asyncApiDocument);
});

app.use("/transactions", transactionsRouter);

const server = http.createServer(app);
attachWebSocket(server);

server.listen(port, () => {
  console.log(`Bank transactions server listening on port ${port}`);
});
