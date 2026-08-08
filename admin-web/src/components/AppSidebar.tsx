import {
  CalendarDays,
  Inbox,
  LayoutDashboard,
  LogOut,
  MapPin,
  MessageSquare,
  Route,
  ShieldCheck,
  Users,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { supabase } from '@/lib/supabase';

/**
 * Sidebar navigation.
 *
 * Sections are grouped by what they are *for* rather than by table, because the
 * catalogue and the community are different jobs done at different times.
 *
 * Items that have no screen yet are listed and disabled rather than hidden. A
 * nav that quietly omits Users and Reviews implies Minaroute has no such thing;
 * showing them greyed says "coming, not forgotten" — which is the truth, and it
 * stops the shape of the product being defined by what happens to be built.
 */

export type Route =
  | 'overview'
  | 'places'
  | 'events'
  | 'suggestions'
  | 'users'
  | 'reviews'
  | 'itineraries'
  | 'admins';

type Item = {
  id: Route;
  label: string;
  icon: typeof MapPin;
  ready: boolean;
  /** Shown as a small count on the right. */
  badge?: number | null;
};

type Group = { heading: string; items: Item[] };

export function AppSidebar({
  route,
  onNavigate,
  email,
  counts,
}: {
  route: Route;
  onNavigate: (r: Route) => void;
  email: string | undefined;
  counts: Partial<Record<Route, number | null>>;
}) {
  const groups: Group[] = [
    {
      heading: 'Catalogue',
      items: [
        { id: 'overview', label: 'Overview', icon: LayoutDashboard, ready: true },
        { id: 'places', label: 'Places', icon: MapPin, ready: true, badge: counts.places ?? null },
        { id: 'events', label: 'Events', icon: CalendarDays, ready: true, badge: counts.events ?? null },
        {
          id: 'suggestions',
          label: 'Suggestions',
          icon: Inbox,
          ready: false,
          badge: counts.suggestions ?? null,
        },
      ],
    },
    {
      heading: 'Community',
      items: [
        { id: 'users', label: 'Users', icon: Users, ready: false },
        { id: 'reviews', label: 'Reviews', icon: MessageSquare, ready: false },
      ],
    },
    {
      heading: 'Manasik',
      items: [{ id: 'itineraries', label: 'Itineraries', icon: Route, ready: false }],
    },
    {
      heading: 'System',
      items: [{ id: 'admins', label: 'Admins', icon: ShieldCheck, ready: false }],
    },
  ];

  return (
    <aside className="flex w-52 shrink-0 flex-col border-r bg-muted/30">
      <div className="px-3 py-3">
        <div className="text-sm font-semibold">Minaroute</div>
        <div className="text-xs text-muted-foreground">Admin</div>
      </div>

      <nav className="min-h-0 flex-1 overflow-y-auto px-2 pb-2">
        {groups.map((group) => (
          <div key={group.heading} className="mb-3">
            <div className="px-2 py-1 text-[10px] font-medium tracking-wider text-muted-foreground uppercase">
              {group.heading}
            </div>
            {group.items.map(({ id, label, icon: Icon, ready, badge }) => (
              <button
                key={id}
                disabled={!ready}
                onClick={() => onNavigate(id)}
                title={ready ? undefined : 'Not built yet'}
                className={cn(
                  'flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm',
                  ready
                    ? 'hover:bg-accent hover:text-accent-foreground'
                    : 'cursor-not-allowed opacity-40',
                  route === id && ready && 'bg-accent font-medium text-accent-foreground',
                )}
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span className="truncate">{label}</span>
                {typeof badge === 'number' ? (
                  <span className="ml-auto text-xs text-muted-foreground">{badge}</span>
                ) : null}
              </button>
            ))}
          </div>
        ))}
      </nav>

      <div className="border-t px-2 py-2">
        <div className="truncate px-2 pb-1 text-xs text-muted-foreground" title={email}>
          {email}
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start"
          onClick={() => supabase.auth.signOut()}
        >
          <LogOut className="h-3.5 w-3.5" />
          Sign out
        </Button>
      </div>
    </aside>
  );
}
