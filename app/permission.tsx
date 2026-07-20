import * as Storage from '@/constants/storage';
import { Image } from 'expo-image';
import * as ExpoLocation from 'expo-location';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Button, Linking, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const ASSETS = {
  illustration: require('../assets/images/app/illustration.png'),
};

const LOCATION_PERMISSION_SKIP_KEY = 'location_permission_skip_v2';

export default function PermissionScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [status, setStatus] = useState<ExpoLocation.PermissionStatus | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const check = async () => {
      try {
        const skipped = await Storage.getItemAsync(LOCATION_PERMISSION_SKIP_KEY);
        if (cancelled) return;
        if (skipped === '1') {
          router.replace('/(tabs)');
          return;
        }

        const res = await ExpoLocation.getForegroundPermissionsAsync();
        if (cancelled) return;
        setStatus(res.status);
        if (res.status === ExpoLocation.PermissionStatus.GRANTED) {
          await Storage.deleteItemAsync(LOCATION_PERMISSION_SKIP_KEY);
          router.replace('/(tabs)');
        }
      } catch {
        if (!cancelled) {
          setStatus(ExpoLocation.PermissionStatus.DENIED);
        }
      }
    };

    void check();

    return () => {
      cancelled = true;
    };
  }, [router]);

  const handleSkip = useCallback(() => {
    void Storage.setItemAsync(LOCATION_PERMISSION_SKIP_KEY, '1');
    router.replace('/(tabs)');
  }, [router]);

  const handleGrant = useCallback(async () => {
    try {
      setLoading(true);
      const res = await ExpoLocation.requestForegroundPermissionsAsync();
      setStatus(res.status);

      if (res.status === ExpoLocation.PermissionStatus.GRANTED) {
        await Storage.deleteItemAsync(LOCATION_PERMISSION_SKIP_KEY);
        router.replace('/(tabs)');
        return;
      }

      if (res.status === ExpoLocation.PermissionStatus.DENIED) {
        if (Platform.OS === 'ios' || Platform.OS === 'android') {
          void Linking.openSettings();
        }
      }
    } catch {
      if (Platform.OS === 'ios' || Platform.OS === 'android') {
        void Linking.openSettings();
      }
    } finally {
      setLoading(false);
    }
  }, [router]);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.content}>
        <View style={styles.textContainer}>
          <Text style={styles.title}>Allow Location</Text>
          <Text style={styles.subtitle}>It’s how we help you find places that aligns with your value</Text>
        </View>

        <View style={styles.illustrationContainer}>
          <Image source={ASSETS.illustration} style={styles.illustration} contentFit="contain" />
        </View>

        <Text style={styles.privacyText}>
          Location is used according to our Privacy Policy, Turn it off any time in System settings
        </Text>

        <View style={styles.buttonsContainer}>
          {Platform.OS === 'ios' ? (
            <View style={styles.nativeButtonRow}>
              <Button
                title={loading ? 'Granting…' : status === ExpoLocation.PermissionStatus.DENIED ? 'Open Settings' : 'Grant Permission'}
                onPress={() => void handleGrant()}
                disabled={loading}
              />
            </View>
          ) : (
            <TouchableOpacity style={styles.primaryButton} onPress={() => void handleGrant()} disabled={loading} activeOpacity={0.8}>
              {loading ? <ActivityIndicator color="#000" /> : <Text style={styles.primaryButtonText}>Grant Permission</Text>}
            </TouchableOpacity>
          )}

          <TouchableOpacity style={styles.secondaryButton} onPress={handleSkip} disabled={loading} activeOpacity={0.8}>
            <Text style={styles.secondaryButtonText}>Skip for now</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0850FD',
  },
  content: {
    flex: 1,
    paddingHorizontal: 32,
    paddingBottom: 24,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  textContainer: {
    marginTop: 140,
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontSize: 32,
    color: '#FFFFFF',
    textAlign: 'center',
    fontFamily: 'Quicksand_700Bold',
  },
  subtitle: {
    fontSize: 16,
    lineHeight: 24,
    color: '#FFFFFF',
    textAlign: 'center',
    opacity: 0.95,
    fontFamily: 'Quicksand_500Medium',
  },
  illustrationContainer: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  illustration: {
    width: 375,
    height: 316,
  },
  privacyText: {
    fontSize: 14,
    lineHeight: 22,
    color: '#FFFFFF',
    textAlign: 'center',
    maxWidth: 286,
    fontFamily: 'Quicksand_500Medium',
  },
  buttonsContainer: {
    width: '100%',
    gap: 10,
  },
  nativeButtonRow: {
    backgroundColor: '#F9F7F2',
    borderRadius: 999,
    paddingVertical: 2,
    paddingHorizontal: 6,
  },
  primaryButton: {
    backgroundColor: '#F9F7F2',
    borderRadius: 999,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonText: {
    fontSize: 16,
    color: '#000000',
    textAlign: 'center',
    fontFamily: 'Quicksand_500Medium',
  },
  secondaryButton: {
    borderRadius: 999,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryButtonText: {
    fontSize: 16,
    color: '#FFFFFF',
    textAlign: 'center',
    fontFamily: 'Quicksand_500Medium',
  },
});
