import { BottomSheetScrollView, NativeSheet, NativeSheetRef } from '@/components/NativeSheet';
import { CATEGORIES } from '@/constants/mockData';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
    ActionSheetIOS,
    ActivityIndicator,
    Keyboard,
    KeyboardAvoidingView,
    Platform,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const SUPABASE_URL = 'https://spjlyhmgqtkcqhpvgxci.supabase.co';
const SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNwamx5aG1ncXRrY3FocHZneGNpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU2MzYzODIsImV4cCI6MjA4MTIxMjM4Mn0.CJz-iTGuoKCmhRQc0vausUPPLR2341GL8JCncMk9i1k';

type SubmissionType = 'place' | 'event';

type PlaceSuggestion = {
  id: string;
  display_name: string;
  lat: string;
  lon: string;
};

function parseSupabaseError(raw: string, status?: number): string {
  const trimmed = (raw || '').trim();
  if (!trimmed) return status ? `Request failed (${status})` : 'Request failed';

  try {
    const json = JSON.parse(trimmed) as any;
    const msg =
      json?.message ||
      json?.error_description ||
      json?.details ||
      json?.hint ||
      json?.code ||
      trimmed;
    const base = String(msg).replace(/\s+/g, ' ').trim();
    return status ? `${base} (${status})` : base;
  } catch {
    const base = trimmed.replace(/\s+/g, ' ').trim();
    return status ? `${base} (${status})` : base;
  }
}

function parseTags(raw: string): string[] {
  const list = raw
    .split(',')
    .map((t) => t.trim())
    .filter(Boolean);

  return Array.from(new Set(list)).slice(0, 5);
}

function useToast() {
  const [visible, setVisible] = useState(false);
  const [message, setMessage] = useState('');
  const hideTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const show = useCallback((msg: string) => {
    setMessage(msg);
    setVisible(true);

    if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current);
    hideTimeoutRef.current = setTimeout(() => {
      setVisible(false);
    }, 2000);
  }, []);

  useEffect(() => {
    return () => {
      if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current);
    };
  }, []);

  return { visible, message, show };
}

