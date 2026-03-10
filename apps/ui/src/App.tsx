import { useEffect, useState, useCallback } from "react";
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
import { Plus, RefreshCw } from "lucide-react";
import { Toaster, toast } from "sonner";
import type { Transaction } from "./types/transaction";

export function App() {
  const {
    transactions,
    loading,
    error,
    isConnected,
    fetchTransactions,
    createTransaction,
    updateTransaction,
    deleteTransaction,
  } = useTransactions();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTx, setEditingTx] = useState<Transaction | null>(null);
  const [filterAccountId, setFilterAccountId] = useState("");
  const [filterType, setFilterType] = useState<string>("all");

  useEffect(() => {
    if (isConnected) {
      fetchTransactions({ limit: 100, offset: 0 });
    }
  }, [isConnected, fetchTransactions]);

  useEffect(() => {
    if (error) toast.error(error);
  }, [error]);

  const handleFilter = useCallback(() => {
    fetchTransactions({
      limit: 100,
      offset: 0,
      account_id: filterAccountId || undefined,
      type: filterType === "all" ? undefined : (filterType as "credit" | "debit"),
    });
  }, [fetchTransactions, filterAccountId, filterType]);

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
      toast.success("Transaction updated");
    },
    [updateTransaction],
  );

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="container mx-auto py-8 px-4">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold">Transactions</h1>
            <Badge variant={isConnected ? "default" : "destructive"}>
              {isConnected ? "Connected" : "Disconnected"}
            </Badge>
          </div>
          <Button onClick={handleCreate}>
            <Plus className="h-4 w-4 mr-2" />
            New Transaction
          </Button>
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
          <Button variant="outline" onClick={handleFilter}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Apply
          </Button>
        </div>

        <TransactionsGrid
          transactions={transactions}
          loading={loading}
          onUpdate={handleUpdateSubmit}
          onDelete={handleDelete}
          onEdit={handleEdit}
        />

        <TransactionDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          transaction={editingTx}
          onCreate={handleCreateSubmit}
          onUpdate={handleUpdateSubmit}
        />

        <Toaster richColors />
      </div>
    </div>
  );
}
