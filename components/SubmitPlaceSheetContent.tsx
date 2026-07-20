// Android/Web - React Native content for the Submit Place sheet
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Image } from 'expo-image';
import React, { useMemo } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

type Props = {
  onSubmitPress: () => void;
};

const ASSETS = {
  submitPlaceImage: require('../assets/images/app/event.png'),
};

const STEPS = [
  { num: '1', title: 'Click the submit place button', subtitle: 'This starts the process of submission' },
  { num: '2', title: 'Enter the name of the place', subtitle: 'If available this would help people find the places or event easily.' },
  { num: '3', title: 'Select a category', subtitle: 'Helps us to categorize your submission correctly' },
  { num: '4', title: 'Add a description if available', subtitle: 'Optional, but helps others learn more about the place or event' },
  { num: '5', title: 'Add photos', subtitle: 'Upload photos of the place or event.' },
  { num: '6', title: 'Provide tags relevant to the place', subtitle: 'These help others find what they are looking for.' },
];

export function SubmitPlaceSheetContent({ onSubmitPress }: Props) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const dynamicStyles = useMemo(() => ({
    title: { color: isDark ? '#fff' : '#000' },
    subtitle: { color: isDark ? '#9BA1A6' : '#454745' },
    sectionTitle: { color: isDark ? '#fff' : '#000' },
    stepBadge: { backgroundColor: isDark ? '#fff' : '#000' },
    stepBadgeText: { color: isDark ? '#000' : '#fff' },
    stepTitle: { color: isDark ? '#fff' : '#000' },
    stepSubtitle: { color: isDark ? '#9BA1A6' : '#454745' },
  }), [isDark]);

  return (
    <ScrollView
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      bounces={false}
    >
      <View style={styles.header}>
        <Text style={[styles.title, dynamicStyles.title]}>Submit a place</Text>
        <Text style={[styles.subtitle, dynamicStyles.subtitle]}>
          We are building a directory for all muslims and your help would go a long way
        </Text>
      </View>

      <View style={styles.imageWrap}>
        <Image source={ASSETS.submitPlaceImage} style={styles.image} />
      </View>

      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, dynamicStyles.sectionTitle]}>How to submit a place</Text>
      </View>

      <View style={styles.steps}>
        {STEPS.map((step) => (
          <View key={step.num} style={styles.stepRow}>
            <View style={[styles.stepBadge, dynamicStyles.stepBadge]}>
              <Text style={[styles.stepBadgeText, dynamicStyles.stepBadgeText]}>{step.num}</Text>
            </View>
            <View style={styles.stepTextWrap}>
              <Text style={[styles.stepTitle, dynamicStyles.stepTitle]}>{step.title}</Text>
              <Text style={[styles.stepSubtitle, dynamicStyles.stepSubtitle]}>{step.subtitle}</Text>
            </View>
          </View>
        ))}
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.button} onPress={onSubmitPress} activeOpacity={0.9}>
          <Text style={styles.buttonText}>Submit place</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingBottom: 24,
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 16,
    alignItems: 'center',
    gap: 4,
  },
  title: {
    fontSize: 26,
    lineHeight: 32,
    color: '#000',
    fontFamily: 'Quicksand_700Bold',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 20,
    color: '#454745',
    fontFamily: 'Quicksand_500Medium',
    textAlign: 'center',
    maxWidth: 295,
  },
  imageWrap: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  image: {
    width: '100%',
    height: 183,
    borderRadius: 14,
    backgroundColor: '#f2f2f2',
  },
  sectionHeader: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 22,
    lineHeight: 28,
    color: '#000',
    fontFamily: 'Quicksand_700Bold',
    textAlign: 'center',
  },
  steps: {
    paddingHorizontal: 16,
    paddingTop: 8,
    gap: 24,
  },
  stepRow: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'flex-start',
  },
  stepBadge: {
    width: 32,
    height: 32,
    borderRadius: 999,
    backgroundColor: '#000',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepBadgeText: {
    fontSize: 16,
    color: '#fff',
    fontFamily: 'Quicksand_700Bold',
  },
  stepTextWrap: {
    flex: 1,
    gap: 4,
  },
  stepTitle: {
    fontSize: 16,
    lineHeight: 24,
    color: '#000',
    fontFamily: 'Quicksand_700Bold',
  },
  stepSubtitle: {
    fontSize: 14,
    lineHeight: 22,
    color: '#454745',
    fontFamily: 'Quicksand_500Medium',
  },
  buttonContainer: {
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 12,
  },
  button: {
    height: 48,
    borderRadius: 999,
    backgroundColor: '#0C6FF9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    fontSize: 16,
    color: '#fff',
    fontFamily: 'Quicksand_500Medium',
  },
});
