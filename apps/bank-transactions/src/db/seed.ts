import { pool } from "./pool.js";

const TOTAL_ROWS = 1_000_000;
const BATCH_SIZE = 9_000; // 9000 × 7 params = 63000, under PostgreSQL's 65535 limit

const ACCOUNT_IDS = Array.from({ length: 200 }, (_, i) => `acc_${String(i + 1).padStart(4, "0")}`);
const TYPES = ["credit", "debit"] as const;
// Weighted currency distribution — USD is ~40%, EUR ~20%, rest split evenly
const CURRENCY_WEIGHTS: [string, number][] = [
  ["USD", 40], ["EUR", 20], ["GBP", 8], ["JPY", 6], ["CAD", 5],
  ["CHF", 3], ["AUD", 3], ["NZD", 2], ["SGD", 2], ["HKD", 2],
  ["SEK", 2], ["NOK", 2], ["DKK", 2], ["PLN", 2], ["CZK", 1],
];
const CURRENCY_POOL = CURRENCY_WEIGHTS.flatMap(([c, w]) => Array.from<string>({ length: w }).fill(c));

const MERCHANTS = [
  "Amazon", "Walmart", "Target", "Costco", "Whole Foods",
  "Starbucks", "McDonald's", "Uber", "Lyft", "Netflix",
  "Spotify", "Apple", "Google", "Microsoft", "Adobe",
  "Shell Gas Station", "BP", "Chevron", "Home Depot", "Lowe's",
  "CVS Pharmacy", "Walgreens", "Trader Joe's", "Aldi", "Kroger",
  "Delta Airlines", "United Airlines", "Hilton Hotels", "Airbnb", "Booking.com",
];

const DESCRIPTION_TEMPLATES = [
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
  "International wire transfer",
  "Peer-to-peer payment",
  "Mobile deposit",
  "Cashback reward",
  "Interest payment",
  "Loan repayment",
  "Insurance premium",
  "Tax refund",
  "Dividend income",
  "Commission payment",
  "Freelance payment",
  "Medical copay",
  "Pharmacy purchase",
  "Gas station",
  "Parking fee",
  "Toll charge",
  "Restaurant tip",
  "Hotel booking",
  "Flight purchase",
  "Car rental",
];

const REFERENCE_PREFIXES = ["REF", "TXN", "INV", "ORD", "PMT"];

function randomItem<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]!;
}

/** Generates a realistic amount using a log-normal-ish distribution:
 *  many small transactions, fewer large ones */
function randomAmount(): number {
  const r = Math.random();
  let amount: number;
  if (r < 0.40) {
    // 40% small: $0.50 – $50
    amount = Math.random() * 49.5 + 0.5;
  } else if (r < 0.75) {
    // 35% medium: $50 – $500
    amount = Math.random() * 450 + 50;
  } else if (r < 0.93) {
    // 18% large: $500 – $5,000
    amount = Math.random() * 4500 + 500;
  } else {
    // 7% very large: $5,000 – $50,000
    amount = Math.random() * 45000 + 5000;
  }
  return Math.round(amount * 100) / 100;
}

/** Generates dates with realistic clustering — more recent transactions are more frequent,
 *  with slight weekday bias */
function randomDate(): Date {
  const now = Date.now();
  const twoYearsAgo = now - 2 * 365 * 24 * 60 * 60 * 1000;

  // Bias toward more recent dates using a power curve
  const t = Math.pow(Math.random(), 0.7);
  const ts = twoYearsAgo + t * (now - twoYearsAgo);

  // Add hour-of-day clustering: more transactions during business hours
  const date = new Date(ts);
  if (Math.random() < 0.6) {
    // 60% of the time, set hour between 8–20
    date.setHours(8 + Math.floor(Math.random() * 12), Math.floor(Math.random() * 60), Math.floor(Math.random() * 60));
  }

  return date;
}

function randomReference(): string {
  const prefix = randomItem(REFERENCE_PREFIXES);
  const num = Math.floor(Math.random() * 1_000_000_000).toString(36).toUpperCase();
  return `${prefix}-${num}`;
}

function randomDescription(): string | null {
  // ~10% chance of null description
  if (Math.random() < 0.10) return null;

  const base = randomItem(DESCRIPTION_TEMPLATES);

  // 40% chance to append a merchant name
  const merchant = Math.random() < 0.40 ? ` - ${randomItem(MERCHANTS)}` : "";

  // 30% chance to append a reference number
  const ref = Math.random() < 0.30 ? ` (${randomReference()})` : "";

  return `${base}${merchant}${ref}`;
}

async function seed() {
  console.log(`Seeding ${TOTAL_ROWS} transactions...`);

  let inserted = 0;

  while (inserted < TOTAL_ROWS) {
    const batchSize = Math.min(BATCH_SIZE, TOTAL_ROWS - inserted);
    const values: string[] = [];
    const params: unknown[] = [];

    for (let i = 0; i < batchSize; i++) {
      const offset = i * 7;
      const date = randomDate();
      // updated_at is sometimes slightly after created_at
      const updatedAt = Math.random() < 0.15
        ? new Date(date.getTime() + Math.floor(Math.random() * 7 * 24 * 60 * 60 * 1000))
        : date;

      params.push(
        randomItem(ACCOUNT_IDS),
        randomItem(TYPES),
        randomAmount(),
        randomItem(CURRENCY_POOL),
        randomDescription(),
        date,
        updatedAt,
      );
      values.push(
        `($${offset + 1}, $${offset + 2}, $${offset + 3}, $${offset + 4}, $${offset + 5}, $${offset + 6}, $${offset + 7})`,
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
