import { WebSocketServer, type WebSocket } from "ws";
import type { Server } from "node:http";
import { z } from "zod";
import {
  createSchema,
  updateSchema,
  listQuerySchema,
  countQuerySchema,
  findIndexQuerySchema,
  listTransactions,
  countTransactions,
  findRowIndex,
  getTransaction,

  createTransaction,
  updateTransaction,
  deleteTransaction,
} from "../services/transactions.js";

const messageSchema = z.object({
  id: z.string().or(z.number()).optional(),
  action: z.enum(["list", "count", "findIndex", "get", "create", "update", "delete"]),

  params: z.record(z.unknown()).optional(),
});

let wssRef: WebSocketServer | null = null;

function send(ws: WebSocket, id: string | number | undefined, payload: Record<string, unknown>) {
  ws.send(JSON.stringify({ id, ...payload }));
}

function broadcast(sender: WebSocket, event: string, data?: unknown) {
  if (!wssRef) return;
  const msg = JSON.stringify({ event, data });
  for (const client of wssRef.clients) {
    if (client !== sender && client.readyState === client.OPEN) {
      client.send(msg);
    }
  }
}

async function handleMessage(ws: WebSocket, raw: string) {
  let msg: z.infer<typeof messageSchema>;

  try {
    msg = messageSchema.parse(JSON.parse(raw));
  } catch {
    ws.send(JSON.stringify({ error: "Invalid message format" }));
    return;
  }

  const { id, action, params } = msg;

  try {
    switch (action) {
      case "list": {
        const parsed = listQuerySchema.safeParse(params ?? {});
        if (!parsed.success) {
          send(ws, id, { error: parsed.error.flatten() });
          return;
        }
        const rows = await listTransactions(parsed.data);
        send(ws, id, { data: rows });
        return;
      }

      case "count": {
        const parsed = countQuerySchema.safeParse(params ?? {});
        if (!parsed.success) {
          send(ws, id, { error: parsed.error.flatten() });
          return;
        }
        const count = await countTransactions(parsed.data);
        send(ws, id, { data: { count } });
        return;
      }

      case "findIndex": {
        const parsed = findIndexQuerySchema.safeParse(params ?? {});
        if (!parsed.success) {
          send(ws, id, { error: parsed.error.flatten() });
          return;
        }
        const index = await findRowIndex(parsed.data);
        send(ws, id, { data: { index } });
        return;
      }

      case "get": {
        const txId = (params as Record<string, unknown>)?.id;
        if (!txId) {
          send(ws, id, { error: "Missing params.id" });
          return;
        }
        const result = await getTransaction(String(txId));
        if (!result) {
          send(ws, id, { error: "Transaction not found" });
          return;
        }
        send(ws, id, { data: result });
        return;
      }

      case "create": {
        const parsed = createSchema.safeParse(params);
        if (!parsed.success) {
          send(ws, id, { error: parsed.error.flatten() });
          return;
        }
        const result = await createTransaction(parsed.data);
        send(ws, id, { data: result });
        broadcast(ws, "transaction_changed", { action: "create", data: result });
        return;
      }

      case "update": {
        const txId = (params as Record<string, unknown>)?.id;
        if (!txId) {
          send(ws, id, { error: "Missing params.id" });
          return;
        }
        const { id: _id, ...fields } = params as Record<string, unknown>;
        const parsed = updateSchema.safeParse(fields);
        if (!parsed.success) {
          send(ws, id, { error: parsed.error.flatten() });
          return;
        }
        const result = await updateTransaction(String(txId), parsed.data);
        if (!result) {
          send(ws, id, { error: "Transaction not found" });
          return;
        }
        send(ws, id, { data: result });
        broadcast(ws, "transaction_changed", { action: "update", data: result });
        return;
      }

      case "delete": {
        const txId = (params as Record<string, unknown>)?.id;
        if (!txId) {
          send(ws, id, { error: "Missing params.id" });
          return;
        }
        const deleted = await deleteTransaction(String(txId));
        if (!deleted) {
          send(ws, id, { error: "Transaction not found" });
          return;
        }
        send(ws, id, { data: { deleted: true } });
        broadcast(ws, "transaction_changed", { action: "delete", id: txId });
        return;
      }
    }
  } catch (err) {
    send(ws, id, { error: "Internal server error" });
  }
}

export function attachWebSocket(server: Server) {
  const wss = new WebSocketServer({ server, path: "/ws" });
  wssRef = wss;

  wss.on("connection", (ws) => {
    ws.on("message", (data) => {
      handleMessage(ws, data.toString());
    });
  });

  return wss;
}
