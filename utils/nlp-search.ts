/**
 * Natural Language Search Intent Extraction
 * 
 * Extracts structured search intent from natural language queries
 * for finding mosques, schools, restaurants, and other Islamic resources in Lagos.
 */

export type SearchCategory = 'mosque' | 'school' | 'restaurant' | 'store' | 'center' | 'event' | null;

export type SearchIntent = {
  category: SearchCategory;
  tags: string[];
  location: string | null;
  useUserLocation: boolean;
  isNaturalLanguage: boolean;
  originalQuery: string;
};

// Category keyword mappings
const CATEGORY_KEYWORDS: Record<Exclude<SearchCategory, null>, string[]> = {
  school: ['school', 'schools', 'academy', 'madrasah', 'madrasa', 'tahfeez', 'tahfiz', 'islamic school', 'quranic school'],
  mosque: ['mosque', 'mosques', 'masjid', 'prayer', 'jumah', 'jummah', 'jumuah', 'prayer room'],
  restaurant: ['restaurant', 'restaurants', 'food', 'eat', 'eating', 'dining', 'halal food', 'eatery', 'cafe', 'cafeteria'],
  store: ['store', 'stores', 'shop', 'shops', 'bookstore', 'bookshop', 'hijab', 'grocery', 'groceries', 'islamic store'],
  center: ['community center', 'islamic center', 'center', 'centre', 'community'],
  event: ['event', 'events', 'program', 'programme', 'class', 'classes', 'lecture', 'lectures', 'seminar', 'workshop'],
};

// Tag keyword mappings - these get added to the tags array when detected
const TAG_KEYWORDS: Record<string, string[]> = {
  tahfeez: ['tahfeez', 'tahfiz', 'hifz', 'memorization', 'quran memorization'],
  halal: ['halal', 'halaal'],
  parking: ['parking', 'park'],
  kids: ['kids', 'children', 'child', 'youth', 'young'],
  women: ['women', 'sisters', 'female', 'ladies'],
  wheelchair: ['wheelchair', 'accessible', 'disability', 'disabled'],
  jumah: ['jumah', 'jummah', 'jumuah', 'friday prayer'],
  western: ['western', 'western education'],
  quranic: ['quranic', 'quran', 'islamic studies'],
};

// Lagos areas to detect
const LAGOS_AREAS = [
  'surulere', 'yaba', 'ikeja', 'lekki', 'victoria island', 'vi', 'ikoyi', 
  'ajah', 'festac', 'mushin', 'oshodi', 'maryland', 'gbagada', 'ketu', 
  'ikorodu', 'agege', 'alimosho', 'ojota', 'ogudu', 'magodo', 'omole',
  'ogba', 'opebi', 'allen', 'oregun', 'berger', 'ojodu', 'isheri',
  'egbeda', 'idimu', 'igando', 'ikotun', 'ejigbo', 'isolo', 'okota',
  'amuwo odofin', 'apapa', 'ebute metta', 'oyingbo', 'idumota', 'marina',
  'lagos island', 'iganmu', 'orile', 'mile 2', 'ojo', 'badagry',
  'epe', 'ibeju lekki', 'sangotedo', 'awoyaya', 'abraham adesanya',
  'chevron', 'jakande', 'oniru', 'banana island', 'eko atlantic',
];

// Prepositions and patterns that indicate natural language
const NL_INDICATORS = ['in', 'at', 'near', 'around', 'with', 'for', 'close to', 'nearby'];
const NEAR_ME_PATTERNS = ['near me', 'nearby', 'close to me', 'around me', 'closest', 'nearest'];

/**
 * Normalizes a query string for matching
 */
function normalizeQuery(query: string): string {
  return query.toLowerCase().trim();
}

/**
 * Detects if a query appears to be natural language vs a simple keyword
 */
function isNaturalLanguageQuery(query: string): boolean {
  const normalized = normalizeQuery(query);
  const words = normalized.split(/\s+/);
  
  // Single word queries are typically keywords
  if (words.length === 1) {
    return false;
  }
  
  // Check for natural language indicators (prepositions)
  for (const indicator of NL_INDICATORS) {
    if (normalized.includes(` ${indicator} `) || normalized.startsWith(`${indicator} `)) {
      return true;
    }
  }
  
  // Check for near me patterns
  for (const pattern of NEAR_ME_PATTERNS) {
    if (normalized.includes(pattern)) {
      return true;
    }
  }
  
  // Check if query contains both a category keyword AND something else
  let hasCategoryKeyword = false;
  for (const keywords of Object.values(CATEGORY_KEYWORDS)) {
    for (const keyword of keywords) {
      if (normalized.includes(keyword)) {
        hasCategoryKeyword = true;
        break;
      }
    }
    if (hasCategoryKeyword) break;
  }
  
  // If we have a category keyword and more than 2 words, likely natural language
  if (hasCategoryKeyword && words.length >= 2) {
    return true;
  }
  
  return false;
}

/**
 * Extracts category from query
 */
