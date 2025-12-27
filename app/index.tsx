import * as Storage from '@/constants/storage';
import * as ExpoLocation from 'expo-location';
import { Redirect } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { View } from 'react-native';

const ONBOARDING_SEEN_KEY = 'onboarding_seen_v1';
const LOCATION_PERMISSION_SKIP_KEY = 'location_permission_skip_v1';

export default function EntryRouter() {
  const [destination, setDestination] = useState<'onboarding' | 'permission' | 'home' | null>(null);

  useEffect(() => {
    let cancelled = false;

    const check = async () => {
      try {
        const seen = await Storage.getItemAsync(ONBOARDING_SEEN_KEY);
        if (cancelled) return;

        if (seen !== '1') {
          setDestination('onboarding');
          return;
        }

        const skipped = await Storage.getItemAsync(LOCATION_PERMISSION_SKIP_KEY);
        if (cancelled) return;
        if (skipped === '1') {
          setDestination('home');
          return;
        }

        const perm = await ExpoLocation.getForegroundPermissionsAsync();
        if (cancelled) return;
        if (perm.status === ExpoLocation.PermissionStatus.GRANTED) {
          setDestination('home');
          return;
        }

        setDestination('permission');
      } catch {
        if (!cancelled) {
          setDestination('onboarding');
        }
      }
    };

    void check();

    return () => {
      cancelled = true;
    };
  }, []);

  if (!destination) {
    return <View style={{ flex: 1, backgroundColor: '#0850FD' }} />;
  }

  return <Redirect href={`/${destination}`} />;
}
