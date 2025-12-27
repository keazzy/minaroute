import React from 'react';
import { StyleSheet, View } from 'react-native';

type MapProps = {
  style?: any;
  children?: React.ReactNode;
  [key: string]: any;
};

const PROVIDER_DEFAULT = 'default';
const PROVIDER_GOOGLE = 'google';

function Marker() {
  return null;
}

export { Marker, PROVIDER_DEFAULT, PROVIDER_GOOGLE };

export default function MapView({ style }: MapProps) {
  return <View style={[styles.mapFallback, style]} />;
}

const styles = StyleSheet.create({
  mapFallback: {
    flex: 1,
    backgroundColor: '#e9e9e9',
  },
});