export default function SubmitPlaceScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const toast = useToast();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const dynamicColors = useMemo(() => ({
    background: isDark ? '#151718' : '#fff',
    text: isDark ? '#fff' : '#000',
    textSecondary: isDark ? '#9BA1A6' : '#454745',
    border: isDark ? 'rgba(255,255,255,0.12)' : '#EBEBEF',
    inputBg: isDark ? '#2a2a2a' : '#fff',
    placeholder: isDark ? '#9BA1A6' : '#7a7a85',
    noteBg: isDark ? 'rgba(139,69,19,0.15)' : '#FCEFE4',
    noteText: isDark ? '#D4A574' : '#8B4513',
    segmentBg: isDark ? '#2a2a2a' : '#F6F6F9',
    segmentActiveBg: isDark ? '#3a3a3a' : '#fff',
    submitBarBg: isDark ? 'rgba(21,23,24,0.96)' : 'rgba(255,255,255,0.96)',
    sheetBg: isDark ? '#1c1c1e' : '#fff',
  }), [isDark]);

  const categorySheetRef = useRef<NativeSheetRef>(null);
  const pickerSheetSnapPoints = useMemo(() => ['45%'], []);

  const [type, setType] = useState<SubmissionType>('place');
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<string>('');
  const [locationName, setLocationName] = useState('');
  const [city, setCity] = useState('');
  const [stateValue, setStateValue] = useState('Lagos');
  const [description, setDescription] = useState('');
  const [tagsRaw, setTagsRaw] = useState('');

  const [addressQuery, setAddressQuery] = useState('');
  const [selectedAddress, setSelectedAddress] = useState<string>('');
  const [coords, setCoords] = useState<{ latitude: number; longitude: number } | null>(null);

  const [submitting, setSubmitting] = useState(false);

  const [addressSuggestions, setAddressSuggestions] = useState<PlaceSuggestion[]>([]);
  const [addressLoading, setAddressLoading] = useState(false);

  const showAddressDropdown = useMemo(() => {
    return type === 'place' && !!addressQuery.trim() && addressSuggestions.length > 0;
  }, [addressQuery, addressSuggestions.length, type]);

  useEffect(() => {
    if (type !== 'place') return;

    const q = addressQuery.trim();
    if (q.length < 3) {
      setAddressSuggestions([]);
      return;
    }

    let cancelled = false;

    const t = setTimeout(() => {
      const run = async () => {
        try {
          setAddressLoading(true);
          const url = `https://nominatim.openstreetmap.org/search?format=json&countrycodes=ng&limit=5&q=${encodeURIComponent(q)}`;
          const res = await fetch(url);
          const json = (await res.json()) as any;
          if (cancelled) return;

          const list = Array.isArray(json) ? json : [];
          const mapped: PlaceSuggestion[] = list
            .map((p: any) => ({
              id: String(p?.place_id ?? p?.osm_id ?? ''),
              display_name: String(p?.display_name ?? ''),
              lat: String(p?.lat ?? ''),
              lon: String(p?.lon ?? ''),
            }))
            .filter((p: PlaceSuggestion) => p.id && p.display_name && p.lat && p.lon);

          setAddressSuggestions(mapped.slice(0, 5));
        } catch {
          if (!cancelled) setAddressSuggestions([]);
        } finally {
          if (!cancelled) setAddressLoading(false);
        }
      };

      void run();
    }, 250);

    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [addressQuery, type]);

  const pickAddress = useCallback(
    async (suggestion: PlaceSuggestion) => {
      setSelectedAddress(suggestion.display_name);
      setAddressQuery(suggestion.display_name);
      setAddressSuggestions([]);
      Keyboard.dismiss();

      const lat = Number.parseFloat(suggestion.lat);
      const lon = Number.parseFloat(suggestion.lon);
      if (Number.isFinite(lat) && Number.isFinite(lon)) {
        setCoords({ latitude: lat, longitude: lon });
      }
    },
    []
  );

  const canSubmit = useMemo(() => {
    return !!type && !!title.trim() && !!city.trim() && !submitting;
  }, [city, submitting, title, type]);

  const categoryOptions = useMemo(() => {
    if (type === 'event') {
      return ['Lecture', 'Conference', 'Training'];
    }
    return CATEGORIES.map((c) => c.name);
  }, [type]);

  useEffect(() => {
    if (type === 'event') {
      setSelectedAddress('');
      setAddressQuery('');
      setCoords(null);
      setAddressSuggestions([]);
      setAddressLoading(false);
    }
  }, [type]);

  const submit = useCallback(async () => {
    if (!canSubmit) return;

    setSubmitting(true);

    try {
      const basePayload = {
        type,
        title: title.trim(),
        category: category || null,
        city: city.trim(),
        state: stateValue.trim() || null,
        description: description.trim() || null,
        tags: parseTags(tagsRaw),
        location_name: locationName.trim() || null,
      };

      const payload =
        type === 'place'
          ? {
              ...basePayload,
              address: (selectedAddress || addressQuery).trim() || null,
              latitude: coords?.latitude ?? null,
              longitude: coords?.longitude ?? null,
            }
          : basePayload;

      const doSubmit = async (body: any) => {
        const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/submit_suggestion`, {
          method: 'POST',
          headers: {
            apikey: SUPABASE_ANON_KEY,
            Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
            'Content-Type': 'application/json',
            Prefer: 'return=minimal',
          },
          body: JSON.stringify(body),
        });

        if (res.ok) return;

        const raw = await res.text();
        throw new Error(parseSupabaseError(raw, res.status));
      };

      try {
        await doSubmit(payload);
      } catch {
        // If schema rejects optional fields, retry with a minimal payload.
        const minimal: any = {
          type: basePayload.type,
          title: basePayload.title,
          category: basePayload.category,
          city: basePayload.city,
          state: basePayload.state,
          description: basePayload.description,
          tags: basePayload.tags,
        };

        if (type === 'place') {
          minimal.address = (selectedAddress || addressQuery).trim() || null;
          minimal.latitude = coords?.latitude ?? null;
          minimal.longitude = coords?.longitude ?? null;
        }

        try {
          await doSubmit(minimal);
        } catch (e2) {
          const msg = e2 instanceof Error ? e2.message : 'Failed';
          throw new Error(msg);
        }
      }

      toast.show("Thank you! we'll review this.");

      setTimeout(() => {
        router.back();
      }, 600);
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Something went wrong. Please try again.';
      const compact = String(msg).replace(/\s+/g, ' ').trim();
      toast.show(compact.length > 200 ? compact.slice(0, 200) : compact);
    } finally {
      setSubmitting(false);
    }
  }, [addressQuery, canSubmit, category, city, coords?.latitude, coords?.longitude, description, locationName, router, selectedAddress, stateValue, tagsRaw, title, toast, type]);

  const openCategorySheet = useCallback(() => {
    Keyboard.dismiss();
    if (Platform.OS === 'ios') {
      const options = ['Select category', ...categoryOptions, 'Cancel'];
      const cancelButtonIndex = options.length - 1;
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options,
          cancelButtonIndex,
        },
        (buttonIndex) => {
          if (buttonIndex === 0) setCategory('');
          const idx = buttonIndex - 1;
          if (idx >= 0 && idx < categoryOptions.length) {
            setCategory(categoryOptions[idx]);
          }
        }
      );
      return;
    }
    categorySheetRef.current?.present();
  }, [categoryOptions]);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: dynamicColors.background }]}>
      <View style={[styles.header, { paddingTop: 8 }]}>
        <TouchableOpacity style={styles.headerIconButton} onPress={() => router.back()} activeOpacity={0.85}>
          <Text style={[styles.headerIcon, { color: dynamicColors.text }]}>←</Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: dynamicColors.text }]}>Submit a place</Text>
        <View style={styles.headerIconButton} />
      </View>

      <View style={[styles.noteWrap, { backgroundColor: dynamicColors.noteBg }]}>
        <Text style={[styles.noteText, { color: dynamicColors.noteText }]}>
          Note: Places you submit will be verified by the team to ensure accuracy and avoid data duplication. If a place you submit already
          exist we would review and update with the latest correct information.
        </Text>
      </View>

      <KeyboardAvoidingView
        style={styles.keyboardAvoid}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? insets.top : 0}
      >
        <View style={styles.body}>
          <ScrollView
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
            contentContainerStyle={[styles.formContent, { paddingBottom: Math.max(insets.bottom, 16) + 170 }]}
            showsVerticalScrollIndicator={false}
          >

            <View style={styles.field}>
              <Text style={[styles.label, { color: dynamicColors.text }]}>Type *</Text>
              <View style={[styles.segmentWrap, { backgroundColor: dynamicColors.segmentBg, borderColor: dynamicColors.border }]}>
                <TouchableOpacity
                  style={[styles.segmentItem, type === 'place' && [styles.segmentItemActive, { backgroundColor: dynamicColors.segmentActiveBg }]]}
                  onPress={() => setType('place')}
                  activeOpacity={0.85}
                >
                  <Text style={[styles.segmentText, { color: dynamicColors.textSecondary }, type === 'place' && styles.segmentTextActive]}>Place</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.segmentItem, type === 'event' && [styles.segmentItemActive, { backgroundColor: dynamicColors.segmentActiveBg }]]}
                  onPress={() => setType('event')}
                  activeOpacity={0.85}
                >
                  <Text style={[styles.segmentText, { color: dynamicColors.textSecondary }, type === 'event' && styles.segmentTextActive]}>Event</Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.field}>
              <Text style={[styles.label, { color: dynamicColors.text }]}>Title *</Text>
              <TextInput
                value={title}
                onChangeText={setTitle}
                placeholder="name/title"
                placeholderTextColor={dynamicColors.placeholder}
                style={[styles.input, { backgroundColor: dynamicColors.inputBg, borderColor: dynamicColors.border, color: dynamicColors.text }]}
              />
            </View>

            <View style={styles.field}>
              <Text style={[styles.label, { color: dynamicColors.text }]}>Category</Text>
            <View style={styles.categoryRow}>
              <TextInput
                value={category}
                onChangeText={setCategory}
                placeholder={type === 'event' ? 'Lecture, conference…' : 'Mosque, halal food…'}
                placeholderTextColor={dynamicColors.placeholder}
                style={[styles.input, styles.categoryInput, { backgroundColor: dynamicColors.inputBg, borderColor: dynamicColors.border, color: dynamicColors.text }]}
              />
              <TouchableOpacity style={[styles.categoryPickButton, { backgroundColor: dynamicColors.inputBg, borderColor: dynamicColors.border }]} onPress={openCategorySheet} activeOpacity={0.85}>
                <Text style={styles.categoryPickButtonText}>Pick</Text>
              </TouchableOpacity>
            </View>
            </View>

          <View style={styles.field}>
            <Text style={[styles.label, { color: dynamicColors.text }]}>Location name (optional)</Text>
            <TextInput
              value={locationName}
              onChangeText={setLocationName}
              placeholder={type === 'event' ? 'Venue name' : 'Location name'}
              placeholderTextColor={dynamicColors.placeholder}
              style={[styles.input, { backgroundColor: dynamicColors.inputBg, borderColor: dynamicColors.border, color: dynamicColors.text }]}
            />
          </View>

          <View style={styles.field}>
            <Text style={[styles.label, { color: dynamicColors.text }]}>City *</Text>
            <TextInput value={city} onChangeText={setCity} placeholder="City" placeholderTextColor={dynamicColors.placeholder} style={[styles.input, { backgroundColor: dynamicColors.inputBg, borderColor: dynamicColors.border, color: dynamicColors.text }]} />
          </View>

          <View style={styles.field}>
            <Text style={[styles.label, { color: dynamicColors.text }]}>State</Text>
            <TextInput value={stateValue} onChangeText={setStateValue} placeholder="State" placeholderTextColor={dynamicColors.placeholder} style={[styles.input, { backgroundColor: dynamicColors.inputBg, borderColor: dynamicColors.border, color: dynamicColors.text }]} />
          </View>

          <View style={styles.field}>
            <Text style={[styles.label, { color: dynamicColors.text }]}>Description</Text>
            <TextInput
              value={description}
              onChangeText={setDescription}
              placeholder="Description"
              placeholderTextColor={dynamicColors.placeholder}
              style={[styles.input, styles.multiline, { backgroundColor: dynamicColors.inputBg, borderColor: dynamicColors.border, color: dynamicColors.text }]}
              multiline
            />
          </View>

          <View style={styles.field}>
            <Text style={[styles.label, { color: dynamicColors.text }]}>Tags</Text>
            <TextInput
              value={tagsRaw}
              onChangeText={setTagsRaw}
              placeholder="Tags (comma-separated)"
              placeholderTextColor={dynamicColors.placeholder}
              style={[styles.input, { backgroundColor: dynamicColors.inputBg, borderColor: dynamicColors.border, color: dynamicColors.text }]}
            />
            <Text style={[styles.helperText, { color: dynamicColors.textSecondary }]}>Tags (maximum 5). Separate tags by using comma</Text>
          </View>

          {type === 'place' && (
            <View style={styles.field}>
              <Text style={[styles.label, { color: dynamicColors.text }]}>Address (optional)</Text>
              <TextInput
                value={addressQuery}
                onChangeText={(t) => {
                  setAddressQuery(t);
                  setSelectedAddress('');
                  setCoords(null);
                }}
                placeholder="Start typing an address…"
                placeholderTextColor={dynamicColors.placeholder}
                style={[styles.input, { backgroundColor: dynamicColors.inputBg, borderColor: dynamicColors.border, color: dynamicColors.text }]}
              />

              <View style={styles.addressMetaRow}>
                {addressLoading ? <ActivityIndicator size="small" color={dynamicColors.textSecondary} /> : <View style={{ height: 16 }} />}
                <Text style={[styles.addressMetaText, { color: dynamicColors.textSecondary }]}>Suggestions powered by OpenStreetMap</Text>
              </View>

              {showAddressDropdown && (
                <View style={[styles.suggestionsWrap, { borderColor: dynamicColors.border }]}>
                  {addressSuggestions.map((item) => (
                    <TouchableOpacity
                      key={item.id}
                      style={[styles.suggestionItem, { backgroundColor: dynamicColors.inputBg, borderBottomColor: dynamicColors.border }]}
                      onPress={() => void pickAddress(item)}
                      activeOpacity={0.85}
                    >
                      <Text style={[styles.suggestionText, { color: dynamicColors.text }]} numberOfLines={2}>
                        {item.display_name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>
          )}

          </ScrollView>
        </View>

        <View style={[styles.submitBar, { paddingBottom: Math.max(insets.bottom, 16), backgroundColor: dynamicColors.submitBarBg, borderTopColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)' }]}>
          <TouchableOpacity
            onPress={() => void submit()}
            style={[styles.submitButton, !canSubmit && styles.submitButtonDisabled]}
            activeOpacity={0.9}
            disabled={!canSubmit}
          >
            {submitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitButtonText}>Submit place</Text>}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      {toast.visible && (
        <View pointerEvents="none" style={[styles.toastWrap, { bottom: Math.max(insets.bottom, 16) + 74 }]}>
          <View style={styles.toast}>
            <Text style={styles.toastText}>{toast.message}</Text>
          </View>
        </View>
      )}

      <NativeSheet
        ref={categorySheetRef}
        index={0}
        snapPoints={pickerSheetSnapPoints}
        backgroundStyle={[styles.pickerSheetBackground, { backgroundColor: dynamicColors.sheetBg }]}
        enableBackdropDismiss
      >
        <BottomSheetScrollView contentContainerStyle={styles.pickerSheetContent}>
          <Text style={[styles.pickerSheetTitle, { color: dynamicColors.text }]}>Category</Text>

          <TouchableOpacity
            style={[styles.pickerOptionRow, { backgroundColor: dynamicColors.inputBg, borderColor: dynamicColors.border }, !category && styles.pickerOptionRowSelected]}
            onPress={() => {
              setCategory('');
              categorySheetRef.current?.dismiss();
            }}
            activeOpacity={0.85}
          >
            <Text style={[styles.pickerOptionText, { color: dynamicColors.text }]}>Select category</Text>
            {!category && <Text style={styles.pickerOptionCheck}>✓</Text>}
          </TouchableOpacity>

          {categoryOptions.map((name) => (
            <TouchableOpacity
              key={name}
              style={[styles.pickerOptionRow, { backgroundColor: dynamicColors.inputBg, borderColor: dynamicColors.border }, category === name && styles.pickerOptionRowSelected]}
              onPress={() => {
                setCategory(name);
                categorySheetRef.current?.dismiss();
              }}
              activeOpacity={0.85}
            >
              <Text style={[styles.pickerOptionText, { color: dynamicColors.text }]}>{name}</Text>
              {category === name && <Text style={styles.pickerOptionCheck}>✓</Text>}
            </TouchableOpacity>
          ))}
        </BottomSheetScrollView>
      </NativeSheet>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  keyboardAvoid: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 16,
    paddingBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitle: {
    fontSize: 18,
    color: '#000',
    fontFamily: 'Quicksand_700Bold',
  },
  headerIconButton: {
    width: 48,
    height: 48,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerIcon: {
    fontSize: 22,
    color: '#000',
    lineHeight: 22,
  },
  noteWrap: {
    marginHorizontal: 16,
    marginTop: 4,
    padding: 12,
    backgroundColor: '#FCEFE4',
    borderRadius: 12,
  },
  noteText: {
    fontSize: 13,
    lineHeight: 18,
    color: '#8B4513',
    fontFamily: 'Quicksand_500Medium',
  },
  body: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  formContent: {
    flexGrow: 1,
    paddingBottom: 24,
  },
  field: {
    marginBottom: 12,
  },
  label: {
    fontSize: 13,
    color: '#000',
    marginBottom: 6,
    fontFamily: 'Quicksand_700Bold',
  },
  input: {
    height: 56,
    borderWidth: 1,
    borderColor: '#EBEBEF',
    borderRadius: 12,
    paddingHorizontal: 12,
    fontSize: 14,
    color: '#000',
    fontFamily: 'Quicksand_500Medium',
    backgroundColor: '#fff',
  },
  multiline: {
    height: 110,
    paddingTop: 12,
    textAlignVertical: 'top',
  },
  helperText: {
    marginTop: 6,
    fontSize: 12,
    color: '#454745',
    fontFamily: 'Quicksand_500Medium',
  },
  segmentWrap: {
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#EBEBEF',
    backgroundColor: '#F6F6F9',
    flexDirection: 'row',
    padding: 4,
  },
  segmentItem: {
    flex: 1,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  segmentItemActive: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: 'rgba(12,111,249,0.25)',
  },
  segmentText: {
    fontSize: 14,
    color: '#454745',
    fontFamily: 'Quicksand_700Bold',
  },
  segmentTextActive: {
    color: '#0C6FF9',
  },
  categoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  categoryInput: {
    flex: 1,
  },
  categoryPickButton: {
    height: 56,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#EBEBEF',
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryPickButtonText: {
    fontSize: 13,
    color: '#0C6FF9',
    fontFamily: 'Quicksand_700Bold',
  },
  selectInput: {
    height: 56,
    borderWidth: 1,
    borderColor: '#EBEBEF',
    borderRadius: 12,
    paddingHorizontal: 12,
    backgroundColor: '#fff',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  selectInputText: {
    fontSize: 14,
    color: '#000',
    fontFamily: 'Quicksand_500Medium',
  },
  selectInputPlaceholder: {
    color: '#7a7a85',
  },
  selectChevron: {
    fontSize: 18,
    color: '#7a7a85',
    lineHeight: 18,
  },
  submitBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 24,
    paddingTop: 10,
    backgroundColor: 'rgba(255,255,255,0.96)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.06)',
  },
  submitButton: {
    height: 48,
    borderRadius: 999,
    backgroundColor: '#0C6FF9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitButtonDisabled: {
    backgroundColor: 'rgba(12,111,249,0.35)',
  },
  submitButtonText: {
    fontSize: 16,
    color: '#fff',
    fontFamily: 'Quicksand_700Bold',
  },
  toastWrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  toast: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: 'rgba(0,0,0,0.88)',
    borderRadius: 999,
    maxWidth: '90%',
  },
  toastText: {
    color: '#fff',
    fontSize: 13,
    fontFamily: 'Quicksand_500Medium',
  },
  pickerSheetBackground: {
    backgroundColor: '#fff',
    borderRadius: 32,
  },
  bottomSheetIndicator: {
    backgroundColor: 'rgba(0,0,0,0.15)',
  },
  pickerSheetContent: {
    paddingHorizontal: 16,
    paddingTop: 6,
    paddingBottom: 24,
  },
  pickerSheetTitle: {
    fontSize: 16,
    color: '#000',
    fontFamily: 'Quicksand_700Bold',
    marginBottom: 12,
    textAlign: 'center',
  },
  pickerOptionRow: {
    height: 52,
    borderRadius: 14,
    paddingHorizontal: 14,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#EBEBEF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  pickerOptionRowSelected: {
    borderColor: 'rgba(12,111,249,0.45)',
    backgroundColor: 'rgba(12,111,249,0.06)',
  },
  pickerOptionText: {
    fontSize: 14,
    color: '#000',
    fontFamily: 'Quicksand_500Medium',
  },
  pickerOptionCheck: {
    fontSize: 16,
    color: '#0C6FF9',
    fontFamily: 'Quicksand_700Bold',
  },
  suggestionsWrap: {
    borderWidth: 1,
    borderColor: '#EBEBEF',
    borderRadius: 12,
    overflow: 'hidden',
    marginTop: 8,
  },
  suggestionItem: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#EBEBEF',
    backgroundColor: '#fff',
  },
  suggestionText: {
    fontSize: 13,
    color: '#000',
    fontFamily: 'Quicksand_500Medium',
  },
  addressMetaRow: {
    marginTop: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  addressMetaText: {
    marginTop: 6,
    fontSize: 12,
    color: '#454745',
    fontFamily: 'Quicksand_500Medium',
  },
});
