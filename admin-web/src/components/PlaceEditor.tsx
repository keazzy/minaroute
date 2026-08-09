import { useEffect, useMemo, useState } from 'react';
import { Loader2, X } from 'lucide-react';

import {
  attributeFieldsFor,
  validateAttributes,
  type AttributeField,
} from '@shared/attributes';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';
import type { PlaceRow } from '@/routes/PlacesTable';

/**
 * Place editor.
 *
 * A side panel rather than a modal: you edit a row while still seeing the table
 * it came from, which matters when the reason you opened it was something you
 * noticed in a neighbouring row.
 *
 * The attributes section is generated from `attributeFieldsFor(category)` — the
 * same vocabulary the app reads to decide what a mosque's detail page shows. So
 * changing the category here changes which fields appear, and the admin can
 * never offer a field the app will not render.
 */

/** Everything the detail page reads, in the order the page presents it. */
export type EditablePlace = PlaceRow & {
  description?: string | null;
  opening_hours?: string | null;
  whatsapp?: string | null;
  email?: string | null;
  instagram?: string | null;
  facebook?: string | null;
  x_handle?: string | null;
  attributes?: Record<string, unknown> | null;
};

const EDIT_COLUMNS =
  'id,name,category,description,address,city,state,latitude,longitude,rating,rating_count,' +
  'opening_hours,phone,whatsapp,email,website,instagram,facebook,x_handle,photos,attributes';