function extractCategory(query: string): SearchCategory {
  const normalized = normalizeQuery(query);
  
  // Check each category's keywords
  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    for (const keyword of keywords) {
      // Use word boundary matching for single words, contains for multi-word
      if (keyword.includes(' ')) {
        if (normalized.includes(keyword)) {
          return category as SearchCategory;
        }
      } else {
        // Match as whole word or at word boundaries
        const regex = new RegExp(`\\b${keyword}\\b`, 'i');
        if (regex.test(normalized)) {
          return category as SearchCategory;
        }
      }
    }
  }
  
  return null;
}

/**
 * Extracts tags from query
 */
function extractTags(query: string): string[] {
  const normalized = normalizeQuery(query);
  const foundTags: string[] = [];
  
  for (const [tag, keywords] of Object.entries(TAG_KEYWORDS)) {
    for (const keyword of keywords) {
      if (keyword.includes(' ')) {
        if (normalized.includes(keyword)) {
          if (!foundTags.includes(tag)) {
            foundTags.push(tag);
          }
          break;
        }
      } else {
        const regex = new RegExp(`\\b${keyword}\\b`, 'i');
        if (regex.test(normalized)) {
          if (!foundTags.includes(tag)) {
            foundTags.push(tag);
          }
          break;
        }
      }
    }
  }
  
  return foundTags;
}

/**
 * Extracts location (Lagos area) from query
 */
function extractLocation(query: string): string | null {
  const normalized = normalizeQuery(query);
  
  // Sort by length descending to match longer names first (e.g., "victoria island" before "island")
  const sortedAreas = [...LAGOS_AREAS].sort((a, b) => b.length - a.length);
  
  for (const area of sortedAreas) {
    if (normalized.includes(area)) {
      // Return with proper capitalization
      return area.split(' ').map(word => 
        word.charAt(0).toUpperCase() + word.slice(1)
      ).join(' ');
    }
  }
  
  return null;
}

/**
 * Checks if query contains "near me" or similar patterns
 */
function detectNearMe(query: string): boolean {
  const normalized = normalizeQuery(query);
  
  for (const pattern of NEAR_ME_PATTERNS) {
    if (normalized.includes(pattern)) {
      return true;
    }
  }
  
  return false;
}

/**
 * Main function: Extracts search intent from a natural language query
 */
export function extractSearchIntent(query: string): SearchIntent {
  const trimmedQuery = query.trim();
  
  if (!trimmedQuery) {
    return {
      category: null,
      tags: [],
      location: null,
      useUserLocation: false,
      isNaturalLanguage: false,
      originalQuery: trimmedQuery,
    };
  }
  
  const isNL = isNaturalLanguageQuery(trimmedQuery);
  
  return {
    category: extractCategory(trimmedQuery),
    tags: extractTags(trimmedQuery),
    location: extractLocation(trimmedQuery),
    useUserLocation: detectNearMe(trimmedQuery),
    isNaturalLanguage: isNL,
    originalQuery: trimmedQuery,
  };
}

/**
 * Maps our internal category to the app's PlaceType
 */
export function categoryToPlaceType(category: SearchCategory): 'Mosque' | 'School' | 'Halal Food' | 'Event' | null {
  switch (category) {
    case 'mosque':
      return 'Mosque';
    case 'school':
      return 'School';
    case 'restaurant':
      return 'Halal Food';
    case 'event':
      return 'Event';
    case 'store':
    case 'center':
      // These don't have direct PlaceType mappings, return null to search all
      return null;
    default:
      return null;
  }
}

/**
 * Filters a list of items based on extracted search intent
 * This is the main integration point for the search results
 */
export function filterByIntent<T extends { 
  name: string; 
  address: string; 
  type: string; 
  tags: string[];
  city?: string;
}>(
  items: T[],
  intent: SearchIntent,
  options?: { userCoords?: { latitude: number; longitude: number } | null }
): T[] {
  if (!intent.isNaturalLanguage) {
    // For non-NL queries, use simple substring matching (existing behavior)
    const q = intent.originalQuery.toLowerCase();
    if (!q) return items;
    
    return items.filter(item => {
      const haystack = `${item.name} ${item.address} ${item.type} ${item.tags.join(' ')}`.toLowerCase();
      return haystack.includes(q);
    });
  }
  
  // Natural language filtering
  let filtered = [...items];
  
  // Filter by category/type
  if (intent.category) {
    const placeType = categoryToPlaceType(intent.category);
    if (placeType) {
      filtered = filtered.filter(item => item.type === placeType);
    }
  }
  
  // Filter by location (partial match on address or city)
  if (intent.location) {
    const locationLower = intent.location.toLowerCase();
    filtered = filtered.filter(item => {
      const addressLower = item.address.toLowerCase();
      const cityLower = (item.city || '').toLowerCase();
      return addressLower.includes(locationLower) || cityLower.includes(locationLower);
    });
  }
  
  // Filter by tags
  if (intent.tags.length > 0) {
    filtered = filtered.filter(item => {
      const itemTagsLower = item.tags.map(t => t.toLowerCase());
      return intent.tags.some(intentTag => 
        itemTagsLower.some(itemTag => itemTag.includes(intentTag.toLowerCase()))
      );
    });
  }
  
  // Note: useUserLocation is handled at a higher level (distance filtering)
  // The caller should apply distance-based filtering if intent.useUserLocation is true
  
  return filtered;
}
