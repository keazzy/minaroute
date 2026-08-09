import { useState } from 'react';
import { ArrowDown, ArrowUp, ImageOff, Plus, Trash2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

/**
 * Photo list editor.
 *
 * URLs rather than uploads, for now, because the project has no storage bucket —
 * and because that is what the existing data already is. Every photo in the
 * database today is hotlinked from a third-party site, so two things matter more
 * here than they normally would:
 *
 *  - **A live preview.** A hotlinked URL can rot, or be blocked by a referer
 *    check, and the only way to know is to try loading it. A broken thumbnail
 *    here is the same broken image the app would show.
 *  - **Explicit ordering.** `photos[0]` is the card image everywhere in the app
 *    (see `Place.image` in src/lib/places/types.ts), so which photo is first is
 *    a real editorial decision, not an implementation detail. It is labelled.
 */
export function PhotosField({
  photos,
  onChange,
}: {
  photos: string[];
  onChange: (next: string[]) => void;
}) {
  const [draft, setDraft] = useState('');

  const add = () => {
    const url = draft.trim();
    if (!url) return;
    if (photos.includes(url)) {
      setDraft('');
      return;
    }
    onChange([...photos, url]);
    setDraft('');
  };

  const move = (from: number, to: number) => {
    if (to < 0 || to >= photos.length) return;
    const next = [...photos];
    const [item] = next.splice(from, 1);
    next.splice(to, 0, item);
    onChange(next);
  };

  return (
    <div className="space-y-2">
      {photos.length === 0 ? (
        <p className="rounded-md border border-dashed px-3 py-4 text-center text-xs text-muted-foreground">
          No photos. The card and detail page render a grey box.
        </p>
      ) : (
        <ul className="space-y-2">
          {photos.map((url, i) => (
            <li key={`${url}-${i}`} className="flex items-start gap-2 rounded-md border p-2">
              <Thumb url={url} />
              <div className="min-w-0 flex-1 space-y-1">
                {i === 0 ? (
                  <span className="inline-block rounded bg-primary px-1.5 py-0.5 text-[10px] font-medium text-primary-foreground">
                    Card image
                  </span>
                ) : null}
                <Input
                  value={url}
                  onChange={(e) => {
                    const next = [...photos];
                    next[i] = e.target.value;
                    onChange(next);
                  }}
                  className="h-7 text-xs"
                />
              </div>
              <div className="flex shrink-0 flex-col">
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-5 w-5"
                  title="Move up"
                  disabled={i === 0}
                  onClick={() => move(i, i - 1)}
                >
                  <ArrowUp className="h-3 w-3" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-5 w-5"
                  title="Move down"
                  disabled={i === photos.length - 1}
                  onClick={() => move(i, i + 1)}
                >
                  <ArrowDown className="h-3 w-3" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-5 w-5 text-destructive"
                  title="Remove"
                  onClick={() => onChange(photos.filter((_, j) => j !== i))}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <div className="flex gap-2">
        <Input
          placeholder="https://…"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              add();
            }
          }}
          className="h-8 text-xs"
        />
        <Button size="sm" variant="outline" onClick={add} disabled={!draft.trim()}>
          <Plus className="h-3.5 w-3.5" />
          Add
        </Button>
      </div>
    </div>
  );
}

/** Loads the real URL, so a dead or hotlink-blocked image shows here as it would in the app. */
function Thumb({ url }: { url: string }) {
  const [state, setState] = useState<'loading' | 'ok' | 'broken'>('loading');

  return (
    <div
      className={cn(
        'flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded border bg-muted',
        state === 'broken' && 'border-destructive/50',
      )}
      title={state === 'broken' ? 'This URL did not load' : undefined}
    >
      {state === 'broken' ? (
        <ImageOff className="h-4 w-4 text-destructive" />
      ) : (
        <img
          src={url}
          alt=""
          loading="lazy"
          referrerPolicy="no-referrer"
          onLoad={() => setState('ok')}
          onError={() => setState('broken')}
          className={cn('h-full w-full object-cover', state !== 'ok' && 'opacity-0')}
        />
      )}
    </div>
  );
}
