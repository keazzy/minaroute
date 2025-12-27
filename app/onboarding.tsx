import * as Storage from '@/constants/storage';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import React, { useCallback } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const ASSETS = {
  illustration: 'https://www.figma.com/api/mcp/asset/9a40516a-c097-4d3b-a286-0d7c01d2cfec',
};

const ONBOARDING_SEEN_KEY = 'onboarding_seen_v1';

export default function OnboardingScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const handleStart = useCallback(async () => {
    await Storage.setItemAsync(ONBOARDING_SEEN_KEY, '1');
    router.replace('/permission');
  }, [router]);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.content}>
        <View style={styles.textContainer}>
          <Text style={styles.title}>Minnaroute</Text>
          <Text style={styles.subtitle}>Find Muslim-friendly places wherever you go</Text>
        </View>

        <View style={styles.illustrationContainer}>
          <Image source={{ uri: ASSETS.illustration }} style={styles.illustration} contentFit="contain" />
        </View>

        <Text style={styles.privacyText}>
          By using islam finder, you agree to our Terms of Services and Privacy Policy
        </Text>

        <View style={styles.buttonsContainer}>
          <TouchableOpacity style={styles.primaryButton} onPress={() => void handleStart()} activeOpacity={0.8}>
            <Text style={styles.primaryButtonText}>Start</Text>
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
    marginTop: 100,
    alignItems: 'center',
    gap: 7,
  },
  title: {
    fontSize: 32,
    color: '#FFFFFF',
    textAlign: 'center',
    letterSpacing: -0.8,
    fontFamily: 'Quicksand_700Bold',
  },
  subtitle: {
    fontSize: 16,
    lineHeight: 24,
    color: '#FFFFFF',
    textAlign: 'center',
    letterSpacing: -0.08,
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
    maxWidth: 252,
    letterSpacing: 0.14,
    fontFamily: 'Quicksand_500Medium',
  },
  buttonsContainer: {
    width: '100%',
    paddingHorizontal: 0,
    paddingVertical: 10,
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
    color: '#0C0C0F',
    textAlign: 'center',
    fontFamily: 'Quicksand_500Medium',
  },
});
