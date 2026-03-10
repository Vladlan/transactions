import { pool } from "./pool.js";

async function migrate() {
  await pool.query(`
    DROP TABLE IF EXISTS transactions CASCADE;

    CREATE TABLE IF NOT EXISTS transactions (
      id SERIAL PRIMARY KEY,
      account_id VARCHAR(64) NOT NULL,
      type VARCHAR(16) NOT NULL CHECK (type IN ('credit', 'debit')),
      amount NUMERIC(15, 2) NOT NULL CHECK (amount > 0),
      currency VARCHAR(3) NOT NULL DEFAULT 'USD',
      description TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      
      -- New Finance Specific Columns (32)
      status VARCHAR(16) DEFAULT 'completed',
      category VARCHAR(64),
      merchant_name VARCHAR(128),
      merchant_category_code VARCHAR(4),
      reference_number VARCHAR(64),
      transaction_date DATE DEFAULT CURRENT_DATE,
      value_date DATE DEFAULT CURRENT_DATE,
      original_amount NUMERIC(15, 2),
      original_currency VARCHAR(3),
      exchange_rate NUMERIC(15, 6),
      fee_amount NUMERIC(15, 2) DEFAULT 0,
      tax_amount NUMERIC(15, 2) DEFAULT 0,
      payment_method VARCHAR(32),
      card_last4 VARCHAR(4),
      card_network VARCHAR(32),
      location_city VARCHAR(64),
      location_country VARCHAR(3),
      is_recurring BOOLEAN DEFAULT FALSE,
      original_description TEXT,
      counterparty_name VARCHAR(128),
      counterparty_account_number VARCHAR(64),
      counterparty_bank_code VARCHAR(32),
      balance_after NUMERIC(15, 2),
      statement_period VARCHAR(16),
      metadata JSONB DEFAULT '{}',
      auth_code VARCHAR(32),
      channel VARCHAR(16),
      risk_score NUMERIC(5, 2),
      labels TEXT[],
      notes TEXT,
      parent_transaction_id INTEGER,
      reconciliation_id VARCHAR(64)
    );

    CREATE INDEX IF NOT EXISTS idx_transactions_account_id ON transactions (account_id);
    CREATE INDEX IF NOT EXISTS idx_transactions_status ON transactions (status);
    CREATE INDEX IF NOT EXISTS idx_transactions_category ON transactions (category);
    CREATE INDEX IF NOT EXISTS idx_transactions_transaction_date ON transactions (transaction_date);
  `);

  console.log("Migration complete");
  await pool.end();
}

migrate().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