export function PlaceEditor({
  placeId,
  onClose,
  onSaved,
}: {
  placeId: string;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [row, setRow] = useState<EditablePlace | null>(null);
  const [attrs, setAttrs] = useState<Record<string, unknown>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    supabase
      .from('places')
      .select(EDIT_COLUMNS)
      .eq('id', placeId)
      .single()
      .then(({ data, error: err }) => {
        if (cancelled) return;
        if (err) setError(err.message);
        else {
          const r = data as unknown as EditablePlace;
          setRow(r);
          setAttrs((r.attributes as Record<string, unknown>) ?? {});
        }
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [placeId]);

  const fields = useMemo(() => attributeFieldsFor(row?.category ?? null), [row?.category]);

  const set = <K extends keyof EditablePlace>(k: K, v: EditablePlace[K]) =>
    setRow((r) => (r ? { ...r, [k]: v } : r));

  const setAttr = (k: string, v: unknown) =>
    setAttrs((a) => {
      const next = { ...a };
      // Undefined/empty removes the key entirely rather than storing a null —
      // absent and false mean the same thing to the renderer, and a jsonb full
      // of nulls is just noise.
      if (v === undefined || v === '' || v === false || (Array.isArray(v) && v.length === 0)) {
        delete next[k];
      } else {
        next[k] = v;
      }
      return next;
    });

  async function save() {
    if (!row) return;
    setSaving(true);
    setError(null);

    // Validate against the category's zod schema before writing, so bad data is
    // refused where it was typed rather than failing to render weeks later.
    const check = validateAttributes(row.category, attrs);
    if (!check.ok) {
      setError(`Attributes: ${check.errors.join('; ')}`);
      setSaving(false);
      return;
    }

    const patch = {
      name: row.name,
      category: row.category,
      description: emptyToNull(row.description),
      address: emptyToNull(row.address),
      city: emptyToNull(row.city),
      state: emptyToNull(row.state),
      latitude: row.latitude,
      longitude: row.longitude,
      rating: row.rating,
      rating_count: row.rating_count,
      opening_hours: emptyToNull(row.opening_hours),
      phone: emptyToNull(row.phone),
      whatsapp: emptyToNull(row.whatsapp),
      email: emptyToNull(row.email),
      website: emptyToNull(row.website),
      instagram: emptyToNull(row.instagram),
      facebook: emptyToNull(row.facebook),
      x_handle: emptyToNull(row.x_handle),
      attributes: check.value,
    };

    const { error: err } = await supabase.from('places').update(patch).eq('id', row.id);
    setSaving(false);
    if (err) setError(err.message);
    else {
      onSaved();
      onClose();
    }
  }

  return (
    <div className="fixed inset-0 z-40 flex justify-end">
      <div className="flex-1 bg-black/40" onClick={onClose} aria-hidden />
      <aside className="flex h-full w-[32rem] max-w-full flex-col border-l bg-background shadow-xl">
        <header className="flex shrink-0 items-center gap-2 border-b px-4 py-3">
          <h2 className="truncate text-sm font-semibold">{row?.name ?? 'Loading…'}</h2>
          <Button size="icon" variant="ghost" className="ml-auto h-7 w-7" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </header>

        {error ? (
          <div className="shrink-0 border-b bg-destructive/10 px-4 py-2 text-sm text-destructive">
            {error}
          </div>
        ) : null}

        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-3">
          {loading || !row ? (
            <div className="flex items-center gap-2 py-8 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> Loading…
            </div>
          ) : (
            <div className="space-y-5">
              <Section title="Identity">
                <Field label="Name">
                  <Input value={row.name ?? ''} onChange={(e) => set('name', e.target.value)} />
                </Field>
                <Field label="Category" hint="Decides which attributes appear below.">
                  <Input
                    value={row.category ?? ''}
                    onChange={(e) => set('category', e.target.value)}
                  />
                </Field>
                <Field label="Description">
                  <textarea
                    rows={4}
                    value={row.description ?? ''}
                    onChange={(e) => set('description', e.target.value)}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-[var(--color-ring)] focus-visible:outline-none"
                  />
                </Field>
              </Section>

              <Section title="Location">
                <Field label="Address">
                  <Input value={row.address ?? ''} onChange={(e) => set('address', e.target.value)} />
                </Field>
                <div className="grid grid-cols-2 gap-2">
                  <Field label="City">
                    <Input value={row.city ?? ''} onChange={(e) => set('city', e.target.value)} />
                  </Field>
                  <Field label="State">
                    <Input value={row.state ?? ''} onChange={(e) => set('state', e.target.value)} />
                  </Field>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <Field label="Latitude">
                    <Input
                      type="number"
                      step="any"
                      value={row.latitude ?? ''}
                      onChange={(e) => set('latitude', numOrNull(e.target.value))}
                    />
                  </Field>
                  <Field label="Longitude">
                    <Input
                      type="number"
                      step="any"
                      value={row.longitude ?? ''}
                      onChange={(e) => set('longitude', numOrNull(e.target.value))}
                    />
                  </Field>
                </div>
              </Section>

              <Section title="Rating" hint="0–10, one decimal. Leave empty to hide the badge.">
                <div className="grid grid-cols-2 gap-2">
                  <Field label="Rating">
                    <Input
                      type="number"
                      min={0}
                      max={10}
                      step="0.1"
                      value={row.rating ?? ''}
                      onChange={(e) => set('rating', numOrNull(e.target.value))}
                    />
                  </Field>
                  <Field label="Sources">
                    <Input
                      type="number"
                      min={0}
                      value={row.rating_count ?? ''}
                      onChange={(e) => set('rating_count', numOrNull(e.target.value))}
                    />
                  </Field>
                </div>
              </Section>

              <Section
                title="Good to know"
                hint={
                  fields.length === 0
                    ? `No attribute vocabulary for “${row.category ?? 'unknown'}” yet.`
                    : 'Generated from the same definition the app renders.'
                }
              >
                {fields.map((f) => (
                  <AttributeControl
                    key={f.key}
                    field={f}
                    value={attrs[f.key]}
                    onChange={(v) => setAttr(f.key, v)}
                  />
                ))}
              </Section>

              <Section title="Opening hours">
                <Input
                  placeholder="Open daily, 5:00 am – 9:30 pm"
                  value={row.opening_hours ?? ''}
                  onChange={(e) => set('opening_hours', e.target.value)}
                />
              </Section>

              <Section title="Contact" hint="Social handles bare, no @ and no URL.">
                {(
                  [
                    ['phone', 'Phone'],
                    ['whatsapp', 'WhatsApp'],
                    ['email', 'Email'],
                    ['website', 'Website'],
                    ['instagram', 'Instagram'],
                    ['facebook', 'Facebook'],
                    ['x_handle', 'X'],
                  ] as const
                ).map(([key, label]) => (
                  <Field key={key} label={label}>
                    <Input
                      value={(row[key] as string | null) ?? ''}
                      onChange={(e) => set(key, e.target.value)}
                    />
                  </Field>
                ))}
              </Section>
            </div>
          )}
        </div>

        <footer className="flex shrink-0 items-center gap-2 border-t px-4 py-3">
          <Button variant="outline" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button className="flex-1" onClick={() => void save()} disabled={saving || loading}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Save
          </Button>
        </footer>
      </aside>
    </div>
  );
}

function AttributeControl({
  field,
  value,
  onChange,
}: {
  field: AttributeField;
  value: unknown;
  onChange: (v: unknown) => void;
}) {
  const { input, label } = field;

  if (input.control === 'boolean') {
    return (
      <label className="flex cursor-pointer items-center gap-2 py-0.5 text-sm">
        <Checkbox checked={value === true} onCheckedChange={(v) => onChange(Boolean(v))} />
        {label}
      </label>
    );
  }

  if (input.control === 'enum') {
    return (
      <Field label={label}>
        <select
          value={(value as string) ?? ''}
          onChange={(e) => onChange(e.target.value || undefined)}
          className="h-9 w-full rounded-md border border-input bg-background px-2 text-sm"
        >
          <option value="">—</option>
          {input.options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </Field>
    );
  }

  if (input.control === 'number') {
    return (
      <Field label={label} hint={input.suffix}>
        <Input
          type="number"
          min={input.min}
          value={(value as number | undefined) ?? ''}
          onChange={(e) => onChange(e.target.value === '' ? undefined : Number(e.target.value))}
        />
      </Field>
    );
  }

  if (input.control === 'tags') {
    const list = Array.isArray(value) ? (value as string[]) : [];
    return (
      <Field label={label} hint={input.suggestions?.join(', ')}>
        <Input
          value={list.join(', ')}
          placeholder={input.suggestions?.slice(0, 3).join(', ')}
          onChange={(e) =>
            onChange(
              e.target.value
                .split(',')
                .map((s) => s.trim().toLowerCase())
                .filter(Boolean),
            )
          }
        />
      </Field>
    );
  }

  return (
    <Field label={label}>
      <Input
        placeholder={input.control === 'text' ? input.placeholder : undefined}
        value={(value as string) ?? ''}
        onChange={(e) => onChange(e.target.value || undefined)}
      />
    </Field>
  );
}

function Section({
  title,
  hint,
  children,
}: {
  title: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-2">
      <div>
        <h3 className="text-xs font-semibold tracking-wide uppercase">{title}</h3>
        {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
      </div>
      {children}
    </section>
  );
}

function Field({
  label,
  hint,
  children,
  className,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <label className={cn('block space-y-1', className)}>
      <span className="text-xs text-muted-foreground">
        {label}
        {hint ? <span className="ml-1 opacity-60">· {hint}</span> : null}
      </span>
      {children}
    </label>
  );
}

const emptyToNull = (v: string | null | undefined) => (v && v.trim() !== '' ? v.trim() : null);
const numOrNull = (v: string) => (v === '' ? null : Number(v));
