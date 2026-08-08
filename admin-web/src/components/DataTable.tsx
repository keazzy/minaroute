import { useState, type ReactNode } from 'react';
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type RowSelectionState,
  type SortingState,
} from '@tanstack/react-table';
import {
  ArrowDown,
  ArrowUp,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  ChevronsUpDown,
  Loader2,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

/**
 * The table every admin screen uses.
 *
 * Written once because places, events, suggestions and users all want the same
 * behaviour, and the previous admin re-implemented a worse version per screen.
 *
 * Three things it does that the React Native version could not:
 *
 *  - **Resizable columns.** Address needs width and rating does not, and only
 *    the person looking at the data knows which. Widths persist to
 *    localStorage per table id, so the layout you set is the layout you get
 *    back tomorrow.
 *  - **Pagination.** Rendering 1,000 <tr> is fine until each has a menu and a
 *    checkbox; paging keeps interaction snappy while search still runs across
 *    the *whole* dataset, not just the visible page.
 *  - **A sticky header that actually sticks**, because it is a real <thead>.
 */

export type DataTableProps<T> = {
  /** Stable id — column widths are persisted under it. */
  id: string;
  data: T[];
  columns: ColumnDef<T, unknown>[];
  getRowId: (row: T) => string;
  loading?: boolean;
  error?: string | null;
  searchPlaceholder?: string;
  /** Rendered in the toolbar when rows are selected. */
  bulkActions?: (selectedIds: string[], clear: () => void) => ReactNode;
  toolbar?: ReactNode;
  emptyMessage?: string;
};

const PAGE_SIZES = [25, 50, 100, 250];

function loadWidths(id: string): Record<string, number> {
  try {
    return JSON.parse(localStorage.getItem(`cols:${id}`) ?? '{}');
  } catch {
    return {};
  }
}

export function DataTable<T>({
  id,
  data,
  columns,
  getRowId,
  loading,
  error,
  searchPlaceholder = 'Search…',
  bulkActions,
  toolbar,
  emptyMessage = 'Nothing here.',
}: DataTableProps<T>) {
  const [globalFilter, setGlobalFilter] = useState('');
  const [sorting, setSorting] = useState<SortingState>([]);
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [columnSizing, setColumnSizing] = useState<Record<string, number>>(() => loadWidths(id));

  const table = useReactTable({
    data,
    columns,
    state: { sorting, globalFilter, rowSelection, columnSizing },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    onRowSelectionChange: setRowSelection,
    onColumnSizingChange: (updater) => {
      const next = typeof updater === 'function' ? updater(columnSizing) : updater;
      setColumnSizing(next);
      try {
        localStorage.setItem(`cols:${id}`, JSON.stringify(next));
      } catch {
        /* private browsing — widths just won't persist */
      }
    },
    getRowId: (row) => getRowId(row),
    enableRowSelection: true,
    columnResizeMode: 'onChange',
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize: 50 } },
    globalFilterFn: 'includesString',
  });

  const selectedIds = Object.entries(rowSelection)
    .filter(([, v]) => v)
    .map(([k]) => k);
  const clearSelection = () => setRowSelection({});

  const pageIndex = table.getState().pagination.pageIndex;
  const pageCount = table.getPageCount();
  const filteredCount = table.getFilteredRowModel().rows.length;

  return (
    <div className="flex h-full flex-col">
      {/* Toolbar */}
      <div className="flex shrink-0 flex-wrap items-center gap-2 border-b px-3 py-2">
        <Input
          placeholder={searchPlaceholder}
          value={globalFilter}
          onChange={(e) => setGlobalFilter(e.target.value)}
          className="h-8 max-w-xs"
        />
        <span className="text-xs whitespace-nowrap text-muted-foreground">
          {loading ? (
            <span className="inline-flex items-center gap-1">
              <Loader2 className="h-3 w-3 animate-spin" /> Loading…
            </span>
          ) : globalFilter ? (
            `${filteredCount} of ${data.length}`
          ) : (
            `${data.length} rows`
          )}
        </span>

        {selectedIds.length > 0 ? (
          <div className="flex items-center gap-2 rounded-md border bg-accent px-2 py-1">
            <span className="text-xs font-medium">{selectedIds.length} selected</span>
            {bulkActions?.(selectedIds, clearSelection)}
            <Button size="sm" variant="ghost" className="h-6 px-2 text-xs" onClick={clearSelection}>
              Clear
            </Button>
          </div>
        ) : null}

        <div className="ml-auto flex items-center gap-2">{toolbar}</div>
      </div>

      {error ? (
        <div className="shrink-0 border-b bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </div>
      ) : null}

      {/* Rows */}
      <div className="min-h-0 flex-1 overflow-auto">
        <table
          className="border-collapse text-sm"
          style={{ width: table.getCenterTotalSize(), minWidth: '100%' }}
        >
          <thead className="sticky top-0 z-10 bg-background shadow-[0_1px_0_var(--color-border)]">
            {table.getHeaderGroups().map((hg) => (
              <tr key={hg.id}>
                {hg.headers.map((h) => {
                  const sorted = h.column.getIsSorted();
                  return (
                    <th
                      key={h.id}
                      style={{ width: h.getSize() }}
                      className="group relative px-2 py-1.5 text-left font-medium text-muted-foreground"
                    >
                      {h.isPlaceholder ? null : h.column.getCanSort() ? (
                        <button
                          className="inline-flex max-w-full items-center gap-1 truncate hover:text-foreground"
                          onClick={h.column.getToggleSortingHandler()}
                        >
                          <span className="truncate">
                            {flexRender(h.column.columnDef.header, h.getContext())}
                          </span>
                          {sorted === 'asc' ? (
                            <ArrowUp className="h-3 w-3 shrink-0" />
                          ) : sorted === 'desc' ? (
                            <ArrowDown className="h-3 w-3 shrink-0" />
                          ) : (
                            <ChevronsUpDown className="h-3 w-3 shrink-0 opacity-30" />
                          )}
                        </button>
                      ) : (
                        flexRender(h.column.columnDef.header, h.getContext())
                      )}

                      {h.column.getCanResize() ? (
                        // Wide invisible grab area over a thin visible line —
                        // a 1px target is unhittable.
                        <span
                          onMouseDown={h.getResizeHandler()}
                          onTouchStart={h.getResizeHandler()}
                          className={cn(
                            'absolute top-0 right-0 h-full w-2 cursor-col-resize touch-none select-none',
                            'after:absolute after:top-1 after:bottom-1 after:right-1 after:w-px after:bg-border',
                            'hover:after:bg-primary',
                            h.column.getIsResizing() && 'after:bg-primary',
                          )}
                        />
                      ) : null}
                    </th>
                  );
                })}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.map((row) => (
              <tr
                key={row.id}
                className={cn('border-b hover:bg-accent/50', row.getIsSelected() && 'bg-accent')}
              >
                {row.getVisibleCells().map((cell) => (
                  <td
                    key={cell.id}
                    style={{ width: cell.column.getSize() }}
                    className="truncate px-2 py-1"
                  >
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
            {!loading && table.getRowModel().rows.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-3 py-10 text-center text-muted-foreground">
                  {globalFilter ? `Nothing matches “${globalFilter}”.` : emptyMessage}
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex shrink-0 items-center gap-2 border-t px-3 py-1.5 text-xs">
        <span className="text-muted-foreground">Rows</span>
        <select
          value={table.getState().pagination.pageSize}
          onChange={(e) => table.setPageSize(Number(e.target.value))}
          className="h-7 rounded-md border border-input bg-background px-1.5"
        >
          {PAGE_SIZES.map((n) => (
            <option key={n} value={n}>
              {n}
            </option>
          ))}
        </select>
        <span className="ml-auto text-muted-foreground">
          Page {pageCount === 0 ? 0 : pageIndex + 1} of {pageCount}
        </span>
        <Button
          size="icon"
          variant="ghost"
          className="h-7 w-7"
          onClick={() => table.setPageIndex(0)}
          disabled={!table.getCanPreviousPage()}
        >
          <ChevronsLeft className="h-3.5 w-3.5" />
        </Button>
        <Button
          size="icon"
          variant="ghost"
          className="h-7 w-7"
          onClick={() => table.previousPage()}
          disabled={!table.getCanPreviousPage()}
        >
          <ChevronLeft className="h-3.5 w-3.5" />
        </Button>
        <Button
          size="icon"
          variant="ghost"
          className="h-7 w-7"
          onClick={() => table.nextPage()}
          disabled={!table.getCanNextPage()}
        >
          <ChevronRight className="h-3.5 w-3.5" />
        </Button>
        <Button
          size="icon"
          variant="ghost"
          className="h-7 w-7"
          onClick={() => table.setPageIndex(pageCount - 1)}
          disabled={!table.getCanNextPage()}
        >
          <ChevronsRight className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}
