import { pool } from "./pool.js";

async function migrate() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS transactions (
      id SERIAL PRIMARY KEY,
      account_id VARCHAR(64) NOT NULL,
      type VARCHAR(16) NOT NULL CHECK (type IN ('credit', 'debit')),
      amount NUMERIC(15, 2) NOT NULL CHECK (amount > 0),
      currency VARCHAR(3) NOT NULL DEFAULT 'USD',
      description TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE INDEX IF NOT EXISTS idx_transactions_account_id ON transactions (account_id);
  `);

  console.log("Migration complete");
  await pool.end();
}

migrate().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
