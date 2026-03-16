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
import { Plus, RefreshCw, Pencil, Trash2 } from "lucide-react";
import { Toaster, toast } from "sonner";
import type { Transaction } from "./types/transaction";
import type { GridReadyEvent, IDatasource } from "ag-grid-community";

export function App() {
  const {
    error,
    loading,
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

  const handleDeleteSelected = useCallback(async () => {
    if (selectedRows.length === 0) return;
    if (!confirm(`Are you sure you want to delete ${selectedRows.length} transactions?`)) return;

    try {
      // No bulk delete endpoint, loop for now
      for (const tx of selectedRows) {
        await deleteTransaction(tx.id);
      }
      clearSelection();
      toast.success(`${selectedRows.length} transactions deleted`);
    } catch {
      toast.error("Failed to delete some transactions");
    }
  }, [selectedRows, deleteTransaction, clearSelection]);

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
      <div className="w-full py-4 px-3 sm:py-8 sm:px-4 md:px-6">
        <div className="flex items-center justify-between mb-4 sm:mb-6">
          <div className="flex items-center gap-2 sm:gap-3">
            <h1 className="text-xl sm:text-2xl font-bold">Transactions</h1>
            <Badge variant={isConnected ? "default" : "destructive"}>
              {isConnected ? "Connected" : "Disconnected"}
            </Badge>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-4">
          <Input
            placeholder="Filter by Account ID"
            value={filterAccountId}
            onChange={(e) => setFilterAccountId(e.target.value)}
            className="min-w-40 max-w-xs flex-1"
          />
          <Select value={filterType} onValueChange={(v) => setFilterType(v ?? "all")}>
            <SelectTrigger className="w-28 shrink-0">
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All types</SelectItem>
              <SelectItem value="credit">Credit</SelectItem>
              <SelectItem value="debit">Debit</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={applyFilters} className="shrink-0">
            <RefreshCw className="h-4 w-4 sm:mr-2" />
            <span className="hidden sm:inline">Apply</span>
          </Button>
          <div className="flex items-center gap-2 border-l pl-3">
            <Input
              placeholder="Scroll to ID"
              className="w-32 shrink-0"
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
          <div className="flex items-center gap-2 ml-auto">
            <Button
              variant="destructive"
              disabled={selectedRows.length === 0}
              onClick={handleDeleteSelected}
              className="flex-1 sm:flex-none"
            >
              <Trash2 className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Delete Transactions</span>
              <span className="sm:hidden">Delete</span>
            </Button>
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
              className="flex-1 sm:flex-none"
            >
              <Pencil className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Edit Transactions</span>
              <span className="sm:hidden">Edit</span>
            </Button>
            <Button onClick={handleCreate} className="flex-1 sm:flex-none">
              <Plus className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">New Transaction</span>
              <span className="sm:hidden">New</span>
            </Button>
          </div>
        </div>

        <TransactionsGrid
          datasource={datasource}
          cacheBlockSize={PAGE_SIZE}
          totalCount={totalCount}
          loading={loading}
          onUpdate={handleUpdateSubmit}
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
