# Bank Transactions API

REST + WebSocket API service for managing financial transactions, built with Express, TypeScript, and PostgreSQL.

## Tech Stack

- Node.js + TypeScript
- Express.js
- PostgreSQL 17
- Zod (validation)

## Getting Started

### Prerequisites

- Node.js >= 18
- Docker & Docker Compose (for containerized setup)

### Environment Variables

Copy the example env file and adjust if needed:

```bash
cp .env.example .env
```

| Variable      | Default            | Description         |
| ------------- | ------------------ | ------------------- |
| `DB_HOST`     | `localhost`        | PostgreSQL host     |
| `DB_PORT`     | `5432`             | PostgreSQL port     |
| `DB_NAME`     | `bank_transactions`| Database name       |
| `DB_USER`     | `postgres`         | Database user       |
| `DB_PASSWORD` | `postgres`         | Database password   |
| `PORT`        | `3001`             | Express server port |

### Option 1: Docker Compose (recommended)

Start all services (app, PostgreSQL, pgAdmin):

```bash
docker-compose up --build
```

Services will be available at:

| Service       | URL                     | Credentials                              |
| ------------- | ----------------------- | ---------------------------------------- |
| API           | http://localhost:3001   | —                                        |
| PostgreSQL    | localhost:5432          | user: `postgres`, password: `postgres`   |
| pgAdmin       | http://localhost:5050   | email: `admin@admin.com`, password: `admin` |

To connect pgAdmin to PostgreSQL, add a new server with host `postgres`, port `5432`, user `postgres`, password `postgres`.

### Option 2: Local Development

1. Start a PostgreSQL instance (or use `docker-compose up postgres`).

2. Install dependencies from the repo root:

```bash
npm install
```

3. Run the database migration:

```bash
npm run db:migrate
```

4. (Optional) Seed the database with 10M sample transactions:

```bash
npm run db:seed
```

5. Start the dev server (with hot reload):

```bash
npm run dev
```

The API will be running at http://localhost:3001.

### Build for Production

```bash
npm run build
npm run start
```

## API Endpoints

### Health Check

```
GET /health
```

### Transactions

| Method   | Path                  | Description                |
| -------- | --------------------- | -------------------------- |
| `GET`    | `/transactions`       | List transactions          |
| `GET`    | `/transactions/count` | Count transactions         |
| `GET`    | `/transactions/:id`   | Get a transaction by ID    |
| `POST`   | `/transactions`       | Create a new transaction   |
| `PUT`    | `/transactions/:id`   | Update a transaction       |
| `DELETE` | `/transactions/:id`   | Delete a transaction       |

#### Query Parameters (GET /transactions)

