import { useColorScheme } from '@/hooks/use-color-scheme';
import { useMemo } from 'react';

export type ThemeColors = {
  // Base colors
  background: string;
  backgroundSecondary: string;
  text: string;
  textSecondary: string;
  textMuted: string;
  
  // UI elements
  border: string;
  borderLight: string;
  inputBg: string;
  cardBg: string;
  sheetBg: string;
  
  // Interactive elements
  placeholder: string;
  dragIndicator: string;
  
  // Badges & chips
  badgeBg: string;
  badgeText: string;
  chipBg: string;
  chipActiveBg: string;
  chipText: string;
  chipActiveText: string;
  
  // Segments
  segmentBg: string;
  segmentActiveBg: string;
  
  // Note/warning
  noteBg: string;
  noteText: string;
  
  // Overlays
  overlayBg: string;
  submitBarBg: string;
  
  // Skeleton loading
  skeletonBg: string;
  skeletonShimmer: string;
};

export function useTheme() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const colors = useMemo<ThemeColors>(() => ({
    // Base colors
    background: isDark ? '#151718' : '#fff',
    backgroundSecondary: isDark ? '#1c1c1e' : '#f9f6f4',
    text: isDark ? '#fff' : '#000',
    textSecondary: isDark ? '#9BA1A6' : '#454745',
    textMuted: isDark ? '#6e7175' : '#7a7a85',
    
    // UI elements
    border: isDark ? 'rgba(255,255,255,0.12)' : '#EBEBEF',
    borderLight: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)',
    inputBg: isDark ? '#2a2a2a' : '#fff',
    cardBg: isDark ? '#2a2a2a' : '#fff',
    sheetBg: isDark ? '#1c1c1e' : '#fff',
    
    // Interactive elements
    placeholder: isDark ? '#9BA1A6' : '#7a7a85',
    dragIndicator: isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.15)',
    
    // Badges & chips
    badgeBg: isDark ? '#3a3a3a' : '#F2EFED',
    badgeText: isDark ? '#9BA1A6' : '#454745',
    chipBg: isDark ? '#2a2a2a' : '#fff',
    chipActiveBg: isDark ? '#3a3a3a' : '#0c0c0f',
    chipText: isDark ? '#9BA1A6' : '#0c0c0f',
    chipActiveText: isDark ? '#fff' : '#fff',
    
    // Segments
    segmentBg: isDark ? '#2a2a2a' : '#F6F6F9',
    segmentActiveBg: isDark ? '#3a3a3a' : '#fff',
    
    // Note/warning
    noteBg: isDark ? 'rgba(139,69,19,0.15)' : '#FCEFE4',
    noteText: isDark ? '#D4A574' : '#8B4513',
    
    // Overlays
    overlayBg: isDark ? 'rgba(0,0,0,0.7)' : 'rgba(0,0,0,0.5)',
    submitBarBg: isDark ? 'rgba(21,23,24,0.96)' : 'rgba(255,255,255,0.96)',
    
    // Skeleton loading
    skeletonBg: isDark ? '#3a3a3a' : '#ececec',
    skeletonShimmer: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.55)',
  }), [isDark]);

  return {
    colors,
    isDark,
    colorScheme,
  };
}
