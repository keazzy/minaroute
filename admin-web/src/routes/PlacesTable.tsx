import { useCallback, useEffect, useMemo, useState } from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import { Copy, ExternalLink, MapPin, MoreHorizontal, Pencil, RefreshCw, Trash2 } from 'lucide-react';

import { supabase } from '@/lib/supabase';
import { DataTable } from '@/components/DataTable';
import { PlaceEditor } from '@/components/PlaceEditor';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export type PlaceRow = {
  id: string;
  name: string;
  category: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  latitude: number | null;
  longitude: number | null;
  rating: number | null;
  rating_count: number | null;
  phone: string | null;
  website: string | null;
  photos: string[] | null;
};

const COLUMNS =
  'id,name,category,address,city,state,latitude,longitude,rating,rating_count,phone,website,photos';
const PAGE = 1000;

export function PlacesTable() {
  const [rows, setRows] = useState<PlaceRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const all: PlaceRow[] = [];
    // PostgREST caps a response at 1000 rows and places is already at ~1,000,
    // so page through rather than silently truncating.
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

  const remove = useCallback(
    async (ids: string[]) => {
      const label = ids.length === 1 ? 'this place' : `${ids.length} places`;
      if (!window.confirm(`Delete ${label}? This cannot be undone.`)) return;
      const { error: err } = await supabase.from('places').delete().in('id', ids);
      if (err) setError(err.message);
      else await load();
    },
    [load],
  );

  const columns = useMemo<ColumnDef<PlaceRow, unknown>[]>(
    () => [
      {
        id: 'select',
        size: 36,
        enableResizing: false,
        enableSorting: false,
        header: ({ table }) => (
          <Checkbox
            checked={
              table.getIsAllPageRowsSelected()
                ? true
                : table.getIsSomePageRowsSelected()
                  ? 'indeterminate'
                  : false
            }
            onCheckedChange={(v) => table.toggleAllPageRowsSelected(Boolean(v))}
            aria-label="Select all on this page"
          />
        ),
        cell: ({ row }) => (
          <Checkbox
            checked={row.getIsSelected()}
            onCheckedChange={(v) => row.toggleSelected(Boolean(v))}
            aria-label={`Select ${row.original.name}`}
          />
        ),
      },
      { accessorKey: 'name', header: 'Name', size: 240 },
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
        size: 240,
        cell: ({ getValue }) => getValue<string | null>() ?? <Missing />,
      },
      {
        accessorKey: 'rating',
        header: 'Rating',
        size: 90,
        cell: ({ row }) => {
          const r = row.original.rating;
          if (r === null) return <Missing />;
          return (
            <span className="inline-flex items-center gap-1">
              <Badge tone="good">{r.toFixed(1)}</Badge>
              {row.original.rating_count ? (
                <span className="text-xs text-muted-foreground">×{row.original.rating_count}</span>
              ) : null}
            </span>
          );
        },
      },
      {
        id: 'coords',
        header: 'Map',
        size: 80,
        // Whether a place can appear on the map is a yes/no question, so answer
        // it as one instead of showing two float columns to read.
        accessorFn: (r) => (r.latitude !== null && r.longitude !== null ? 'yes' : 'missing'),
        cell: ({ getValue }) =>
          getValue<string>() === 'yes' ? (
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
          return n > 0 ? <span>{n}</span> : <Missing />;
        },
      },
      {
        accessorKey: 'phone',
        header: 'Phone',
        size: 140,
        cell: ({ getValue }) => getValue<string | null>() ?? <Missing />,
      },
      {
        id: 'actions',
        size: 44,
        enableResizing: false,
        enableSorting: false,
        header: '',
        cell: ({ row }) => {
          const p = row.original;
          const hasCoords = p.latitude !== null && p.longitude !== null;
          return (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="icon" variant="ghost" className="h-6 w-6">
                  <MoreHorizontal className="h-4 w-4" />
                  <span className="sr-only">Actions for {p.name}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel className="max-w-56 truncate">{p.name}</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setEditingId(p.id)}>
                  <Pencil className="h-3.5 w-3.5" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigator.clipboard.writeText(p.id)}>
                  <Copy className="h-3.5 w-3.5" />
                  Copy ID
                </DropdownMenuItem>
                <DropdownMenuItem
                  disabled={!hasCoords}
                  onClick={() =>
                    window.open(
                      `https://www.google.com/maps/search/?api=1&query=${p.latitude},${p.longitude}`,
                      '_blank',
                      'noopener',
                    )
                  }
                >
                  <MapPin className="h-3.5 w-3.5" />
                  {hasCoords ? 'Open in Maps' : 'No coordinates'}
                </DropdownMenuItem>
                <DropdownMenuItem
                  disabled={!p.website}
                  onClick={() => p.website && window.open(p.website, '_blank', 'noopener')}
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  {p.website ? 'Open website' : 'No website'}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem destructive onClick={() => void remove([p.id])}>
                  <Trash2 className="h-3.5 w-3.5" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          );
        },
      },
    ],
    [remove],
  );

  return (
    <>
    <DataTable
      id="places"
      data={rows}
      columns={columns}
      getRowId={(r) => r.id}
      loading={loading}
      error={error}
      searchPlaceholder="Search name, category, address, city…"
      emptyMessage="No places yet."
      toolbar={
        <Button size="sm" variant="outline" onClick={() => void load()}>
          <RefreshCw className="h-3.5 w-3.5" />
          Refresh
        </Button>
      }
      bulkActions={(ids, clear) => (
        <Button
          size="sm"
          variant="destructive"
          className="h-6 px-2 text-xs"
          onClick={async () => {
            await remove(ids);
            clear();
          }}
        >
          <Trash2 className="h-3 w-3" />
          Delete
        </Button>
      )}
    />
    {editingId ? (
      <PlaceEditor
        placeId={editingId}
        onClose={() => setEditingId(null)}
        onSaved={() => void load()}
      />
    ) : null}
    </>
  );
}

/** Absent data reads as absent rather than blank, so gaps stay scannable. */
function Missing() {
  return <span className="text-muted-foreground/50">—</span>;
}
