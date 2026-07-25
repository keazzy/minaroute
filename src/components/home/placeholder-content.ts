/**
 * PLACEHOLDER CONTENT — not real data, and not wired to Supabase.
 *
 * Home is being built UI-first: the migrations that make the real sections
 * possible (`places.rating*`, `events.starts_at` and friends) are the next step,
 * and until they land there is nothing to sort "events coming up soon" by. See
 * docs/home-redesign-brief.md § Build order.
 *
 * Swapping this out means replacing these arrays with `useNearbyPlaces()` and
 * `useEvents()` from `@/src/lib/places` — the card shape is deliberately the
 * same as what those hooks return once mapped.
 *
 * ---
 * IMAGE PROVENANCE — read before shipping. Two different licences here:
 *
 *  1. **Pexels** (`mosque-*`, `school-*`, `food-*`): free for commercial use,
 *     no attribution required. Safe to ship. Credits in `CREDITS.md` anyway.
 *  2. **From the Figma** (`event-*`, `place-souq-waqif`, `promo-haram`): the
 *     two event posters are real third-party promotional artwork, complete with
 *     the organisers' QR code and phone numbers. Fine for a demo build; they
 *     must NOT ship as generic app imagery. Real event photos belong in
 *     `events.photos` and come from the organiser — that is exactly what that
 *     column is for. The Haram promo shot also needs its licence confirmed
 *     before release (brief, open question 10).
 */
import type { DiscoveryCardItem } from './DiscoveryCard';

const IMG = {
  mosqueKaduna: require('../../../assets/images/home/mosque-kaduna.jpg'),
  mosqueSuleymaniye: require('../../../assets/images/home/mosque-suleymaniye.jpg'),
  mosqueDome: require('../../../assets/images/home/mosque-dome.jpg'),
  mosqueHassan: require('../../../assets/images/home/mosque-hassan.jpg'),
  mosqueTower: require('../../../assets/images/home/mosque-tower.jpg'),
  mosqueCarpet: require('../../../assets/images/home/mosque-carpet.jpg'),
  mosqueCeiling: require('../../../assets/images/home/mosque-ceiling.jpg'),
  schoolLecture: require('../../../assets/images/home/school-lecture.jpg'),
  schoolHands: require('../../../assets/images/home/school-hands.jpg'),
  schoolOutdoors: require('../../../assets/images/home/school-outdoors.jpg'),
  schoolLaptop: require('../../../assets/images/home/school-laptop.jpg'),
  foodJollof: require('../../../assets/images/home/food-jollof.jpg'),
  foodFlatlay: require('../../../assets/images/home/food-flatlay.jpg'),
  foodStreet: require('../../../assets/images/home/food-street.jpg'),
  foodBuffet: require('../../../assets/images/home/food-buffet.jpg'),
  eventSingleAndSecure: require('../../../assets/images/home/event-single-and-secure.jpg'),
  eventMuslimTechExpo: require('../../../assets/images/home/event-muslim-tech-expo.jpg'),
  event1ummah: require('../../../assets/images/home/event-1ummah-puc.jpg'),
  souqWaqif: require('../../../assets/images/home/place-souq-waqif.jpg'),
  promoHaram: require('../../../assets/images/home/promo-haram.jpg'),
} as const;

export const PLACEHOLDER_PROMO_IMAGE = IMG.promoHaram;

/** "Places around you" — rating badge + distance, no price. */
export const PLACEHOLDER_PLACES: DiscoveryCardItem[] = [
  {
    id: 'p1',
    title: 'Mosadoluwa Ratibi Mosque',
    images: [IMG.mosqueKaduna, IMG.mosqueSuleymaniye, IMG.mosqueDome, IMG.mosqueCarpet],
    badgeValue: '9.0',
    badgeCaption: 'One of the best (1 source)',
    footerLead: '2.4 km from you',
  },
  {
    id: 'p2',
    title: 'Usoolul-iman school, Agege',
    images: [IMG.schoolLecture, IMG.schoolHands, IMG.schoolOutdoors, IMG.schoolLaptop],
    badgeValue: '8.6',
    badgeCaption: 'Highly rated (2 sources)',
    footerLead: '5.1 km from you',
  },
  {
    // No rating — the badge must disappear entirely, not render a zero.
    // Also a single photo, so the dots must not render at all.
    id: 'p3',
    title: 'Lekki Central Mosque',
    images: [IMG.mosqueTower],
    footerLead: '11.8 km from you',
  },
  {
    id: 'p4',
    title: 'Hassan Mosque, Ikoyi',
    images: [IMG.mosqueHassan, IMG.mosqueCeiling, IMG.mosqueDome],
    badgeValue: '9.2',
    badgeCaption: 'Exceptional (4 sources)',
    footerLead: '7.3 km from you',
  },
];

/** "Events coming up soon" — attendance badge, tall poster imagery. */
export const PLACEHOLDER_EVENTS: DiscoveryCardItem[] = [
  {
    id: 'e1',
    title: 'Single & Secure 3.0 — Love in the Age of Algorithm',
    images: [IMG.eventSingleAndSecure, IMG.souqWaqif, IMG.foodBuffet],
    badgeValue: '5,000',
    badgeCaption: 'People attending',
    footerLead: 'Shodex Garden, Ilupeju · 9 Aug',
    footerValue: 'from ₦7,500',
  },
  {
    id: 'e2',
    title: 'Muslim Tech Expo Kenya 2026',
    images: [IMG.eventMuslimTechExpo, IMG.schoolLaptop, IMG.mosqueDome],
    badgeValue: '652',
    badgeCaption: 'People attending',
    footerLead: 'Nairobi · 12 Sep',
    footerValue: 'Free',
  },
  {
    id: 'e3',
    title: '1Ummah Peace & Unity Convention',
    images: [IMG.event1ummah, IMG.mosqueKaduna],
    footerLead: 'Lagos · 14 Nov',
    footerValue: 'Free',
  },
  {
    id: 'e4',
    title: 'MSSN Lagos 115th Islamic Vacation Course',
    images: [IMG.schoolOutdoors, IMG.schoolLecture, IMG.mosqueSuleymaniye],
    badgeValue: '1,200',
    badgeCaption: 'People attending',
    footerLead: 'Epe · 25 Dec',
    footerValue: 'from ₦9,000',
  },
];

/** "Things to do this weekend in Lagos" — two-line titles, price-led footer. */
export const PLACEHOLDER_ACTIVITIES: DiscoveryCardItem[] = [
  {
    id: 'a1',
    title: 'Halal cooking class for beginners in Surulere',
    images: [IMG.foodJollof, IMG.foodFlatlay, IMG.foodStreet, IMG.foodBuffet],
    badgeValue: '9.0',
    badgeCaption: 'Exceptional (21 reviews)',
    footerLead: 'from',
    footerValue: '₦12,000/person',
  },
  {
    id: 'a2',
    title: 'Jollof and grills night market, Lekki',
    images: [IMG.foodStreet, IMG.foodJollof, IMG.foodBuffet],
    badgeValue: '8.2',
    badgeCaption: 'Very good (8 reviews)',
    footerLead: 'from',
    footerValue: '₦5,000/person',
  },
  {
    id: 'a3',
    title: 'Guided heritage walk around Lagos Island mosques',
    images: [IMG.souqWaqif, IMG.mosqueTower, IMG.mosqueHassan],
    badgeValue: '8.8',
    badgeCaption: 'Excellent (13 reviews)',
    footerLead: 'from',
    footerValue: '₦3,500/person',
  },
];
