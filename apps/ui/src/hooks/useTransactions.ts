import { useState, useCallback, useRef } from "react";
import { useWs } from "../ws/useWs";
import type {
  Transaction,
  ListParams,
  CreateParams,
  UpdateParams,
} from "../types/transaction";

export function useTransactions() {
  const { request, isConnected } = useWs();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const currentParams = useRef<ListParams>({ limit: 100, offset: 0 });

  const fetchTransactions = useCallback(
    async (params?: ListParams) => {
      if (params) currentParams.current = params;
      setLoading(true);
      setError(null);
      try {
        const data = await request<Transaction[]>("list", currentParams.current as Record<string, unknown>);
        setTransactions(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err));
      } finally {
        setLoading(false);
      }
    },
    [request],
  );

  const createTransaction = useCallback(
    async (params: CreateParams) => {
      await request("create", params as unknown as Record<string, unknown>);
      await fetchTransactions();
    },
    [request, fetchTransactions],
  );

  const updateTransaction = useCallback(
    async (params: UpdateParams) => {
      await request("update", params as unknown as Record<string, unknown>);
      await fetchTransactions();
    },
    [request, fetchTransactions],
  );

  const deleteTransaction = useCallback(
    async (id: number) => {
      await request("delete", { id });
      await fetchTransactions();
    },
    [request, fetchTransactions],
  );

  return {
    transactions,
    loading,
    error,
    isConnected,
    fetchTransactions,
    createTransaction,
    updateTransaction,
    deleteTransaction,
  };
}
