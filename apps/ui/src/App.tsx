import { useEffect, useState, useCallback, useRef } from "react";
import { useTransactions } from "./hooks/useTransactions";
import { TransactionsGrid } from "./components/TransactionsGrid";
import { TransactionDialog } from "./components/TransactionDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Plus, RefreshCw, Pencil } from "lucide-react";
import { Toaster, toast } from "sonner";
import type { Transaction } from "./types/transaction";
import type { GridReadyEvent, IDatasource } from "ag-grid-community";

export function App() {
  const {
    error,
    totalCount,
    isConnected,
    buildDatasource,
    gridApiRef,
    createTransaction,
    updateTransaction,
    deleteTransaction,
    clearSelection,
    scrollToId,
    PAGE_SIZE,
  } = useTransactions();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTx, setEditingTx] = useState<Transaction | null>(null);
  const [filterAccountId, setFilterAccountId] = useState("");
  const [filterType, setFilterType] = useState<string>("all");
  const [datasource, setDatasource] = useState<IDatasource | undefined>();
  const [selectedRows, setSelectedRows] = useState<Transaction[]>([]);
  const gridReadyRef = useRef(false);

  const applyFilters = useCallback(() => {
    const filters = {
      account_id: filterAccountId || undefined,
      type: filterType === "all" ? undefined : (filterType as "credit" | "debit"),
    };
    setDatasource(buildDatasource(filters));
  }, [buildDatasource, filterAccountId, filterType]);

  useEffect(() => {
    if (isConnected) {
      applyFilters();
    }
  }, [isConnected]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (error) toast.error(error);
  }, [error]);

  const handleGridReady = useCallback(
    (event: GridReadyEvent) => {
      gridApiRef.current = event.api;
      gridReadyRef.current = true;
    },
    [gridApiRef],
  );

  const handleEdit = useCallback((tx: Transaction) => {
    setEditingTx(tx);
    setDialogOpen(true);
  }, []);

  const handleCreate = useCallback(() => {
    setEditingTx(null);
    setDialogOpen(true);
  }, []);

  const handleDelete = useCallback(
    async (id: number) => {
      try {
        await deleteTransaction(id);
        clearSelection();
        toast.success("Transaction deleted");
      } catch {
        toast.error("Failed to delete transaction");
      }
    },
    [deleteTransaction],
  );

  const handleCreateSubmit = useCallback(
    async (params: Parameters<typeof createTransaction>[0]) => {
      await createTransaction(params);
      toast.success("Transaction created");
    },
    [createTransaction],
  );

  const handleUpdateSubmit = useCallback(
    async (params: Parameters<typeof updateTransaction>[0]) => {
      await updateTransaction(params);
      clearSelection();
      toast.success("Transaction updated");
    },
    [updateTransaction],
  );

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="w-full py-8 px-4 md:px-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold">Transactions</h1>
            <Badge variant={isConnected ? "default" : "destructive"}>
              {isConnected ? "Connected" : "Disconnected"}
            </Badge>
          </div>
        </div>

        <div className="flex items-center gap-3 mb-4">
          <Input
            placeholder="Filter by Account ID"
            value={filterAccountId}
            onChange={(e) => setFilterAccountId(e.target.value)}
            className="max-w-xs"
          />
          <Select value={filterType} onValueChange={(v) => setFilterType(v ?? "all")}>
            <SelectTrigger className="w-35">
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All types</SelectItem>
              <SelectItem value="credit">Credit</SelectItem>
              <SelectItem value="debit">Debit</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={applyFilters}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Apply
          </Button>
          <div className="flex items-center gap-2 border-l pl-3 ml-1">
            <Input
              placeholder="Scroll to ID"
              className="w-32"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  const id = parseInt(e.currentTarget.value);
                  if (!isNaN(id)) {
                    const target = e.currentTarget;
                    scrollToId(id)
                      .then(() => {
                        target.value = "";
                      })
                      .catch(() => {
                        // Error is handled by hook
                      });
                  }
                }
              }}
            />
          </div>
          <div className="ml-auto flex items-center gap-2">
            <Button
              variant="secondary"
              disabled={selectedRows.length === 0}
              onClick={() => {
                if (selectedRows.length === 1) {
                  handleEdit(selectedRows[0]!);
                } else if (selectedRows.length > 1) {
                  setEditingTx(null);
                  setDialogOpen(true);
                }
              }}
            >
              <Pencil className="h-4 w-4 mr-2" />
              Edit Transactions
            </Button>
            <Button onClick={handleCreate}>
              <Plus className="h-4 w-4 mr-2" />
              New Transaction
            </Button>
          </div>
        </div>

        <TransactionsGrid
          datasource={datasource}
          cacheBlockSize={PAGE_SIZE}
          totalCount={totalCount}
          onUpdate={handleUpdateSubmit}
          onDelete={handleDelete}
          onEdit={handleEdit}
          onSelectionChanged={setSelectedRows}
          onGridReady={handleGridReady}
        />

        <TransactionDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          transaction={editingTx}
          selectedTransactions={selectedRows}
          onCreate={handleCreateSubmit}
          onUpdate={handleUpdateSubmit}
        />

        <Toaster richColors />
      </div>
    </div>
  );
}
