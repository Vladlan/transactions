import { useState, useCallback, useRef } from "react";
import { useWs } from "../ws/useWs";
import type {
  Transaction,
  ListParams,
  CreateParams,
  UpdateParams,
} from "../types/transaction";
import type { IDatasource, IGetRowsParams } from "ag-grid-community";

const PAGE_SIZE = 50;

export function useTransactions() {
  const { request, isConnected } = useWs();
  const [error, setError] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState<number | null>(null);
  const filtersRef = useRef<Pick<ListParams, "account_id" | "type">>({});
  const gridApiRef = useRef<{ purgeInfiniteCache?: () => void } | null>(null);

  const buildDatasource = useCallback(
    (filters: Pick<ListParams, "account_id" | "type">): IDatasource => {
      filtersRef.current = filters;
      return {
        getRows: async (params: IGetRowsParams) => {
          const limit = params.endRow - params.startRow;
          const offset = params.startRow;
          try {
            const [rows, countResult] = await Promise.all([
              request<Transaction[]>("list", {
                ...filters,
                limit,
                offset,
              } as unknown as Record<string, unknown>),
              request<{ count: number }>("count", {
                ...filters,
              } as unknown as Record<string, unknown>),
            ]);
            params.successCallback(rows, countResult.count);
            setTotalCount(countResult.count);
            setError(null);
          } catch (err) {
            setError(err instanceof Error ? err.message : String(err));
            params.failCallback();
          }
        },
      };
    },
    [request],
  );

  const refreshGrid = useCallback(() => {
    gridApiRef.current?.purgeInfiniteCache?.();
  }, []);

  const createTransaction = useCallback(
    async (params: CreateParams) => {
      await request("create", params as unknown as Record<string, unknown>);
      refreshGrid();
    },
    [request, refreshGrid],
  );

  const updateTransaction = useCallback(
    async (params: UpdateParams) => {
      await request("update", params as unknown as Record<string, unknown>);
      refreshGrid();
    },
    [request, refreshGrid],
  );

  const deleteTransaction = useCallback(
    async (id: number) => {
      await request("delete", { id });
      refreshGrid();
    },
    [request, refreshGrid],
  );

  return {
    error,
    totalCount,
    isConnected,
    buildDatasource,
    gridApiRef,
    refreshGrid,
    createTransaction,
    updateTransaction,
    deleteTransaction,
    PAGE_SIZE,
  };
}
