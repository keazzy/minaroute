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
 * Imagery reuses the three bundled app images rather than pulling stock photos,
 * so nothing here carries a licensing question.
 */
import type { DiscoveryCardItem } from './DiscoveryCard';

const MOSQUE = require('../../../assets/images/app/mosque.png');
const SCHOOL = require('../../../assets/images/app/school.png');
const EVENT = require('../../../assets/images/app/event.png');

export const PLACEHOLDER_PROMO_IMAGE = MOSQUE;

/** "Places around you" — rating badge + distance, no price. */
export const PLACEHOLDER_PLACES: DiscoveryCardItem[] = [
  {
    id: 'p1',
    title: 'Mosadoluwa Ratibi Mosque',
    image: MOSQUE,
    photoCount: 5,
    badgeValue: '9.0',
    badgeCaption: 'One of the best (1 source)',
    footerLead: '2.4 km from you',
  },
  {
    id: 'p2',
    title: 'Usoolul-iman school, Agege',
    image: SCHOOL,
    photoCount: 3,
    badgeValue: '8.6',
    badgeCaption: 'Highly rated (2 sources)',
    footerLead: '5.1 km from you',
  },
  {
    id: 'p3',
    // No rating — the badge must disappear entirely, not render a zero.
    title: 'Lekki Central Mosque',
    image: MOSQUE,
    photoCount: 1,
    footerLead: '11.8 km from you',
  },
];

/** "Events coming up soon" — attendance badge, tall imagery. */
export const PLACEHOLDER_EVENTS: DiscoveryCardItem[] = [
  {
    id: 'e1',
    title: 'MSSN Lagos 115th Islamic Vacation Course',
    image: EVENT,
    photoCount: 4,
    badgeValue: '5,000',
    badgeCaption: 'People attending',
    footerLead: 'Epe · 25 Dec',
    footerValue: 'from ₦9,000',
  },
  {
    id: 'e2',
    title: 'Ibn Awf Conference',
    image: EVENT,
    photoCount: 2,
    badgeValue: '652',
    badgeCaption: 'People attending',
    footerLead: 'Ikorodu · 1 Aug',
    footerValue: 'Free',
  },
  {
    id: 'e3',
    title: '1Ummah Peace & Unity Convention',
    image: MOSQUE,
    photoCount: 3,
    footerLead: 'Lagos · 14 Nov',
    footerValue: 'Free',
  },
];

/** "Things to do this weekend in Lagos" — two-line titles, price-led footer. */
export const PLACEHOLDER_ACTIVITIES: DiscoveryCardItem[] = [
  {
    id: 'a1',
    title: 'Halal cooking class for beginners in Surulere',
    image: EVENT,
    photoCount: 5,
    badgeValue: '9.0',
    badgeCaption: 'Exceptional (21 reviews)',
    footerLead: 'from',
    footerValue: '₦12,000/person',
  },
  {
    id: 'a2',
    title: 'Family day at Lekki Conservation Centre',
    image: SCHOOL,
    photoCount: 2,
    badgeValue: '8.2',
    badgeCaption: 'Very good (8 reviews)',
    footerLead: 'from',
    footerValue: '₦5,000/person',
  },
];
