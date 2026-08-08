import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/** Merge Tailwind classes so later ones win conflicts. Standard shadcn helper. */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
