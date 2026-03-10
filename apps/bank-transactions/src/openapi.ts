import {
  OpenAPIRegistry,
  OpenApiGeneratorV31,
  extendZodWithOpenApi,
} from "@asteasolutions/zod-to-openapi";
import { z } from "zod";

extendZodWithOpenApi(z);

const registry = new OpenAPIRegistry();

const TransactionSchema = registry.register(
  "Transaction",
  z.object({
    id: z.number().int().openapi({ example: 1 }),
    account_id: z.string().max(64).openapi({ example: "acc_123" }),
    type: z.enum(["credit", "debit"]),
    amount: z.number().positive().openapi({ example: 100.5 }),
    currency: z.string().length(3).openapi({ example: "USD" }),
    description: z.string().nullable().openapi({ example: "Wire transfer" }),
    created_at: z.string().datetime().openapi({ example: "2025-01-01T00:00:00.000Z" }),
    updated_at: z.string().datetime().openapi({ example: "2025-01-01T00:00:00.000Z" }),
  }),
);

const CreateTransactionSchema = registry.register(
  "CreateTransaction",
  z.object({
    account_id: z.string().min(1).max(64),
    type: z.enum(["credit", "debit"]),
    amount: z.number().positive(),
    currency: z.string().length(3).default("USD"),
    description: z.string().optional(),
  }),
);

const UpdateTransactionSchema = registry.register(
  "UpdateTransaction",
  z
    .object({
      account_id: z.string().min(1).max(64),
      type: z.enum(["credit", "debit"]),
      amount: z.number().positive(),
      currency: z.string().length(3),
      description: z.string(),
    })
    .partial(),
);

const ValidationErrorSchema = registry.register(
  "ValidationError",
  z.object({
    error: z.object({}).passthrough(),
  }),
);

const NotFoundErrorSchema = registry.register(
  "NotFoundError",
  z.object({
    error: z.string().openapi({ example: "Transaction not found" }),
  }),
);

// GET /health
registry.registerPath({
  method: "get",
  path: "/health",
  operationId: "healthCheck",
  summary: "Health check",
  responses: {
    200: {
      description: "Service is healthy",
      content: {
        "application/json": {
          schema: z.object({ status: z.string().openapi({ example: "ok" }) }),
        },
      },
    },
  },
});

// GET /transactions/count
registry.registerPath({
  method: "get",
  path: "/transactions/count",
  operationId: "countTransactions",
  summary: "Count transactions",
  request: {
    query: z.object({
      account_id: z.string().optional(),
      type: z.enum(["credit", "debit"]).optional(),
    }),
  },
  responses: {
    200: {
      description: "Transaction count",
      content: {
        "application/json": {
          schema: z.object({
            count: z.number().int().openapi({ example: 42 }),
          }),
        },
      },
    },
    400: {
      description: "Validation error",
      content: { "application/json": { schema: ValidationErrorSchema } },
    },
  },
});

// GET /transactions
registry.registerPath({
  method: "get",
  path: "/transactions",
  operationId: "listTransactions",
  summary: "List transactions",
  request: {
    query: z.object({
      account_id: z.string().optional(),
      type: z.enum(["credit", "debit"]).optional(),
      limit: z.coerce.number().int().min(1).max(100).default(20),
      offset: z.coerce.number().int().min(0).default(0),
      sort_field: z
        .enum(["id", "account_id", "type", "amount", "currency", "description", "created_at"])
        .optional()
        .openapi({ description: "Column to sort by" }),
      sort_direction: z
        .enum(["asc", "desc"])
        .optional()
        .openapi({ description: "Sort direction (defaults to asc)" }),
    }),
  },
  responses: {
    200: {
      description: "List of transactions",
      content: {
        "application/json": {
          schema: z.array(TransactionSchema),
        },
      },
    },
    400: {
      description: "Validation error",
      content: { "application/json": { schema: ValidationErrorSchema } },
    },
  },
});

// GET /transactions/{id}
registry.registerPath({
  method: "get",
  path: "/transactions/{id}",
  operationId: "getTransaction",
  summary: "Get a transaction by ID",
  request: {
    params: z.object({ id: z.coerce.number().int() }),
  },
  responses: {
    200: {
      description: "Transaction found",
      content: { "application/json": { schema: TransactionSchema } },
    },
    404: {
      description: "Not found",
      content: { "application/json": { schema: NotFoundErrorSchema } },
    },
  },
});

// POST /transactions
registry.registerPath({
  method: "post",
  path: "/transactions",
  operationId: "createTransaction",
  summary: "Create a transaction",
  request: {
    body: {
      content: { "application/json": { schema: CreateTransactionSchema } },
    },
  },
  responses: {
    201: {
      description: "Transaction created",
      content: { "application/json": { schema: TransactionSchema } },
    },
    400: {
      description: "Validation error",
      content: { "application/json": { schema: ValidationErrorSchema } },
    },
  },
});

// PUT /transactions/{id}
registry.registerPath({
  method: "put",
  path: "/transactions/{id}",
  operationId: "updateTransaction",
  summary: "Update a transaction",
  request: {
    params: z.object({ id: z.coerce.number().int() }),
    body: {
      content: { "application/json": { schema: UpdateTransactionSchema } },
    },
  },
  responses: {
    200: {
      description: "Transaction updated",
      content: { "application/json": { schema: TransactionSchema } },
    },
    400: {
      description: "Validation error",
      content: { "application/json": { schema: ValidationErrorSchema } },
    },
    404: {
      description: "Not found",
      content: { "application/json": { schema: NotFoundErrorSchema } },
    },
  },
});

// DELETE /transactions/{id}
registry.registerPath({
  method: "delete",
  path: "/transactions/{id}",
  operationId: "deleteTransaction",
  summary: "Delete a transaction",
  request: {
    params: z.object({ id: z.coerce.number().int() }),
  },
  responses: {
    204: { description: "Transaction deleted" },
    404: {
      description: "Not found",
      content: { "application/json": { schema: NotFoundErrorSchema } },
    },
  },
});

const generator = new OpenApiGeneratorV31(registry.definitions);

export const openApiDocument = generator.generateDocument({
  openapi: "3.1.0",
  info: {
    title: "Bank Transactions API",
    version: "1.0.0",
    description: "CRUD API for bank transactions",
  },
  servers: [{ url: "http://localhost:3001" }],
});
