import { useCallback, useMemo } from "react";
import { AgGridReact } from "ag-grid-react";
import {
  AllCommunityModule,
  type ColDef,
  type CellValueChangedEvent,
  type ICellRendererParams,
  ModuleRegistry,
} from "ag-grid-community";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Trash2, Pencil } from "lucide-react";
import type { Transaction, UpdateParams } from "@/types/transaction";

ModuleRegistry.registerModules([AllCommunityModule]);

interface Props {
  transactions: Transaction[];
  loading: boolean;
  onUpdate: (params: UpdateParams) => Promise<void>;
  onDelete: (id: number) => Promise<void>;
  onEdit: (transaction: Transaction) => void;
}

function TypeBadge(params: ICellRendererParams<Transaction>) {
  const val = params.value as string;
  return (
    <Badge variant={val === "credit" ? "default" : "secondary"}>
      {val}
    </Badge>
  );
}

function ActionsCellRenderer(
  params: ICellRendererParams<Transaction> & {
    onDelete: (id: number) => void;
    onEdit: (tx: Transaction) => void;
  },
) {
  const tx = params.data;
  if (!tx) return null;
  return (
    <div className="flex items-center gap-1 h-full">
      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => params.onEdit(tx)}>
        <Pencil className="h-3.5 w-3.5" />
      </Button>
      <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => params.onDelete(tx.id)}>
        <Trash2 className="h-3.5 w-3.5" />
      </Button>
    </div>
  );
}

export function TransactionsGrid({ transactions, loading, onUpdate, onDelete, onEdit }: Props) {
  const onCellValueChanged = useCallback(
    (event: CellValueChangedEvent<Transaction>) => {
      if (!event.data) return;
      const field = event.colDef.field as keyof Transaction;
      const value = field === "amount" ? Number(event.newValue) : event.newValue;
      onUpdate({ id: event.data.id, [field]: value });
    },
    [onUpdate],
  );

  const columnDefs = useMemo<ColDef<Transaction>[]>(
    () => [
      { field: "id", headerName: "ID", width: 80, filter: "agNumberColumnFilter" },
      { field: "account_id", headerName: "Account", editable: true, filter: "agTextColumnFilter", width: 140 },
      {
        field: "type",
        headerName: "Type",
        width: 110,
        cellRenderer: TypeBadge,
        filter: "agTextColumnFilter",
      },
      {
        field: "amount",
        headerName: "Amount",
        editable: true,
        width: 120,
        filter: "agNumberColumnFilter",
        valueFormatter: (p) => {
          if (p.value == null) return "";
          return Number(p.value).toFixed(2);
        },
      },
      { field: "currency", headerName: "Currency", editable: true, width: 100, filter: "agTextColumnFilter" },
      { field: "description", headerName: "Description", editable: true, flex: 1, filter: "agTextColumnFilter" },
      {
        field: "created_at",
        headerName: "Created",
        width: 180,
        valueFormatter: (p) => (p.value ? new Date(p.value as string).toLocaleString() : ""),
        filter: "agDateColumnFilter",
      },
      {
        headerName: "",
        width: 90,
        cellRenderer: ActionsCellRenderer,
        cellRendererParams: { onDelete, onEdit },
        sortable: false,
        filter: false,
      },
    ],
    [onDelete, onEdit],
  );

  const defaultColDef = useMemo<ColDef>(
    () => ({
      sortable: true,
      resizable: true,
    }),
    [],
  );

  return (
    <div className="ag-theme-alpine w-full" style={{ height: 600 }}>
      <AgGridReact<Transaction>
        rowData={transactions}
        columnDefs={columnDefs}
        defaultColDef={defaultColDef}
        onCellValueChanged={onCellValueChanged}
        loading={loading}
        pagination
        paginationPageSize={20}
        paginationPageSizeSelector={[20, 50, 100]}
        getRowId={(params) => String(params.data.id)}
      />
    </div>
  );
}
