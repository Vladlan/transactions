import { useCallback, useMemo, useRef } from "react";
import { AgGridReact } from "ag-grid-react";
import {
  AllCommunityModule,
  type ColDef,
  type CellValueChangedEvent,
  type ICellRendererParams,
  type GridReadyEvent,
  type IDatasource,
  ModuleRegistry,
  InfiniteRowModelModule,
} from "ag-grid-community";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";
import type { Transaction, UpdateParams } from "@/types/transaction";

ModuleRegistry.registerModules([AllCommunityModule, InfiniteRowModelModule]);

interface Props {
  datasource: IDatasource | undefined;
  cacheBlockSize: number;
  totalCount: number | null;
  loading: boolean;
  onUpdate: (params: UpdateParams) => Promise<void>;
  onEdit: (transaction: Transaction) => void;
  onSelectionChanged: (selectedRows: Transaction[]) => void;
  onGridReady: (event: GridReadyEvent) => void;
}

function LoadingOverlay() {
  return (
    <div className="absolute inset-0 z-10 bg-background/80 backdrop-blur-[1px] flex items-center justify-center">
      <div className="flex items-center gap-2 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin" />
        <span className="text-sm font-medium">Loading transactions...</span>
      </div>
    </div>
  );
}

function NoRowsOverlay() {
  return (
    <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/60">
      <div className="text-center text-muted-foreground">
        <p className="text-sm font-medium">No transactions found</p>
        <p className="text-xs mt-1">Try adjusting your filters or create a new transaction.</p>
      </div>
    </div>
  );
}

function TypeBadge(params: ICellRendererParams<Transaction>) {
  if (params.node.rowPinned) return null;
  if (!params.value) return null;
  const val = params.value as string;
  return (
    <Badge variant={val === "credit" ? "default" : "secondary"}>
      {val}
    </Badge>
  );
}

// No per-row actions anymore

