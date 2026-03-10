import { pool } from "./pool.js";

const TOTAL_ROWS = 10_000;
const BATCH_SIZE = 1_000;

const ACCOUNT_IDS = Array.from({ length: 50 }, (_, i) => `acc_${String(i + 1).padStart(4, "0")}`);
const TYPES = ["credit", "debit"] as const;
const CURRENCIES = ["USD", "EUR", "GBP", "JPY", "CAD"];
const DESCRIPTIONS = [
  "Wire transfer",
  "Direct deposit",
  "ATM withdrawal",
  "Online purchase",
  "Subscription payment",
  "Refund",
  "Salary",
  "Utility bill",
  "Rent payment",
  "Grocery store",
  null,
];

function randomItem<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]!;
}

function randomAmount(): number {
  return Math.round((Math.random() * 9999 + 1) * 100) / 100;
}

function randomDate(): Date {
  const now = Date.now();
  const oneYearAgo = now - 365 * 24 * 60 * 60 * 1000;
  return new Date(oneYearAgo + Math.random() * (now - oneYearAgo));
}

async function seed() {
  console.log(`Seeding ${TOTAL_ROWS} transactions...`);

  let inserted = 0;

  while (inserted < TOTAL_ROWS) {
    const batchSize = Math.min(BATCH_SIZE, TOTAL_ROWS - inserted);
    const values: string[] = [];
    const params: unknown[] = [];

    for (let i = 0; i < batchSize; i++) {
      const offset = i * 6;
      const date = randomDate();
      params.push(
        randomItem(ACCOUNT_IDS),
        randomItem(TYPES),
        randomAmount(),
        randomItem(CURRENCIES),
        randomItem(DESCRIPTIONS),
        date,
      );
      values.push(
        `($${offset + 1}, $${offset + 2}, $${offset + 3}, $${offset + 4}, $${offset + 5}, $${offset + 6}, $${offset + 6})`,
      );
    }

    await pool.query(
      `INSERT INTO transactions (account_id, type, amount, currency, description, created_at, updated_at)
       VALUES ${values.join(", ")}`,
      params,
    );

    inserted += batchSize;
    console.log(`  ${inserted} / ${TOTAL_ROWS}`);
  }

  console.log("Seed complete");
  await pool.end();
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
