import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type SortingState,
} from '@tanstack/react-table';
import { ArrowDown, ArrowUp, ChevronsUpDown, Loader2 } from 'lucide-react';

import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

/**
 * The places table.
 *
 * Two decisions that drive everything else:
 *
 * 1. **All rows are fetched once, then filtered and sorted in the browser.**
 *    ~1,000 rows is nothing for the client, and it makes search feel instant —
 *    which is the actual complaint about the current admin. Server-side paging
 *    would be correct at 100k rows and worse at this size, because every
 *    keystroke would be a round trip.
 *
 * 2. **Selection is range-aware.** Shift-clicking a checkbox selects the span
 *    since the last click, which is what makes bulk edits practical: fixing a
 *    category across 50 places should be two clicks, not fifty.
 */

type PlaceRow = {
  id: string;
  name: string;
  category: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  latitude: number | null;
  longitude: number | null;
  rating: number | null;
  phone: string | null;
  website: string | null;
  photos: string[] | null;
};

const COLUMNS =
  'id,name,category,address,city,state,latitude,longitude,rating,phone,website,photos';
const PAGE = 1000;

export function PlacesTable() {
  const [rows, setRows] = useState<PlaceRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [globalFilter, setGlobalFilter] = useState('');
  const [sorting, setSorting] = useState<SortingState>([{ id: 'name', desc: false }]);
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const lastClicked = useRef<number | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const all: PlaceRow[] = [];
    // Same pagination shape as the mobile app's fetchPlaceRows — PostgREST caps
    // a response at 1000, and this table is already at ~1,000 rows.
    for (let page = 0; page < 20; page += 1) {
      const from = page * PAGE;
      const { data, error: err } = await supabase
        .from('places')
        .select(COLUMNS)
        .order('name')
        .range(from, from + PAGE - 1);
      if (err) {
        setError(err.message);
        setLoading(false);
        return;
      }
      const batch = (data ?? []) as unknown as PlaceRow[];
      all.push(...batch);
      if (batch.length < PAGE) break;
    }
    setRows(all);
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const columns = useMemo<ColumnDef<PlaceRow>[]>(
    () => [
      {
        id: 'select',
        size: 36,
        header: ({ table }) => (
          <Checkbox
            checked={
              table.getIsAllRowsSelected()
                ? true
                : table.getIsSomeRowsSelected()
                  ? 'indeterminate'
                  : false
            }
            onCheckedChange={(v) => table.toggleAllRowsSelected(Boolean(v))}
            aria-label="Select all"
          />
        ),
        cell: ({ row, table }) => (
          <Checkbox
            checked={row.getIsSelected()}
            aria-label={`Select ${row.original.name}`}
            onClick={(e) => {
              // Shift-click extends from the previous click. Without this,
              // selecting 50 rows means 50 clicks.
              const idx = row.index;
              if (e.shiftKey && lastClicked.current !== null) {
                e.preventDefault();
                const [a, b] = [lastClicked.current, idx].sort((x, y) => x - y);
                const span = table.getRowModel().rows.slice(a, b + 1);
                const next = { ...table.getState().rowSelection };
                for (const r of span) next[r.id] = true;
                table.setRowSelection(next);
                return;
              }
              lastClicked.current = idx;
            }}
            onCheckedChange={(v) => row.toggleSelected(Boolean(v))}
          />
        ),
        enableSorting: false,
      },
      { accessorKey: 'name', header: 'Name', size: 260 },
      {
        accessorKey: 'category',
        header: 'Category',
        size: 130,
        cell: ({ getValue }) => {
          const v = getValue<string | null>();
          return v ? <Badge>{v}</Badge> : <Missing />;
        },
      },
      {
        accessorKey: 'city',
        header: 'City',
        size: 110,
        cell: ({ getValue }) => getValue<string | null>() ?? <Missing />,
      },
      {
        accessorKey: 'address',
        header: 'Address',
        size: 260,
        cell: ({ getValue }) => getValue<string | null>() ?? <Missing />,
      },
      {
        accessorKey: 'rating',
        header: 'Rating',
        size: 80,
        cell: ({ getValue }) => {
          const v = getValue<number | null>();
          return v === null ? <Missing /> : <Badge tone="good">{v.toFixed(1)}</Badge>;
        },
      },
      {
        id: 'coords',
        header: 'Coords',
        size: 90,
        // Whether a place can appear on the map at all is a yes/no question, so
        // show it as one rather than making someone read two float columns.
        accessorFn: (r) => (r.latitude !== null && r.longitude !== null ? 1 : 0),
        cell: ({ row }) =>
          row.original.latitude !== null && row.original.longitude !== null ? (
            <Badge tone="good">yes</Badge>
          ) : (
            <Badge tone="warn">missing</Badge>
          ),
      },
      {
        id: 'photos',
        header: 'Photos',
        size: 80,
        accessorFn: (r) => r.photos?.length ?? 0,
        cell: ({ getValue }) => {
          const n = getValue<number>();
          return n > 0 ? <span className="text-muted-foreground">{n}</span> : <Missing />;
        },
      },
      {
        accessorKey: 'phone',
        header: 'Phone',
        size: 140,
        cell: ({ getValue }) => getValue<string | null>() ?? <Missing />,
      },
    ],
    [],
  );

  const table = useReactTable({
    data: rows,
    columns,
    state: { sorting, globalFilter, rowSelection: selected },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    onRowSelectionChange: setSelected,
    getRowId: (r) => r.id,
    enableRowSelection: true,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    globalFilterFn: 'includesString',
  });

  const visible = table.getRowModel().rows;
  const selectedCount = Object.values(selected).filter(Boolean).length;

  return (
    <div className="flex h-full flex-col">
      <div className="flex shrink-0 items-center gap-2 border-b px-3 py-2">
        <Input
          placeholder="Search name, category, address, city…"
          value={globalFilter}
          onChange={(e) => setGlobalFilter(e.target.value)}
          className="max-w-sm"
        />
        <span className="text-xs text-muted-foreground">
          {loading ? 'Loading…' : `${visible.length} of ${rows.length}`}
        </span>
        {selectedCount > 0 ? (
          <span className="text-xs font-medium">{selectedCount} selected</span>
        ) : null}
        <Button size="sm" variant="outline" className="ml-auto" onClick={() => void load()}>
          {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
          Refresh
        </Button>
      </div>

      {error ? (
        <div className="border-b bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</div>
      ) : null}

      <div className="min-h-0 flex-1 overflow-auto">
        <table className="w-full border-collapse text-sm">
          <thead className="sticky top-0 z-10 bg-background shadow-[0_1px_0_var(--color-border)]">
            {table.getHeaderGroups().map((hg) => (
              <tr key={hg.id}>
                {hg.headers.map((h) => {
                  const sorted = h.column.getIsSorted();
                  return (
                    <th
                      key={h.id}
                      style={{ width: h.getSize() }}
                      className="px-2 py-1.5 text-left font-medium text-muted-foreground"
                    >
                      {h.isPlaceholder ? null : h.column.getCanSort() ? (
                        <button
                          className="inline-flex items-center gap-1 hover:text-foreground"
                          onClick={h.column.getToggleSortingHandler()}
                        >
                          {flexRender(h.column.columnDef.header, h.getContext())}
                          {sorted === 'asc' ? (
                            <ArrowUp className="h-3 w-3" />
                          ) : sorted === 'desc' ? (
                            <ArrowDown className="h-3 w-3" />
                          ) : (
                            <ChevronsUpDown className="h-3 w-3 opacity-40" />
                          )}
                        </button>
                      ) : (
                        flexRender(h.column.columnDef.header, h.getContext())
                      )}
                    </th>
                  );
                })}
              </tr>
            ))}
          </thead>
          <tbody>
            {visible.map((row) => (
              <tr
                key={row.id}
                className={cn(
                  'border-b hover:bg-accent/60',
                  row.getIsSelected() && 'bg-accent',
                )}
              >
                {row.getVisibleCells().map((cell) => (
                  <td key={cell.id} className="truncate px-2 py-1">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
            {!loading && visible.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-3 py-8 text-center text-muted-foreground">
                  Nothing matches “{globalFilter}”.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/** Absent data reads as absent rather than blank, so gaps are scannable. */
function Missing() {
  return <span className="text-muted-foreground/50">—</span>;
}
