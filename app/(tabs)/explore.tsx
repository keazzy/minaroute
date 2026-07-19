/**
 * Explore tab — map-first discovery of Muslim-friendly places (the original Minaroute
 * core). Reuses the existing discovery screen as-is (map + native bottom sheet +
 * categories + search). It is RENDERED here rather than moved so its relative imports
 * (`../components/map`, etc.) keep resolving. Metro picks the platform variant
 * (home.ios.tsx / home.tsx) automatically.
 */
import HomeDiscoveryScreen from '@/app/home';

export default function ExploreTab() {
  return <HomeDiscoveryScreen />;
}
