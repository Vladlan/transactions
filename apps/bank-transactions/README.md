# Bank Transactions API

REST API service for managing financial transactions, built with Express, TypeScript, and PostgreSQL.

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

4. Start the dev server (with hot reload):

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

| Method   | Path                | Description                |
| -------- | ------------------- | -------------------------- |
| `GET`    | `/transactions`     | List transactions          |
| `GET`    | `/transactions/:id` | Get a transaction by ID    |
| `POST`   | `/transactions`     | Create a new transaction   |
| `PUT`    | `/transactions/:id` | Update a transaction       |
| `DELETE` | `/transactions/:id` | Delete a transaction       |

#### Query Parameters (GET /transactions)

| Param        | Type   | Default | Description                   |
| ------------ | ------ | ------- | ----------------------------- |
| `account_id` | string | —       | Filter by account ID          |
| `type`       | string | —       | Filter by type (credit/debit) |
| `limit`      | number | 20      | Results per page (1–100)      |
| `offset`     | number | 0       | Pagination offset             |

#### Create Transaction (POST /transactions)

```json
{
  "account_id": "ACC-001",
  "type": "credit",
  "amount": 150.00,
  "currency": "USD",
  "description": "Monthly deposit"
}
```

Required fields: `account_id`, `type`, `amount`. Optional: `currency` (default: USD), `description`.

## Project Structure

```
src/
├── index.ts              # Express app entry point
├── routes/
│   └── transactions.ts   # Transaction CRUD routes
├── db/
│   ├── pool.ts           # PostgreSQL connection pool
│   └── migrate.ts        # Database schema migration
└── middleware/            # Reserved for future middleware
```
