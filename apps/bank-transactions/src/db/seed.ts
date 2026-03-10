import { pool } from "./pool.js";

const TOTAL_ROWS = 10_000_000;

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

const STATUSES = ["pending", "completed", "failed", "cancelled"];
const CATEGORIES = ["Shopping", "Travel", "Food & Drink", "Health", "Grocery", "Utilities", "Salary", "Rent", "Insurance", "Entertainment"];
const PAYMENT_METHODS = ["credit_card", "debit_card", "bank_transfer", "mobile_pay", "atm", "check"];
const CARD_NETWORKS = ["VISA", "MASTERCARD", "AMEX", "DISCOVER"];
const CITIES = ["New York", "London", "London", "Tokyo", "Berlin", "Paris", "Sydney", "Toronto", "Dubai", "Singapore"];
const COUNTRIES = ["USA", "GBR", "JPN", "DEU", "FRA", "AUS", "CAN", "ARE", "SGP"];
const CHANNELS = ["online", "mobile", "atm", "branch"];

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

  const COLUMN_NAMES = [
    "account_id", "type", "amount", "currency", "description", "created_at", "updated_at",
    "status", "category", "merchant_name", "merchant_category_code", "reference_number",
    "transaction_date", "value_date", "original_amount", "original_currency", "exchange_rate",
    "fee_amount", "tax_amount", "payment_method", "card_last4", "card_network", "location_city",
    "location_country", "is_recurring", "original_description", "counterparty_name",
    "counterparty_account_number", "counterparty_bank_code", "balance_after", "statement_period",
    "metadata", "auth_code", "channel", "risk_score", "labels", "notes", "parent_transaction_id",
    "reconciliation_id"
  ];
  const COL_COUNT = COLUMN_NAMES.length;

  while (inserted < TOTAL_ROWS) {
    const batchSize = Math.min(Math.floor(65535 / COL_COUNT), TOTAL_ROWS - inserted);
    const values: string[] = [];
    const params: unknown[] = [];

    for (let i = 0; i < batchSize; i++) {
      const offset = i * COL_COUNT;
      const date = randomDate();
      const updated_at = Math.random() < 0.15
        ? new Date(date.getTime() + Math.floor(Math.random() * 7 * 24 * 60 * 60 * 1000))
        : date;
      
      const amount = randomAmount();
      const currency = randomItem(CURRENCY_POOL);
      const isForex = Math.random() < 0.2;
      const original_currency = isForex ? randomItem(CURRENCY_POOL.filter(c => c !== currency)) : currency;
      const exchange_rate = isForex ? 0.8 + Math.random() * 0.4 : 1.0;
      const original_amount = Math.round(amount * exchange_rate * 100) / 100;
      const fee = Math.random() < 0.3 ? Math.round(amount * 0.01 * 100) / 100 : 0;
      const tax = Math.random() < 0.5 ? Math.round(amount * 0.05 * 100) / 100 : 0;

      const txParams = [
        randomItem(ACCOUNT_IDS),
        randomItem(TYPES),
        amount,
        currency,
        randomDescription(),
        date,
        updated_at,
        randomItem(STATUSES),
        randomItem(CATEGORIES),
        randomItem(MERCHANTS),
        Math.floor(1000 + Math.random() * 9000).toString(),
        randomReference(),
        date,
        new Date(date.getTime() + 24 * 60 * 60 * 1000), // value_date is often next day
        original_amount,
        original_currency,
        exchange_rate,
        fee,
        tax,
        randomItem(PAYMENT_METHODS),
        Math.floor(1000 + Math.random() * 9000).toString(),
        randomItem(CARD_NETWORKS),
        randomItem(CITIES),
        randomItem(COUNTRIES),
        Math.random() < 0.1,
        "Original unformatted description",
        `Counterparty ${Math.floor(Math.random() * 100)}`,
        `ACC-${Math.floor(10000000 + Math.random() * 90000000)}`,
        `SW-${Math.floor(100000 + Math.random() * 900000)}`,
        Math.round((5000 + Math.random() * 10000) * 100) / 100,
        `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`,
        JSON.stringify({ ip: "127.0.0.1", device: "iphone" }),
        `AUTH-${Math.floor(100000 + Math.random() * 900000)}`,
        randomItem(CHANNELS),
        Math.round(Math.random() * 100 * 100) / 100,
        ["finance", "automated"],
        "Random note",
        null, // parent_transaction_id
        `REC-${Math.floor(1000000 + Math.random() * 9000000)}`
      ];

      params.push(...txParams);
      const placeHolders = txParams.map((_, idx) => `$${offset + idx + 1}`).join(", ");
      values.push(`(${placeHolders})`);
    }

    await pool.query(
      `INSERT INTO transactions (${COLUMN_NAMES.join(", ")})
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
