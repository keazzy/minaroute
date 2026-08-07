/**
 * PLACEHOLDER CONTENT for the event detail page — not wired to Supabase.
 *
 * Shaped like the `events` row we need, which is a long way from the row we
 * have. Today `events` is:
 *
 *   id, title, description, location_name, city, state, photo, approved, tags
 *
 * Everything else below is a column this page proves we need:
 *
 *   starts_at / ends_at  timestamptz — there is currently NO date on an event
 *                        at all, which is why Home cannot sort "coming up soon"
 *   latitude / longitude — no coordinates, so an event cannot be mapped;
 *                        needs geocoding from location_name at ingest
 *   photos               — `photo` is singular, so no gallery and no carousel
 *   attributes (jsonb)   — audience, childcare, free entry (see attributes.ts)
 *   price_from, currency, ticket_url
 *   organiser_name + the same contact columns as places
 *
 * Dates are stored as ISO strings here and formatted at render, exactly as they
 * will be once they come from timestamptz.
 */
import type { ImageSourcePropType } from 'react-native';

import type { Contacts } from './ContactLinks';

export type EventDetail = {
  id: string;
  title: string;
  description: string;
  /** ISO 8601. */
  startsAt: string;
  endsAt?: string;
  venueName: string;
  address: string;
  city: string;
  latitude: number;
  longitude: number;
  photos: ImageSourcePropType[];
  /** Omit for a free event; the attributes carry the "Free entry" chip. */
  priceFrom?: number;
  ticketUrl?: string;
  organiserName?: string;
  contacts: Contacts;
  attributes: Record<string, unknown>;
};

const IMG = {
  singleAndSecure: require('../../../assets/images/home/event-single-and-secure.jpg'),
  muslimTechExpo: require('../../../assets/images/home/event-muslim-tech-expo.jpg'),
  ummah: require('../../../assets/images/home/event-1ummah-puc.jpg'),
  souqWaqif: require('../../../assets/images/home/place-souq-waqif.jpg'),
  foodBuffet: require('../../../assets/images/home/food-buffet.jpg'),
  schoolLaptop: require('../../../assets/images/home/school-laptop.jpg'),
  mosqueDome: require('../../../assets/images/home/mosque-dome.jpg'),
  mosqueKaduna: require('../../../assets/images/home/mosque-kaduna.jpg'),
  schoolOutdoors: require('../../../assets/images/home/school-outdoors.jpg'),
  schoolLecture: require('../../../assets/images/home/school-lecture.jpg'),
  mosqueSuleymaniye: require('../../../assets/images/home/mosque-suleymaniye.jpg'),
};