| Param            | Type   | Default | Description                                                                 |
| ---------------- | ------ | ------- | --------------------------------------------------------------------------- |
| `account_id`     | string | —       | Filter by account ID                                                        |
| `type`           | string | —       | Filter by type (credit/debit)                                               |
| `limit`          | number | 20      | Results per page (1–100)                                                    |
| `offset`         | number | 0       | Pagination offset                                                           |
| `sort_field`     | string | —       | Column to sort by (see [Sortable columns](#sortable-columns) below)         |
| `sort_direction` | string | asc     | Sort direction (`asc` or `desc`). When `sort_field` is omitted, default order is `id DESC` |

#### Sortable columns

`id`, `account_id`, `type`, `amount`, `currency`, `description`, `created_at`, `status`, `category`, `merchant_name`, `transaction_date`, `value_date`, `original_amount`, `fee_amount`, `tax_amount`, `payment_method`, `location_city`, `location_country`, `is_recurring`, `counterparty_name`, `balance_after`, `risk_score`

#### Create / Update Transaction

Minimal example:

```json
{
  "account_id": "ACC-001",
  "type": "credit",
  "amount": 150.00
}
```

**Required fields:** `account_id`, `type`, `amount`.

**Optional fields** (defaults shown where applicable):

| Field                        | Type     | Default | Notes                        |
| ---------------------------- | -------- | ------- | ---------------------------- |
| `currency`                   | string   | `USD`   | ISO 4217, 3 characters       |
| `description`                | string   | —       |                              |
| `status`                     | string   | —       | e.g. `pending`, `completed`  |
| `category`                   | string   | —       | e.g. `Shopping`, `Travel`    |
| `merchant_name`              | string   | —       |                              |
| `merchant_category_code`     | string   | —       | MCC, max 4 chars             |
| `reference_number`           | string   | —       |                              |
| `transaction_date`           | string   | —       | ISO date                     |
| `value_date`                 | string   | —       | ISO date                     |
| `original_amount`            | number   | —       | Pre-conversion amount        |
| `original_currency`          | string   | —       | ISO 4217, 3 characters       |
| `exchange_rate`              | number   | —       |                              |
| `fee_amount`                 | number   | —       |                              |
| `tax_amount`                 | number   | —       |                              |
| `payment_method`             | string   | —       | e.g. `credit_card`, `atm`   |
| `card_last4`                 | string   | —       | Exactly 4 chars              |
| `card_network`               | string   | —       | e.g. `VISA`, `MASTERCARD`   |
| `location_city`              | string   | —       |                              |
| `location_country`           | string   | —       | ISO 3166, 3 characters       |
| `is_recurring`               | boolean  | —       |                              |
| `original_description`       | string   | —       |                              |
| `counterparty_name`          | string   | —       |                              |
| `counterparty_account_number`| string   | —       |                              |
| `counterparty_bank_code`     | string   | —       |                              |
| `balance_after`              | number   | —       |                              |
| `statement_period`           | string   | —       | e.g. `2025-03`              |
| `metadata`                   | object   | —       | Arbitrary JSON               |
| `auth_code`                  | string   | —       |                              |
| `channel`                    | string   | —       | e.g. `online`, `mobile`     |
| `risk_score`                 | number   | —       |                              |
| `labels`                     | string[] | —       |                              |
| `notes`                      | string   | —       |                              |
| `parent_transaction_id`      | integer  | —       |                              |
| `reconciliation_id`          | string   | —       |                              |

For **PUT /transactions/:id**, all fields are optional (at least one must be provided).

### WebSocket API

Connect to `/ws` and send JSON messages. Each request includes an `action` and optional `params`:

```json
{ "id": "correlation-id", "action": "list", "params": { "limit": 50, "offset": 0 } }
```

| Action       | Description                          | Params                                                  |
| ------------ | ------------------------------------ | ------------------------------------------------------- |
| `list`       | List transactions                    | Same as GET query params                                |
| `count`      | Count transactions                   | `account_id?`, `type?`                                  |
| `findIndex`  | Find row index of a transaction      | Same as list query params + `id` (required)             |
| `get`        | Get transaction by ID                | `id`                                                    |
| `create`     | Create a transaction                 | Same as POST body                                       |
| `update`     | Update a transaction                 | `id` + partial transaction fields                       |
| `bulkUpdate` | Update multiple transactions at once | `filter` (`account_id?`, `type?`) + `fields` (partial)  |
| `delete`     | Delete a transaction                 | `id`                                                    |

#### Live updates

When a transaction is created, updated, bulk-updated, or deleted, the server broadcasts a `transaction_changed` event to all other connected clients:

```json
{ "event": "transaction_changed", "data": { "action": "create" } }
```

Possible `action` values: `create`, `update`, `bulk_update`, `delete`.

### API Documentation

- **OpenAPI (REST)**: `GET /openapi.json` — also available via Swagger UI at `/docs`
- **AsyncAPI (WebSocket)**: `GET /asyncapi.json`

## Project Structure

```
src/
├── index.ts              # Express app entry point
├── openapi.ts            # OpenAPI 3.1 spec (REST)
├── asyncapi.ts           # AsyncAPI 3.0 spec (WebSocket)
├── routes/
│   └── transactions.ts   # Transaction CRUD routes
├── services/
│   └── transactions.ts   # Business logic & database queries
├── ws/
│   └── transactions.ts   # WebSocket handler & broadcasting
└── db/
    ├── pool.ts           # PostgreSQL connection pool
    ├── migrate.ts        # Database schema migration
    └── seed.ts           # Database seeding (10M sample rows)
```