export function TransactionsGrid({ datasource, cacheBlockSize, totalCount, loading, onUpdate, onSelectionChanged: onSelectionChangedProp, onGridReady }: Props) {
  const pinnedBottomRowData = useMemo(
    () =>
      totalCount !== null
        ? [{ id: `Total: ${totalCount.toLocaleString()} transaction${totalCount !== 1 ? "s" : ""}` } as unknown as Transaction]
        : [],
    [totalCount],
  );

  const onCellValueChanged = useCallback(
    (event: CellValueChangedEvent<Transaction>) => {
      if (!event.data) return;
      const field = event.colDef.field as keyof Transaction;
      const value = field === "amount" ? Number(event.newValue) : event.newValue;
      onUpdate({ id: event.data.id, [field]: value });
    },
    [onUpdate],
  );

  const onSelectionChanged = useCallback(() => {
    const selectedRows = gridApiRef.current?.getSelectedRows() || [];
    onSelectionChangedProp(selectedRows);
  }, [onSelectionChangedProp]);

  const gridApiRef = useRef<any>(null);

  const columnDefs = useMemo<ColDef<Transaction>[]>(
    () => [
      {
        field: "id",
        headerName: "ID",
        width: 120,
        minWidth: 140,
        checkboxSelection: true,
        headerCheckboxSelection: true,
        type: "rightAligned",
        colSpan: (params) => (params.node?.rowPinned ? 40 : 1),
        cellRenderer: (params: ICellRendererParams<Transaction>) => {
          if (params.node.rowPinned) {
            return <span className="font-medium">{params.value}</span>;
          }
          return params.value != null ? Number(params.value).toLocaleString() : params.value;
        },
        pinned: "left",
        sort: "desc",
      },
      { field: "account_id", headerName: "Account", width: 140, pinned: "left" },
      {
        field: "type",
        headerName: "Type",
        width: 110,
        cellRenderer: TypeBadge,
      },
      {
        field: "amount",
        headerName: "Amount",
        type: "rightAligned",
        width: 120,
        valueFormatter: (p) => {
          if (p.value == null) return "";
          return Number(p.value).toFixed(2);
        },
      },
      { field: "currency", headerName: "Currency", width: 100 },
      { field: "status", headerName: "Status", width: 120 },
      { field: "category", headerName: "Category", width: 140, flex: 1, minWidth: 120 },
      { field: "merchant_name", headerName: "Merchant", width: 180, flex: 1.5, minWidth: 150 },
      { field: "description", headerName: "Description", width: 250, flex: 2, minWidth: 200 },
      {
        field: "transaction_date",
        headerName: "Tx Date",
        width: 120,
        valueFormatter: (p) => (p.value ? new Date(p.value as string).toLocaleDateString() : ""),
      },
      {
        field: "value_date",
        headerName: "Value Date",
        width: 120,
        valueFormatter: (p) => (p.value ? new Date(p.value as string).toLocaleDateString() : ""),
      },
      { field: "payment_method", headerName: "Method", width: 140 },
      { field: "card_last4", headerName: "Card L4", width: 100 },
      { field: "card_network", headerName: "Network", width: 120 },
      {
        field: "balance_after",
        headerName: "Balance",
        type: "rightAligned",
        width: 120,
        valueFormatter: (p) => (p.value ? Number(p.value).toFixed(2) : ""),
      },
      { field: "location_city", headerName: "City", width: 140 },
      { field: "location_country", headerName: "Country", width: 100 },
      {
        field: "original_amount",
        headerName: "Orig Amt",
        type: "rightAligned",
        width: 120,
        valueFormatter: (p) => (p.value ? Number(p.value).toFixed(2) : ""),
      },
      { field: "original_currency", headerName: "Orig Ccy", width: 100 },
      { field: "exchange_rate", headerName: "Ex Rate", width: 120 },
      { field: "fee_amount", headerName: "Fee", type: "rightAligned", width: 100 },
      { field: "tax_amount", headerName: "Tax", type: "rightAligned", width: 100 },
      { field: "is_recurring", headerName: "Recur?", width: 100, cellRenderer: (p: ICellRendererParams<Transaction>) => (p.value ? "✅" : "") },
      { field: "counterparty_name", headerName: "Counterparty", width: 180, flex: 1.5, minWidth: 150 },
      { field: "counterparty_account_number", headerName: "C-Party Acc", width: 160 },
      { field: "counterparty_bank_code", headerName: "C-Party BIC", width: 140 },
      { field: "statement_period", headerName: "Stmt Period", width: 120 },
      { field: "auth_code", headerName: "Auth Code", width: 120 },
      { field: "channel", headerName: "Channel", width: 120 },
      { field: "risk_score", headerName: "Risk", width: 100 },
      { field: "reference_number", headerName: "Ref #", width: 180 },
      { field: "merchant_category_code", headerName: "MCC", width: 80 },
      { field: "notes", headerName: "Notes", width: 200, flex: 1.5, minWidth: 150 },
      {
        field: "created_at",
        headerName: "Created",
        width: 180,
        valueFormatter: (p) => (p.value ? new Date(p.value as string).toLocaleString() : ""),
      },
      {
        field: "updated_at",
        headerName: "Updated",
        width: 180,
        valueFormatter: (p) => (p.value ? new Date(p.value as string).toLocaleString() : ""),
      },
    ],
    [],
  );

  const defaultColDef = useMemo<ColDef>(
    () => ({
      sortable: true,
      resizable: true,
      enableCellChangeFlash: true,
      cellClassRules: {
        "ag-cell-skeleton": (params) => !params.node.rowPinned && params.data == null,
      },
    }),
    [],
  );

  return (
    <div className="ag-theme-alpine w-full" style={{ height: "calc(100vh - 17.5rem)", minHeight: "18.75rem" }}>
      <AgGridReact<Transaction>
        rowModelType="infinite"
        datasource={datasource}
        columnDefs={columnDefs}
        defaultColDef={defaultColDef}
        onCellValueChanged={onCellValueChanged}
        onSelectionChanged={onSelectionChanged}
        onGridReady={(params) => {
          gridApiRef.current = params.api;
          onGridReady(params);
        }}
        rowSelection="multiple"
        pinnedBottomRowData={pinnedBottomRowData}
        cacheBlockSize={cacheBlockSize}
        cacheOverflowSize={2}
        maxConcurrentDatasourceRequests={1}
        infiniteInitialRowCount={1}
        maxBlocksInCache={10}
        getRowId={(params) => (params.data?.id != null ? String(params.data.id) : "")}
        loading={loading}
        loadingOverlayComponent={LoadingOverlay}
        noRowsOverlayComponent={NoRowsOverlay}
      />
    </div>
  );
}
