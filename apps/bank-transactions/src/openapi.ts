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
    status: z.string().max(16).nullable().openapi({ example: "completed" }),
    category: z.string().max(64).nullable().openapi({ example: "Shopping" }),
    merchant_name: z.string().max(128).nullable().openapi({ example: "Amazon" }),
    merchant_category_code: z.string().max(4).nullable().openapi({ example: "5411" }),
    reference_number: z.string().max(64).nullable().openapi({ example: "REF-ABC123" }),
    transaction_date: z.string().nullable().openapi({ example: "2025-01-15" }),
    value_date: z.string().nullable().openapi({ example: "2025-01-16" }),
    original_amount: z.number().nullable().openapi({ example: 95.0 }),
    original_currency: z.string().length(3).nullable().openapi({ example: "EUR" }),
    exchange_rate: z.number().nullable().openapi({ example: 1.058 }),
    fee_amount: z.number().nullable().openapi({ example: 1.5 }),
    tax_amount: z.number().nullable().openapi({ example: 5.0 }),
    payment_method: z.string().max(32).nullable().openapi({ example: "credit_card" }),
    card_last4: z.string().length(4).nullable().openapi({ example: "4242" }),
    card_network: z.string().max(32).nullable().openapi({ example: "VISA" }),
    location_city: z.string().max(64).nullable().openapi({ example: "New York" }),
    location_country: z.string().length(3).nullable().openapi({ example: "USA" }),
    is_recurring: z.boolean().nullable().openapi({ example: false }),
    original_description: z.string().nullable().openapi({ example: "Original unformatted description" }),
    counterparty_name: z.string().max(128).nullable().openapi({ example: "Counterparty 1" }),
    counterparty_account_number: z.string().max(64).nullable().openapi({ example: "ACC-12345678" }),
    counterparty_bank_code: z.string().max(32).nullable().openapi({ example: "SW-123456" }),
    balance_after: z.number().nullable().openapi({ example: 5432.10 }),
    statement_period: z.string().max(16).nullable().openapi({ example: "2025-01" }),
    metadata: z.any().nullable().openapi({ example: { ip: "127.0.0.1", device: "iphone" } }),
    auth_code: z.string().max(32).nullable().openapi({ example: "AUTH-123456" }),
    channel: z.string().max(16).nullable().openapi({ example: "online" }),
    risk_score: z.number().nullable().openapi({ example: 12.5 }),
    labels: z.array(z.string()).nullable().openapi({ example: ["finance", "automated"] }),
    notes: z.string().nullable().openapi({ example: "Random note" }),
    parent_transaction_id: z.number().int().nullable().openapi({ example: null }),
    reconciliation_id: z.string().max(64).nullable().openapi({ example: "REC-1234567" }),
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
  }),
);

const UpdateTransactionSchema = registry.register(
  "UpdateTransaction",
  CreateTransactionSchema.partial(),
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

const sortableColumns = [
  "id", "account_id", "type", "amount", "currency", "description", "created_at",
  "status", "category", "merchant_name", "transaction_date", "value_date", "original_amount",
  "fee_amount", "tax_amount", "payment_method", "location_city", "location_country",
  "is_recurring", "counterparty_name", "balance_after", "risk_score",
] as const;

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
        .enum(sortableColumns)
        .optional()
        .openapi({ description: "Column to sort by" }),
      sort_direction: z
        .enum(["asc", "desc"])
        .optional()
        .openapi({ description: "Sort direction (defaults to asc when sort_field is set, otherwise id DESC)" }),
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
