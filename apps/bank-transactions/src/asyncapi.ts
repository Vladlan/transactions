import { z } from "zod";
import { zodToJsonSchema } from "zod-to-json-schema";
import {
  createSchema,
  updateSchema,
  listQuerySchema,
  countQuerySchema,
} from "./services/transactions.js";

const transactionSchema = z.object({
  id: z.number().int(),
  account_id: z.string().max(64),
  type: z.enum(["credit", "debit"]),
  amount: z.number().positive(),
  currency: z.string().length(3),
  description: z.string().nullable(),
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
        getRequest: { $ref: "#/components/messages/getRequest" },
        createRequest: { $ref: "#/components/messages/createRequest" },
        updateRequest: { $ref: "#/components/messages/updateRequest" },
        deleteRequest: { $ref: "#/components/messages/deleteRequest" },
        successResponse: { $ref: "#/components/messages/successResponse" },
        errorResponse: { $ref: "#/components/messages/errorResponse" },
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
    },
    schemas: {
      Transaction: jsonSchema(transactionSchema),
    },
  },
};
