import MapView, { Marker, PROVIDER_DEFAULT, PROVIDER_GOOGLE } from 'react-native-maps';

export type MapViewHandle = {
  animateToRegion: (
    region: {
      latitude: number;
      longitude: number;
      latitudeDelta?: number;
      longitudeDelta?: number;
    },
    durationMs?: number,
  ) => void;
};

export { Marker, PROVIDER_DEFAULT, PROVIDER_GOOGLE };
export default MapView;
