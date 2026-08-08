import type * as React from 'react';
import { cn } from '@/lib/utils';

export function Badge({
  className,
  tone = 'muted',
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & { tone?: 'muted' | 'good' | 'warn' }) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-md px-1.5 py-0.5 text-xs font-medium',
        tone === 'muted' && 'bg-muted text-muted-foreground',
        tone === 'good' && 'bg-primary text-primary-foreground',
        tone === 'warn' && 'bg-amber-500/15 text-amber-700 dark:text-amber-400',
        className,
      )}
      {...props}
    />
  );
}
