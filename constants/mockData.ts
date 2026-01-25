export interface Category {
  id: string;
  name: string;
  icon: string; // Emoji fallback
  image?: any; // require() image for card background
  color: string;
  textColor?: string; // Text color, defaults to white
}

export interface Location {
  id: string;
  name: string;
  address: string;
  distance: string;
  type: 'Mosque' | 'School' | 'Event' | 'Halal Food';
  tags: string[];
  coordinate: {
    latitude: number;
    longitude: number;
  };
  image: string;
}

// Category card images from assets
const CATEGORY_IMAGES = {
  mosque: require('../assets/images/app/mosque.png'),
  school: require('../assets/images/app/school.png'),
  event: require('../assets/images/app/event.png'),
};

export const CATEGORIES: Category[] = [
  {
    id: '1',
    name: 'Mosques',
    icon: '🕌',
    image: CATEGORY_IMAGES.mosque,
    color: '#59B56C',
  },
  {
    id: '2',
    name: 'Islamic Schools',
    icon: '📚',
    image: CATEGORY_IMAGES.school,
    color: '#8252A8',
  },
  {
    id: '3',
    name: 'Events',
    icon: '📅',
    image: CATEGORY_IMAGES.event,
    color: '#FFA441',
    textColor: '#804200',
  },
  {
    id: '4',
    name: 'Halal Food',
    icon: '🍲',
    color: '#E67E22',
  },
];

export const LOCATIONS: Location[] = [
  {
    id: '1',
    name: 'Rabiat Aliu Mosque',
    address: '10, Dele Ojewole Street',
    distance: '1.2km away',
    type: 'Mosque',
    tags: ['Jummuah', '+3'],
    coordinate: {
      latitude: 6.6018,
      longitude: 3.3515,
    },
    image: 'https://images.unsplash.com/photo-1564769625906-8c946f04772b?q=80&w=300&auto=format&fit=crop',
  },
  {
    id: '2',
    name: 'Gentle Pearls Schools',
    address: '15, Baruwa Road, Ipaja',
    distance: '2.5km away',
    type: 'School',
    tags: ['Tahfeez', 'Nursery'],
    coordinate: {
      latitude: 6.6050,
      longitude: 3.3550,
    },
    image: 'https://images.unsplash.com/photo-1509062522246-3755977927d7?q=80&w=300&auto=format&fit=crop',
  },
  {
    id: '3',
    name: 'Usoolul-Iman Tahfeez School',
    address: '3, Rahman Asad road, Lagos',
    distance: '1.2km away',
    type: 'School',
    tags: ['Tahfeez', '+3'],
    coordinate: {
      latitude: 6.5980,
      longitude: 3.3480,
    },
    image: 'https://images.unsplash.com/photo-1580974511812-4b71978d3617?q=80&w=300&auto=format&fit=crop',
  },
  {
    id: '4',
    name: 'Mercyland Ifelodun Central Mosque',
    address: '22, Ibrahim Babangida Road',
    distance: '2.0km away',
    type: 'Mosque',
    tags: ['Jummuah'],
    coordinate: {
      latitude: 6.6100,
      longitude: 3.3600,
    },
    image: 'https://images.unsplash.com/photo-1552069705-3b092289656f?q=80&w=300&auto=format&fit=crop',
  },
];
