import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TextareaHTMLAttributes } from "react";
import type { Transaction, CreateParams, UpdateParams } from "@/types/transaction";

const Textarea = ({ className, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) => (
  <textarea
    className={cn(
      "flex min-h-[80px] w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm transition-colors outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm dark:bg-input/30",
      className
    )}
    {...props}
  />
);

const ScrollArea = ({ children, className }: { children: React.ReactNode; className?: string }) => (
  <div className={cn("overflow-y-auto", className)}>
    {children}
  </div>
);

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  transaction?: Transaction | null;
  onCreate: (params: CreateParams) => Promise<void>;
  onUpdate: (params: UpdateParams) => Promise<void>;
}

export function TransactionDialog({ open, onOpenChange, transaction, onCreate, onUpdate }: Props) {
  const isEdit = !!transaction;
  const [accountId, setAccountId] = useState("");
  const [type, setType] = useState<"credit" | "debit">("credit");
  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState("USD");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState("pending");
  const [category, setCategory] = useState("");
  const [merchantName, setMerchantName] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("");
  const [transactionDate, setTransactionDate] = useState("");
  const [valueDate, setValueDate] = useState("");
  const [referenceNumber, setReferenceNumber] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (transaction) {
      setAccountId(transaction.account_id);
      setType(transaction.type);
      setAmount(String(transaction.amount));
      setCurrency(transaction.currency);
      setDescription(transaction.description ?? "");
      setStatus(transaction.status ?? "pending");
      setCategory(transaction.category ?? "");
      setMerchantName(transaction.merchant_name ?? "");
      setPaymentMethod(transaction.payment_method ?? "");
      setTransactionDate(transaction.transaction_date ? new Date(transaction.transaction_date).toISOString().split("T")[0] || "" : "");
      setValueDate(transaction.value_date ? new Date(transaction.value_date).toISOString().split("T")[0] || "" : "");
      setReferenceNumber(transaction.reference_number ?? "");
      setNotes(transaction.notes ?? "");
    } else {
      setAccountId("");
      setType("credit");
      setAmount("");
      setCurrency("USD");
      setDescription("");
      setStatus("pending");
      setCategory("");
      setMerchantName("");
      setPaymentMethod("");
      setTransactionDate(new Date().toISOString().split("T")[0] || "");
      setValueDate("");
      setReferenceNumber("");
      setNotes("");
    }
  }, [transaction, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    
    const params = {
      account_id: accountId,
      type,
      amount: Number(amount),
      currency,
      description: description || null,
      status,
      category: category || null,
      merchant_name: merchantName || null,
      payment_method: paymentMethod || null,
      transaction_date: transactionDate || null,
      value_date: valueDate || null,
      reference_number: referenceNumber || null,
      notes: notes || null,
    };

    try {
      if (isEdit) {
        await onUpdate({
          id: transaction!.id,
          ...params
        });
      } else {
        await onCreate(params);
      }
      onOpenChange(false);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Transaction" : "New Transaction"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <ScrollArea className="max-h-[70vh] px-1">
            <div className="grid gap-6 py-4 mr-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="account_id">Account ID</Label>
                  <Input
                    id="account_id"
                    value={accountId}
                    onChange={(e) => setAccountId(e.target.value)}
                    required
                    placeholder="acc_0001"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="type">Type</Label>
                  <Select value={type} onValueChange={(v) => setType(v as "credit" | "debit")}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="credit">Credit</SelectItem>
                      <SelectItem value="debit">Debit</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="amount">Amount</Label>
                  <Input
                    id="amount"
                    type="number"
                    step="0.01"
                    min="0.01"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    required
                    placeholder="100.00"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="currency">Currency</Label>
                  <Input
                    id="currency"
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value)}
                    maxLength={3}
                    required
                    placeholder="USD"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="status">Status</Label>
                  <Select value={status} onValueChange={(v) => setStatus(v || "pending")}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="failed">Failed</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="category">Category</Label>
                  <Input
                    id="category"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    placeholder="e.g. Shopping"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="merchant">Merchant</Label>
                  <Input
                    id="merchant"
                    value={merchantName}
                    onChange={(e) => setMerchantName(e.target.value)}
                    placeholder="e.g. Amazon"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="transaction_date">Transaction Date</Label>
                  <Input
                    id="transaction_date"
                    type="date"
                    value={transactionDate}
                    onChange={(e) => setTransactionDate(e.target.value)}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="value_date">Value Date</Label>
                  <Input
                    id="value_date"
                    type="date"
                    value={valueDate}
                    onChange={(e) => setValueDate(e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="payment_method">Payment Method</Label>
                  <Input
                    id="payment_method"
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    placeholder="e.g. Credit Card"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="reference">Reference Number</Label>
                  <Input
                    id="reference"
                    value={referenceNumber}
                    onChange={(e) => setReferenceNumber(e.target.value)}
                    placeholder="REF-123456"
                  />
                </div>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="description">Description</Label>
                <Input
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Short description"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Additional notes..."
                  className="min-h-[80px]"
                />
              </div>
            </div>
          </ScrollArea>
          <DialogFooter className="mt-6 pt-4 border-t">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? "Saving..." : isEdit ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
