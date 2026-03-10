import { useCallback, useMemo } from "react";
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
import { Button } from "@/components/ui/button";
import { Trash2, Pencil } from "lucide-react";
import type { Transaction, UpdateParams } from "@/types/transaction";

ModuleRegistry.registerModules([AllCommunityModule, InfiniteRowModelModule]);

interface Props {
  datasource: IDatasource | undefined;
  cacheBlockSize: number;
  onUpdate: (params: UpdateParams) => Promise<void>;
  onDelete: (id: number) => Promise<void>;
  onEdit: (transaction: Transaction) => void;
  onGridReady: (event: GridReadyEvent) => void;
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

export function TransactionsGrid({ datasource, cacheBlockSize, onUpdate, onDelete, onEdit, onGridReady }: Props) {
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
      { field: "id", headerName: "ID", width: 80 },
      { field: "account_id", headerName: "Account", editable: true, width: 140 },
      {
        field: "type",
        headerName: "Type",
        width: 110,
        cellRenderer: TypeBadge,
      },
      {
        field: "amount",
        headerName: "Amount",
        editable: true,
        width: 120,
        valueFormatter: (p) => {
          if (p.value == null) return "";
          return Number(p.value).toFixed(2);
        },
      },
      { field: "currency", headerName: "Currency", editable: true, width: 100 },
      { field: "description", headerName: "Description", editable: true, flex: 1 },
      {
        field: "created_at",
        headerName: "Created",
        width: 180,
        valueFormatter: (p) => (p.value ? new Date(p.value as string).toLocaleString() : ""),
      },
      {
        headerName: "",
        width: 90,
        cellRenderer: ActionsCellRenderer,
        cellRendererParams: { onDelete, onEdit },
        sortable: false,
      },
    ],
    [onDelete, onEdit],
  );

  const defaultColDef = useMemo<ColDef>(
    () => ({
      sortable: false,
      resizable: true,
    }),
    [],
  );

  return (
    <div className="ag-theme-alpine w-full" style={{ height: 600 }}>
      <AgGridReact<Transaction>
        rowModelType="infinite"
        datasource={datasource}
        columnDefs={columnDefs}
        defaultColDef={defaultColDef}
        onCellValueChanged={onCellValueChanged}
        onGridReady={onGridReady}
        cacheBlockSize={cacheBlockSize}
        cacheOverflowSize={2}
        maxConcurrentDatasourceRequests={1}
        infiniteInitialRowCount={1}
        maxBlocksInCache={10}
        getRowId={(params) => String(params.data.id)}
      />
    </div>
  );
}
