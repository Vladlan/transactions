import { z } from "zod";
import { zodToJsonSchema } from "zod-to-json-schema";
import {
  createSchema,
  updateSchema,
  listQuerySchema,
  countQuerySchema,
  findIndexQuerySchema,
  bulkUpdateSchema,
} from "./services/transactions.js";

const transactionSchema = z.object({
  id: z.number().int(),
  account_id: z.string().max(64),
  type: z.enum(["credit", "debit"]),
  amount: z.number().positive(),
  currency: z.string().length(3),
  description: z.string().nullable(),
  status: z.string().max(16).nullable(),
  category: z.string().max(64).nullable(),
  merchant_name: z.string().max(128).nullable(),
  merchant_category_code: z.string().max(4).nullable(),
  reference_number: z.string().max(64).nullable(),
  transaction_date: z.string().nullable(),
  value_date: z.string().nullable(),
  original_amount: z.number().nullable(),
  original_currency: z.string().length(3).nullable(),
  exchange_rate: z.number().nullable(),
  fee_amount: z.number().nullable(),
  tax_amount: z.number().nullable(),
  payment_method: z.string().max(32).nullable(),
  card_last4: z.string().length(4).nullable(),
  card_network: z.string().max(32).nullable(),
  location_city: z.string().max(64).nullable(),
  location_country: z.string().length(3).nullable(),
  is_recurring: z.boolean().nullable(),
  original_description: z.string().nullable(),
  counterparty_name: z.string().max(128).nullable(),
  counterparty_account_number: z.string().max(64).nullable(),
  counterparty_bank_code: z.string().max(32).nullable(),
  balance_after: z.number().nullable(),
  statement_period: z.string().max(16).nullable(),
  metadata: z.any().nullable(),
  auth_code: z.string().max(32).nullable(),
  channel: z.string().max(16).nullable(),
  risk_score: z.number().nullable(),
  labels: z.array(z.string()).nullable(),
  notes: z.string().nullable(),
  parent_transaction_id: z.number().int().nullable(),
  reconciliation_id: z.string().max(64).nullable(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
});

function jsonSchema(schema: z.ZodTypeAny) {
  const { $schema, ...rest } = zodToJsonSchema(schema) as Record<string, unknown>;
  return rest;
}

const countParams = z.object({
  id: z.string().or(z.number()).optional().describe("Correlation ID echoed in the response"),
  action: z.literal("count"),
  params: countQuerySchema.optional(),
});

const listParams = z.object({
  id: z.string().or(z.number()).optional().describe("Correlation ID echoed in the response"),
  action: z.literal("list"),
  params: listQuerySchema.optional(),
});

const findIndexParams = z.object({
  id: z.string().or(z.number()).optional().describe("Correlation ID echoed in the response"),
  action: z.literal("findIndex"),
  params: findIndexQuerySchema,
});

const getParams = z.object({
  id: z.string().or(z.number()).optional(),
  action: z.literal("get"),
  params: z.object({ id: z.number().int().describe("Transaction ID") }),
});

const createParams = z.object({
  id: z.string().or(z.number()).optional(),
  action: z.literal("create"),
  params: createSchema,
});

const updateParams = z.object({
  id: z.string().or(z.number()).optional(),
  action: z.literal("update"),
  params: updateSchema.innerType().extend({
    id: z.number().int().describe("Transaction ID to update"),
  }),
});

const bulkUpdateParams = z.object({
  id: z.string().or(z.number()).optional(),
  action: z.literal("bulkUpdate"),
  params: bulkUpdateSchema,
});

const deleteParams = z.object({
  id: z.string().or(z.number()).optional(),
  action: z.literal("delete"),
  params: z.object({ id: z.number().int().describe("Transaction ID") }),
});

const successResponse = z.object({
  id: z.string().or(z.number()).optional(),
  data: z.unknown(),
});

const errorResponse = z.object({
  id: z.string().or(z.number()).optional(),
  error: z.unknown(),
});

const transactionChangedEvent = z.object({
  event: z.literal("transaction_changed"),
  data: z.object({
    action: z.enum(["create", "update", "bulk_update", "delete"]).describe("The mutation that triggered the broadcast"),
  }),
});

export const asyncApiDocument = {
  asyncapi: "3.0.0",
  info: {
    title: "Bank Transactions WebSocket API",
    version: "1.0.0",
    description:
      "WebSocket API for managing bank transactions. Connect to the `/ws` endpoint and send JSON messages.",
  },
  servers: {
    development: {
      host: "localhost:3001",
      pathname: "/ws",
      protocol: "ws",
    },
  },
  channels: {
    transactions: {
      address: "/ws",
      messages: {
        countRequest: { $ref: "#/components/messages/countRequest" },
        listRequest: { $ref: "#/components/messages/listRequest" },
        findIndexRequest: { $ref: "#/components/messages/findIndexRequest" },
        getRequest: { $ref: "#/components/messages/getRequest" },
        createRequest: { $ref: "#/components/messages/createRequest" },
        updateRequest: { $ref: "#/components/messages/updateRequest" },
        bulkUpdateRequest: { $ref: "#/components/messages/bulkUpdateRequest" },
        deleteRequest: { $ref: "#/components/messages/deleteRequest" },
        successResponse: { $ref: "#/components/messages/successResponse" },
        errorResponse: { $ref: "#/components/messages/errorResponse" },
        transactionChanged: { $ref: "#/components/messages/transactionChanged" },
      },
    },
  },
  operations: {
    countTransactions: {
      action: "send",
      channel: { $ref: "#/channels/transactions" },
      summary: "Count transactions with optional filters",
      messages: [{ $ref: "#/channels/transactions/messages/countRequest" }],
    },
    listTransactions: {
      action: "send",
      channel: { $ref: "#/channels/transactions" },
      summary: "List transactions with optional filters",
      messages: [{ $ref: "#/channels/transactions/messages/listRequest" }],
    },
    findRowIndex: {
      action: "send",
      channel: { $ref: "#/channels/transactions" },
      summary: "Find the row index of a transaction in the current sort order",
      messages: [{ $ref: "#/channels/transactions/messages/findIndexRequest" }],
    },
    getTransaction: {
      action: "send",
      channel: { $ref: "#/channels/transactions" },
      summary: "Get a single transaction by ID",
      messages: [{ $ref: "#/channels/transactions/messages/getRequest" }],
    },
    createTransaction: {
      action: "send",
      channel: { $ref: "#/channels/transactions" },
      summary: "Create a new transaction",
      messages: [{ $ref: "#/channels/transactions/messages/createRequest" }],
    },
    updateTransaction: {
      action: "send",
      channel: { $ref: "#/channels/transactions" },
      summary: "Update an existing transaction",
      messages: [{ $ref: "#/channels/transactions/messages/updateRequest" }],
    },
    bulkUpdateTransactions: {
      action: "send",
      channel: { $ref: "#/channels/transactions" },
      summary: "Update multiple transactions matching a filter",
      messages: [{ $ref: "#/channels/transactions/messages/bulkUpdateRequest" }],
    },
    deleteTransaction: {
      action: "send",
      channel: { $ref: "#/channels/transactions" },
      summary: "Delete a transaction",
      messages: [{ $ref: "#/channels/transactions/messages/deleteRequest" }],
    },
    receiveSuccess: {
      action: "receive",
      channel: { $ref: "#/channels/transactions" },
      summary: "Successful response with data",
      messages: [{ $ref: "#/channels/transactions/messages/successResponse" }],
    },
    receiveError: {
      action: "receive",
      channel: { $ref: "#/channels/transactions" },
      summary: "Error response",
      messages: [{ $ref: "#/channels/transactions/messages/errorResponse" }],
    },
    receiveTransactionChanged: {
      action: "receive",
      channel: { $ref: "#/channels/transactions" },
      summary: "Broadcast sent to all other clients when a transaction is created, updated, bulk-updated, or deleted",
      messages: [{ $ref: "#/channels/transactions/messages/transactionChanged" }],
    },
  },
  components: {
    messages: {
      countRequest: {
        summary: "Count transactions",
        payload: {
          schemaFormat: "application/schema+json;version=draft-07",
          schema: jsonSchema(countParams),
        },
      },
      listRequest: {
        summary: "List transactions",
        payload: {
          schemaFormat: "application/schema+json;version=draft-07",
          schema: jsonSchema(listParams),
        },
      },
      findIndexRequest: {
        summary: "Find row index of a transaction",
        payload: {
          schemaFormat: "application/schema+json;version=draft-07",
          schema: jsonSchema(findIndexParams),
        },
      },
      getRequest: {
        summary: "Get transaction by ID",
        payload: {
          schemaFormat: "application/schema+json;version=draft-07",
          schema: jsonSchema(getParams),
        },
      },
      createRequest: {
        summary: "Create transaction",
        payload: {
          schemaFormat: "application/schema+json;version=draft-07",
          schema: jsonSchema(createParams),
        },
      },
      updateRequest: {
        summary: "Update transaction",
        payload: {
          schemaFormat: "application/schema+json;version=draft-07",
          schema: jsonSchema(updateParams),
        },
      },
      bulkUpdateRequest: {
        summary: "Bulk update transactions",
        payload: {
          schemaFormat: "application/schema+json;version=draft-07",
          schema: jsonSchema(bulkUpdateParams),
        },
      },
      deleteRequest: {
        summary: "Delete transaction",
        payload: {
          schemaFormat: "application/schema+json;version=draft-07",
          schema: jsonSchema(deleteParams),
        },
      },
      successResponse: {
        summary: "Successful response",
        payload: {
          schemaFormat: "application/schema+json;version=draft-07",
          schema: jsonSchema(successResponse),
        },
      },
      errorResponse: {
        summary: "Error response",
        payload: {
          schemaFormat: "application/schema+json;version=draft-07",
          schema: jsonSchema(errorResponse),
        },
      },
      transactionChanged: {
        summary: "Transaction changed broadcast",
        payload: {
          schemaFormat: "application/schema+json;version=draft-07",
          schema: jsonSchema(transactionChangedEvent),
        },
      },
    },
    schemas: {
      Transaction: jsonSchema(transactionSchema),
    },
  },
};
