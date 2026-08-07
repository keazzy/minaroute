/**
 * PLACEHOLDER CONTENT for the place detail page — not wired to Supabase.
 *
 * Shaped deliberately like a future `places` row plus the columns this page
 * proves we need, so the migration can be read off it directly:
 *
 *   already in the table   id, name, category, description, address, city,
 *                          state, latitude, longitude, tags, photos
 *   this page needs added  rating, rating_count, attributes (jsonb),
 *                          phone, website, opening_hours
 *
 * Two entries on purpose — a mosque and a school — because the whole point of
 * the attribute model is that the same page renders both from different
 * vocabularies. See `src/lib/places/attributes.ts`.
 */
import type { ImageSourcePropType } from 'react-native';

import type { Contacts } from './ContactLinks';

export type PlaceDetail = {
  id: string;
  name: string;
  /** Raw DB category string; mapped to an attribute vocabulary at render. */
  category: string;
  /** Shown as the eyebrow above the title. */
  categoryLabel: string;
  description: string;
  address: string;
  city: string;
  latitude: number;
  longitude: number;
  photos: ImageSourcePropType[];
  /** 0–10, one decimal. Absent means no rating — the badge hides entirely. */
  rating?: number;
  ratingCount?: number;
  /** Raw jsonb blob, validated per category at render time. */
  attributes: Record<string, unknown>;
  /**
   * Sparse — only the channels a place actually has. Social handles are stored
   * bare ("minaroute"), never as full profile URLs, so they can be shown as
   * @handle and still validated. Each is its own column in the migration.
   */
  contacts: Contacts;
  /** Free text for now; a structured weekly schedule is a later migration. */
  openingHours?: string;
};

const IMG = {
  mosqueKaduna: require('../../../assets/images/home/mosque-kaduna.jpg'),
  mosqueSuleymaniye: require('../../../assets/images/home/mosque-suleymaniye.jpg'),
  mosqueDome: require('../../../assets/images/home/mosque-dome.jpg'),
  mosqueCarpet: require('../../../assets/images/home/mosque-carpet.jpg'),
  mosqueCeiling: require('../../../assets/images/home/mosque-ceiling.jpg'),
  schoolLecture: require('../../../assets/images/home/school-lecture.jpg'),
  schoolHands: require('../../../assets/images/home/school-hands.jpg'),
  schoolOutdoors: require('../../../assets/images/home/school-outdoors.jpg'),
  schoolLaptop: require('../../../assets/images/home/school-laptop.jpg'),
};

export const PLACEHOLDER_PLACES_BY_ID: Record<string, PlaceDetail> = {
  p1: {
    id: 'p1',
    name: 'Mosadoluwa Ratibi Mosque',
    category: 'mosque',
    categoryLabel: 'Mosque',
    description:
      'A neighbourhood ratibi mosque serving the Agege community, with daily jama‘ah for all five prayers and a well-attended Jumu‘ah. The main hall seats around four hundred, with a separate screened section for women reached from the side entrance on Oyewole Street. Wudu facilities sit to the left of the main entrance and are open throughout the day. The attached madrasah runs weekend Qur’an classes for children aged six and above.',
    address: '14 Oyewole Street, Agege',
    city: 'Lagos',
    latitude: 6.6155,
    longitude: 3.3213,
    photos: [IMG.mosqueKaduna, IMG.mosqueSuleymaniye, IMG.mosqueDome, IMG.mosqueCarpet],
    rating: 9.0,
    ratingCount: 1,
    attributes: {
      jumuah_time: '1:30 pm',
      jamaah_times: true,
      womens_section: true,
      wudu_facilities: true,
      parking: true,
      madrasah: true,
      eid_prayers: true,
      // Deliberately false, not absent — proves false renders as silence rather
      // than as a "no wheelchair access" claim.
      wheelchair_access: false,
      capacity: 400,
    },
    // No website or Facebook — proves the block renders only what exists.
    contacts: {
      phone: '+234 802 345 6789',
      whatsapp: '+234 802 345 6789',
      instagram: 'mosadoluwa.mosque',
    },
    openingHours: 'Open daily, 5:00 am – 9:30 pm',
  },

  p2: {
    id: 'p2',
    name: 'Usoolul-iman School, Agege',
    category: 'learning centre',
    categoryLabel: 'Learning centre',
    description:
      'An Islamic school combining the Nigerian national curriculum with Qur’an memorisation, running from nursery through secondary. Boarding is available from JSS1. Admissions for the September intake usually open in April.',
    address: '7 Ashade Street, Agege',
    city: 'Lagos',
    latitude: 6.6208,
    longitude: 3.3247,
    photos: [IMG.schoolLecture, IMG.schoolHands, IMG.schoolOutdoors, IMG.schoolLaptop],
    rating: 8.6,
    ratingCount: 2,
    attributes: {
      levels: ['nursery', 'primary', 'secondary'],
      gender: 'mixed',
      boarding: true,
      day_school: true,
      quran_memorisation: true,
      national_curriculum: true,
      fees_from: 85000,
      admission_open: false,
    },
    // The fuller case — a school office runs every channel.
    contacts: {
      phone: '+234 803 987 6543',
      whatsapp: '+234 803 987 6543',
      email: 'admissions@usoolul-iman.edu.ng',
      website: 'https://usoolul-iman.edu.ng',
      instagram: 'usooluliman',
      facebook: 'usoolulimanschool',
    },
    openingHours: 'Mon – Fri, 7:30 am – 4:00 pm',
  },
};

/** Falls back to the mosque so the route always renders something in dev. */
export function placeholderPlace(id: string | undefined): PlaceDetail {
  return (id ? PLACEHOLDER_PLACES_BY_ID[id] : undefined) ?? PLACEHOLDER_PLACES_BY_ID.p1;
}
