export interface Transaction {
  id: number;
  account_id: string;
  type: "credit" | "debit";
  amount: string;
  currency: string;
  description: string | null;
  created_at: string;
  updated_at: string;
  
  // New Finance Specific Columns (32)
  status: string;
  category?: string;
  merchant_name?: string;
  merchant_category_code?: string;
  reference_number?: string;
  transaction_date?: string;
  value_date?: string;
  original_amount?: string;
  original_currency?: string;
  exchange_rate?: string;
  fee_amount?: string;
  tax_amount?: string;
  payment_method?: string;
  card_last4?: string;
  card_network?: string;
  location_city?: string;
  location_country?: string;
  is_recurring?: boolean;
  original_description?: string;
  counterparty_name?: string;
  counterparty_account_number?: string;
  counterparty_bank_code?: string;
  balance_after?: string;
  statement_period?: string;
  metadata?: Record<string, unknown>;
  auth_code?: string;
  channel?: string;
  risk_score?: string;
  labels?: string[];
  notes?: string;
  parent_transaction_id?: number;
  reconciliation_id?: string;
}

export interface TransactionEvent {
  action: "create" | "update" | "delete";
  data?: Transaction;
  id?: number | string;
}

export interface ListParams {
  account_id?: string;
  type?: "credit" | "debit";
  limit?: number;
  offset?: number;
  sort_field?: string;
  sort_direction?: "asc" | "desc";
}

export interface CreateParams {
  account_id: string;
  type: "credit" | "debit";
  amount: number;
  currency?: string;
  description?: string;
}

export interface UpdateParams {
  id: number;
  account_id?: string;
  type?: "credit" | "debit";
  amount?: number;
  currency?: string;
  description?: string;
}
