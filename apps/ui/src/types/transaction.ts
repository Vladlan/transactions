export interface Transaction {
  id: number;
  account_id: string;
  type: "credit" | "debit";
  amount: string;
  currency: string;
  description: string | null;
  created_at: string;
  updated_at: string;
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
