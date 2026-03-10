import { useState, useCallback, useRef, useEffect } from "react";
import { useWs } from "../ws/useWs";
import type {
  Transaction,
  ListParams,
  CreateParams,
  UpdateParams,
  TransactionEvent,
} from "../types/transaction";
import type { IDatasource, IGetRowsParams, GridApi } from "ag-grid-community";

const PAGE_SIZE = 50;

export function useTransactions() {
  const { request, isConnected, onEvent } = useWs();
  const [error, setError] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState<number | null>(null);
  const filtersRef = useRef<Pick<ListParams, "account_id" | "type">>({});
  const gridApiRef = useRef<GridApi | null>(null);

  const buildDatasource = useCallback(
    (filters: Pick<ListParams, "account_id" | "type">): IDatasource => {
      filtersRef.current = filters;
      return {
        getRows: async (params: IGetRowsParams) => {
          const limit = params.endRow - params.startRow;
          const offset = params.startRow;
          const sort = params.sortModel?.[0];
          try {
            const [rows, countResult] = await Promise.all([
              request<Transaction[]>("list", {
                ...filters,
                limit,
                offset,
                ...(sort && { sort_field: sort.colId, sort_direction: sort.sort }),
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

  const handleTransactionChange = useCallback(
    (eventData: TransactionEvent) => {
      const { action, data, id } = eventData;
      const api = gridApiRef.current;
      if (!api) return;

      if (action === "update" && data) {
        const rowNode = api.getRowNode(String(data.id));
        if (rowNode) {
          rowNode.setData(data);
          api.flashCells({ rowNodes: [rowNode] });
        } else {
          // If row not in cache, we might want to refresh, but wait
          // Maybe it's just not visible.
        }
      } else if (action === "create" || action === "delete") {
        // Create and Delete still need purge because totalCount changes and indexes shift
        refreshGrid();
      }
    },
    [refreshGrid],
  );

  useEffect(() => {
    return onEvent((event, data) => {
      if (event === "transaction_changed") {
        handleTransactionChange(data as TransactionEvent);
      }
    });
  }, [onEvent, handleTransactionChange]);

  const createTransaction = useCallback(
    async (params: CreateParams) => {
      const result = await request<Transaction>("create", params as unknown as Record<string, unknown>);
      // We don't call handleTransactionChange here because the socket event will come back
      // But we can call refreshGrid() to be sure if we want immediate feedback.
      // Actually, for the requester, let's just refresh to see the new row at the top/bottom.
      refreshGrid();
      return result;
    },
    [request, refreshGrid],
  );

  const updateTransaction = useCallback(
    async (params: UpdateParams) => {
      const result = await request<Transaction>("update", params as unknown as Record<string, unknown>);
      if (gridApiRef.current) {
        const rowNode = gridApiRef.current.getRowNode(String(params.id));
        if (rowNode) {
          rowNode.setData(result);
          gridApiRef.current.flashCells({ rowNodes: [rowNode] });
        }
      }
      return result;
    },
    [request],
  );

  const deleteTransaction = useCallback(
    async (id: number) => {
      await request("delete", { id });
      refreshGrid();
    },
    [request, refreshGrid],
  );

  const scrollToId = useCallback(
    async (id: number) => {
      const api = gridApiRef.current;
      if (!api) return;

      // 1. Try to find in cache first
      const node = api.getRowNode(String(id));
      if (node) {
        api.ensureNodeVisible(node, "middle");
        api.flashCells({ rowNodes: [node] });
        return;
      }

      // 2. Not in cache, ask backend for index
      try {
        const columnState = api.getColumnState();
        const sortModel = columnState.find((s) => s.sort);

        const { index } = await request<{ index: number }>("findIndex", {
          id,
          ...filtersRef.current,
          ...(sortModel && { sort_field: sortModel.colId, sort_direction: sortModel.sort }),
        } as unknown as Record<string, unknown>);

        if (index !== -1) {
          api.ensureIndexVisible(index, "middle");
          // Flashing after load is tricky with infinite model, but we can try small delay
          setTimeout(() => {
            const newNode = api.getRowNode(String(id));
            if (newNode) api.flashCells({ rowNodes: [newNode] });
          }, 500);
        } else {
          throw new Error("Transaction not found in current view");
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err));
        throw err;
      }
    },
    [request],
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
    scrollToId,
    PAGE_SIZE,
  };
}