export const PLACEHOLDER_EVENTS_BY_ID: Record<string, EventDetail> = {
  e1: {
    id: 'e1',
    title: 'Single & Secure 3.0 — Love in the Age of Algorithm',
    description:
      'The third edition of Single & Secure brings together singles, parents and counsellors for a full day on marriage readiness in the age of dating apps and algorithmic matchmaking. Sessions include The Healing Room, the Compatibility Compass, a Readiness Check clinic and a Singles POV panel. Convened by Mrs Bushro Okeowo Bombata of Hearthub Solution.',
    startsAt: '2026-08-09T10:00:00+01:00',
    endsAt: '2026-08-09T17:00:00+01:00',
    venueName: 'Shodex Garden',
    address: 'Shodex Garden, Ilupeju',
    city: 'Lagos',
    latitude: 6.5539,
    longitude: 3.3606,
    photos: [IMG.singleAndSecure, IMG.souqWaqif, IMG.foodBuffet],
    priceFrom: 7500,
    ticketUrl: 'https://example.com/tickets/single-and-secure-3',
    organiserName: 'Hearthub Solution',
    contacts: {
      phone: '+234 812 921 7813',
      whatsapp: '+234 907 703 9482',
      instagram: 'singleandsecure',
    },
    attributes: {
      audience: 'mixed',
      registration_required: true,
      halal_catering: true,
      prayer_space: true,
      parking: true,
      // False on purpose — must render as silence, not as a denial.
      childcare: false,
      language: ['english'],
    },
  },

  e2: {
    id: 'e2',
    title: 'Muslim Tech Expo Kenya 2026',
    description:
      'A two-day gathering of Muslim founders, engineers and investors across East Africa, with a startup showcase, hiring floor and workshops on building halal-first products.',
    startsAt: '2026-09-12T09:00:00+03:00',
    endsAt: '2026-09-13T18:00:00+03:00',
    venueName: 'Sarit Expo Centre',
    address: 'Sarit Expo Centre, Westlands',
    city: 'Nairobi',
    latitude: -1.2634,
    longitude: 36.8034,
    photos: [IMG.muslimTechExpo, IMG.schoolLaptop, IMG.mosqueDome],
    // No priceFrom — free, and the chip says so.
    organiserName: 'Muslim Tech Expo',
    contacts: {
      email: 'hello@example.org',
      website: 'https://example.org',
      instagram: 'muslimtechexpo',
      x: 'muslimtechexpo',
    },
    attributes: {
      audience: 'mixed',
      free_entry: true,
      registration_required: true,
      prayer_space: true,
      wheelchair_access: true,
      language: ['english', 'swahili'],
    },
  },

  e3: {
    id: 'e3',
    title: '1Ummah Peace & Unity Convention',
    description: 'A community convention on unity, civic participation and neighbourly relations.',
    startsAt: '2026-11-14T11:00:00+01:00',
    venueName: 'Lagos City Hall',
    address: 'Lagos City Hall, Lagos Island',
    city: 'Lagos',
    latitude: 6.4531,
    longitude: 3.3958,
    photos: [IMG.ummah, IMG.mosqueKaduna],
    organiserName: '1Ummah',
    // Deliberately bare: no contacts at all, so the whole block must disappear.
    contacts: {},
    attributes: { free_entry: true, audience: 'family' },
  },

  e4: {
    id: 'e4',
    title: 'MSSN Lagos 115th Islamic Vacation Course',
    description:
      'The long-running IVC brings students together for a week of lectures, halaqah and community service. Accommodation is provided on site; sisters and brothers are housed separately.',
    startsAt: '2026-12-25T08:00:00+01:00',
    endsAt: '2026-12-31T20:00:00+01:00',
    venueName: 'Lagos State Polytechnic',
    address: 'Lagos State Polytechnic, Epe Campus',
    city: 'Epe',
    latitude: 6.5833,
    longitude: 3.9833,
    photos: [IMG.schoolOutdoors, IMG.schoolLecture, IMG.mosqueSuleymaniye],
    priceFrom: 9000,
    organiserName: 'MSSN Lagos',
    contacts: { phone: '+234 805 111 2233', instagram: 'mssnlagos' },
    attributes: {
      audience: 'sisters',
      registration_required: true,
      halal_catering: true,
      prayer_space: true,
      language: ['english', 'yoruba'],
    },
  },
};

export function placeholderEvent(id: string | undefined): EventDetail {
  return (id ? PLACEHOLDER_EVENTS_BY_ID[id] : undefined) ?? PLACEHOLDER_EVENTS_BY_ID.e1;
}

/**
 * Formats the run of an event for the "When" block.
 *
 * Written against ISO strings because that is what timestamptz will give us.
 * A same-day event collapses to one date with a time range; a multi-day one
 * shows both dates, since "25 Dec – 31 Dec" is the fact that matters and a
 * time range would be misleading across days.
 */
export function formatEventWhen(startsAt: string, endsAt?: string): { date: string; time?: string } {
  const start = new Date(startsAt);
  const end = endsAt ? new Date(endsAt) : undefined;

  const d = (x: Date) =>
    x.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'long', year: 'numeric' });
  const t = (x: Date) => x.toLocaleTimeString('en-GB', { hour: 'numeric', minute: '2-digit', hour12: true });

  if (!end) return { date: d(start), time: t(start) };

  const sameDay = start.toDateString() === end.toDateString();
  if (sameDay) return { date: d(start), time: `${t(start)} – ${t(end)}` };

  return { date: `${d(start)} – ${d(end)}` };
}
