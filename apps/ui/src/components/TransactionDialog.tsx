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
      "flex min-h-20 w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm transition-colors outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm dark:bg-input/30",
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
  selectedTransactions?: Transaction[];
  onCreate: (params: CreateParams) => Promise<void>;
  onUpdate: (params: UpdateParams) => Promise<void>;
}

export function TransactionDialog({ open, onOpenChange, transaction, selectedTransactions = [], onCreate, onUpdate }: Props) {
  const isBulk = selectedTransactions.length > 1;
  const isEdit = !!transaction || isBulk;
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

  // For bulk edit - track which fields are being updated
  const [updatedFields, setUpdatedFields] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!open) return;
    
    setUpdatedFields(new Set());
    
    if (isBulk) {
      setAccountId("");
      setType("credit");
      setAmount("");
      setCurrency("USD");
      setDescription("");
      setStatus("pending");
      setCategory("");
      setMerchantName("");
      setPaymentMethod("");
      setTransactionDate("");
      setValueDate("");
      setReferenceNumber("");
      setNotes("");
    } else if (transaction) {
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
  }, [transaction, open, isBulk]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    
    try {
      if (isBulk) {
        // Only include fields that were touched
        const baseParams: Partial<UpdateParams> = {};
        if (updatedFields.has("account_id")) baseParams.account_id = accountId;
        if (updatedFields.has("type")) baseParams.type = type;
        if (updatedFields.has("amount")) baseParams.amount = Number(amount);
        if (updatedFields.has("currency")) baseParams.currency = currency;
        if (updatedFields.has("status")) baseParams.status = status;
        if (updatedFields.has("category")) baseParams.category = category || null;
        if (updatedFields.has("merchant_name")) baseParams.merchant_name = merchantName || null;
        if (updatedFields.has("payment_method")) baseParams.payment_method = paymentMethod || null;
        if (updatedFields.has("transaction_date")) baseParams.transaction_date = transactionDate || null;
        if (updatedFields.has("value_date")) baseParams.value_date = valueDate || null;
        if (updatedFields.has("reference_number")) baseParams.reference_number = referenceNumber || null;
        if (updatedFields.has("description")) baseParams.description = description || null;
        if (updatedFields.has("notes")) baseParams.notes = notes || null;

        // Note: Currently we loop because there's no bulk update backend endpoint
        for (const tx of selectedTransactions) {
          await onUpdate({
            ...baseParams,
            id: tx.id,
          });
        }
      } else if (isEdit) {
        await onUpdate({
          id: transaction!.id,
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
        });
      } else {
        await onCreate({
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
        });
      }
      onOpenChange(false);
    } finally {
      setSubmitting(false);
    }
  };

  const handleFieldChange = (field: string, setter: (val: any) => void, val: any) => {
    setter(val);
    if (isBulk) {
      setUpdatedFields((prev) => new Set(prev).add(field));
    }
  };

  const renderLabel = (id: string, label: string) => (
    <div className="flex items-center gap-2">
      <Label htmlFor={id} className={cn(isBulk && !updatedFields.has(id) && "text-muted-foreground opacity-70")}>
        {label}
      </Label>
      {isBulk && updatedFields.has(id) && (
        <span className="text-[10px] bg-blue-500/10 text-blue-500 px-1.5 py-0.5 rounded-full font-medium">Changed</span>
      )}
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {isBulk ? `Edit ${selectedTransactions.length} Transactions` : isEdit ? "Edit Transaction" : "New Transaction"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <ScrollArea className="max-h-[70vh] px-1">
            <div className="grid gap-6 py-4 mr-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="grid gap-2">
                  {renderLabel("account_id", "Account ID")}
                  <Input
                    id="account_id"
                    value={accountId}
                    onChange={(e) => handleFieldChange("account_id", setAccountId, e.target.value)}
                    required={!isBulk}
                    placeholder="acc_0001"
                  />
                </div>
                <div className="grid gap-2">
                  {renderLabel("type", "Type")}
                  <Select value={type} onValueChange={(v) => handleFieldChange("type", setType, v as "credit" | "debit")}>
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

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="grid gap-2">
                  {renderLabel("amount", "Amount")}
                  <Input
                    id="amount"
                    type="number"
                    step="0.01"
                    min="0.01"
                    value={amount}
                    onChange={(e) => handleFieldChange("amount", setAmount, e.target.value)}
                    required={!isBulk}
                    placeholder="100.00"
                  />
                </div>
                <div className="grid gap-2">
                  {renderLabel("currency", "Currency")}
                  <Input
                    id="currency"
                    value={currency}
                    onChange={(e) => handleFieldChange("currency", setCurrency, e.target.value)}
                    maxLength={3}
                    required={!isBulk}
                    placeholder="USD"
                  />
                </div>
                <div className="grid gap-2">
                  {renderLabel("status", "Status")}
                  <Select value={status} onValueChange={(v) => handleFieldChange("status", setStatus, v || "pending")}>
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

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="grid gap-2">
                  {renderLabel("category", "Category")}
                  <Input
                    id="category"
                    value={category}
                    onChange={(e) => handleFieldChange("category", setCategory, e.target.value)}
                    placeholder="e.g. Shopping"
                  />
                </div>
                <div className="grid gap-2">
                  {renderLabel("merchant_name", "Merchant")}
                  <Input
                    id="merchant"
                    value={merchantName}
                    onChange={(e) => handleFieldChange("merchant_name", setMerchantName, e.target.value)}
                    placeholder="e.g. Amazon"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="grid gap-2">
                  {renderLabel("transaction_date", "Transaction Date")}
                  <Input
                    id="transaction_date"
                    type="date"
                    value={transactionDate}
                    onChange={(e) => handleFieldChange("transaction_date", setTransactionDate, e.target.value)}
                  />
                </div>
                <div className="grid gap-2">
                  {renderLabel("value_date", "Value Date")}
                  <Input
                    id="value_date"
                    type="date"
                    value={valueDate}
                    onChange={(e) => handleFieldChange("value_date", setValueDate, e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="grid gap-2">
                  {renderLabel("payment_method", "Payment Method")}
                  <Input
                    id="payment_method"
                    value={paymentMethod}
                    onChange={(e) => handleFieldChange("payment_method", setPaymentMethod, e.target.value)}
                    placeholder="e.g. Credit Card"
                  />
                </div>
                <div className="grid gap-2">
                  {renderLabel("reference_number", "Reference Number")}
                  <Input
                    id="reference"
                    value={referenceNumber}
                    onChange={(e) => handleFieldChange("reference_number", setReferenceNumber, e.target.value)}
                    placeholder="REF-123456"
                  />
                </div>
              </div>

              <div className="grid gap-2">
                {renderLabel("description", "Description")}
                <Input
                  id="description"
                  value={description}
                  onChange={(e) => handleFieldChange("description", setDescription, e.target.value)}
                  placeholder="Short description"
                />
              </div>

              <div className="grid gap-2">
                {renderLabel("notes", "Notes")}
                <Textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => handleFieldChange("notes", setNotes, e.target.value)}
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
