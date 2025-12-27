import React, { forwardRef, useCallback, useEffect, useImperativeHandle, useMemo, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';

type Region = {
  latitude: number;
  longitude: number;
  latitudeDelta?: number;
  longitudeDelta?: number;
};

type MarkerProps = {
  coordinate: { latitude: number; longitude: number };
  title?: string;
  description?: string;
  onPress?: () => void;
  pinColor?: string;
};

type MapProps = {
  style?: any;
  children?: React.ReactNode;
  initialRegion?: Region;
  [key: string]: any;
};

export type MapViewHandle = {
  animateToRegion: (region: Region, durationMs?: number) => void;
};

const PROVIDER_DEFAULT = 'default';
const PROVIDER_GOOGLE = 'google';

function Marker(_props: MarkerProps) {
  return null;
}

export { Marker, PROVIDER_DEFAULT, PROVIDER_GOOGLE };

function zoomFromRegion(region?: Region): number {
  const lngDelta = region?.longitudeDelta;
  if (!lngDelta || lngDelta <= 0) return 13;
  const zoom = Math.log2(360 / lngDelta);
  return Math.max(1, Math.min(18, Math.round(zoom)));
}

function ensureLeafletCss() {
  if (typeof document === 'undefined') return;
  const id = 'leaflet-css';
  if (document.getElementById(id)) return;
  const link = document.createElement('link');
  link.id = id;
  link.rel = 'stylesheet';
  link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
  link.integrity = 'sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=';
  link.crossOrigin = '';
  document.head.appendChild(link);
}

export default forwardRef<MapViewHandle, MapProps>(function MapView({ style, children, initialRegion }: MapProps, ref) {
  const mapRef = useRef<any>(null);
  const [rl, setRl] = useState<null | typeof import('react-leaflet')>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    ensureLeafletCss();

    let canceled = false;
    void import('react-leaflet').then((mod) => {
      if (canceled) return;
      setRl(mod);
    });

    return () => {
      canceled = true;
    };
  }, []);

  const setMapInstance = useCallback((map: any) => {
    mapRef.current = map;
  }, []);

  useImperativeHandle(
    ref,
    () => ({
      animateToRegion: (region: Region, durationMs = 400) => {
        const map = mapRef.current;
        if (!map) return;
        const zoom = zoomFromRegion(region);
        const duration = Math.max(0, durationMs) / 1000;
        map.flyTo([region.latitude, region.longitude], zoom, { animate: true, duration });
      },
    }),
    [],
  );

  const markerNodes = useMemo(() => {
    const items = React.Children.toArray(children);
    return items
      .filter((n): n is React.ReactElement<MarkerProps> => React.isValidElement(n) && n.type === Marker)
      .map((el) => el.props);
  }, [children]);

  if (!rl) {
    return <View style={[styles.mapFallback, style]} />;
  }

  const { MapContainer, TileLayer, CircleMarker, Popup, useMap } = rl;

  const region = initialRegion ?? {
    latitude: 0,
    longitude: 0,
    latitudeDelta: 0.1,
    longitudeDelta: 0.1,
  };

  const center: [number, number] = [region.latitude, region.longitude];
  const zoom = zoomFromRegion(region);

  function MapInstanceCapture({ onMap }: { onMap: (map: any) => void }) {
    const map = useMap();
    useEffect(() => {
      onMap(map);
    }, [map, onMap]);
    return null;
  }

  return (
    <View style={[styles.mapWrapper, style]}>
      <MapContainer center={center} zoom={zoom} style={styles.leafletMap} zoomControl>
        <MapInstanceCapture onMap={setMapInstance} />
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {markerNodes.map((m, idx) => (
          <CircleMarker
            key={`${m.coordinate.latitude},${m.coordinate.longitude},${idx}`}
            center={[m.coordinate.latitude, m.coordinate.longitude]}
            radius={8}
            pathOptions={{ color: m.pinColor ?? 'red', fillColor: m.pinColor ?? 'red', fillOpacity: 0.9 }}
            eventHandlers={{
              click: () => {
                m.onPress?.();
              },
            }}
          >
            {m.title || m.description ? (
              <Popup>
                <div>
                  {m.title ? <div style={{ fontWeight: 700, marginBottom: 4 }}>{m.title}</div> : null}
                  {m.description ? <div style={{ fontSize: 12, opacity: 0.8 }}>{m.description}</div> : null}
                </div>
              </Popup>
            ) : null}
          </CircleMarker>
        ))}
      </MapContainer>
    </View>
  );
});

const styles = StyleSheet.create({
  mapFallback: {
    flex: 1,
    backgroundColor: '#e9e9e9',
  },
  mapWrapper: {
    flex: 1,
  },
  leafletMap: {
    height: '100%',
    width: '100%',
  },
});
