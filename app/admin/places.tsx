import { supabase } from '@/lib/supabase';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
    ActivityIndicator,
    Modal,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TextInputProps,
    TouchableOpacity,
    View,
    useWindowDimensions,
} from 'react-native';

const PAGE_SIZE = 25;

type PlaceRow = {
  id: string;
  name: string;
  category: string;
  description: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  latitude: number | null;
  longitude: number | null;
  tags: string[] | null;
  photos: string[] | null;
  verified: boolean | null;
  source: string | null;
  google_map_link: string | null;
  created_at: string | null;
  updated_at: string | null;
};

type PlaceDraft = {
  name: string;
  category: string;
  description: string;
  address: string;
  city: string;
  state: string;
  latitude: string;
  longitude: string;
  tags: string;
  photos: string;
  verified: boolean;
  source: string;
  google_map_link: string;
};

const emptyDraft: PlaceDraft = {
  name: '',
  category: '',
  description: '',
  address: '',
  city: '',
  state: '',
  latitude: '',
  longitude: '',
  tags: '',
  photos: '',
  verified: false,
  source: 'admin',
  google_map_link: '',
};

function parseList(value: string): string[] | null {
  const items = value
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  return items.length ? items : null;
}

function parseNumberOrNull(value: string): number | null {
  const v = value.trim();
  if (!v) return null;
  const n = Number(v);
  if (Number.isNaN(n)) return null;
  return n;
}

function extractLatLngFromGoogleMapsUrl(value: string): { lat: number; lng: number } | null {
  const url = value.trim();
  if (!url) return null;

  const atMatch = url.match(/@(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/);
  if (atMatch) {
    const lat = Number(atMatch[1]);
    const lng = Number(atMatch[2]);
    if (!Number.isNaN(lat) && !Number.isNaN(lng)) return { lat, lng };
  }

  const queryMatch = url.match(/[?&](?:q|query|ll)=(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/);
  if (queryMatch) {
    const lat = Number(queryMatch[1]);
    const lng = Number(queryMatch[2]);
    if (!Number.isNaN(lat) && !Number.isNaN(lng)) return { lat, lng };
  }

  const placeMatch = url.match(/!3d(-?\d+(?:\.\d+)?)!4d(-?\d+(?:\.\d+)?)/);
  if (placeMatch) {
    const lat = Number(placeMatch[1]);
    const lng = Number(placeMatch[2]);
    if (!Number.isNaN(lat) && !Number.isNaN(lng)) return { lat, lng };
  }

  return null;
}

export default function AdminPlaces() {
  const { width } = useWindowDimensions();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [rows, setRows] = useState<PlaceRow[]>([]);
  const [error, setError] = useState('');

  const [page, setPage] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');

  const [mode, setMode] = useState<'list' | 'create' | 'edit'>('list');
  const [selected, setSelected] = useState<PlaceRow | null>(null);
  const [draft, setDraft] = useState<PlaceDraft>(emptyDraft);

  // Dropdown and Import state
  const [showNewDropdown, setShowNewDropdown] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<{
    success: boolean;
    message: string;
    stats?: { found: number; inserted: number; skipped: number; errors: number };
  } | null>(null);
  const [importForm, setImportForm] = useState({
    locationName: '',
    latitude: '',
    longitude: '',
    radiusMeters: '15000',
    category: 'mosque',
  });

  const modalTitle = useMemo(() => {
    return mode === 'create' ? 'Create Place' : 'Edit Place';
  }, [mode]);

  const totalPages = useMemo(() => {
    return Math.max(1, Math.ceil(totalCount / PAGE_SIZE));
  }, [totalCount]);

  useEffect(() => {
    const t = setTimeout(() => {
      setSearch(searchInput);
      setPage(0);
    }, 250);
    return () => clearTimeout(t);
  }, [searchInput]);

  const load = useCallback(async () => {
    if (Platform.OS !== 'web') return;

    setLoading(true);
    setError('');

    try {
      const safeSearch = search
        .trim()
        .replace(/%/g, '')
        .replace(/,/g, ' ')
        .trim();

      let q = supabase
        .from('places')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false });

      if (safeSearch) {
        const pattern = `%${safeSearch}%`;
        q = q.or(`name.ilike.${pattern},category.ilike.${pattern},address.ilike.${pattern},city.ilike.${pattern},state.ilike.${pattern}`);
      }

      const from = page * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;
      const { data, error: selectError, count } = await q.range(from, to);

      if (selectError) {
        setError(selectError.message);
        setRows([]);
        setTotalCount(0);
        return;
      }

      setRows((data as PlaceRow[]) ?? []);
      setTotalCount(count ?? 0);
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => {
    if (mode !== 'list') return;
    void load();
  }, [load, mode]);

  const startCreate = useCallback(() => {
    setSelected(null);
    setDraft(emptyDraft);
    setMode('create');
    setError('');
  }, []);

  const startEdit = useCallback((row: PlaceRow) => {
    setSelected(row);
    setDraft({
      name: row.name ?? '',
      category: row.category ?? '',
      description: row.description ?? '',
      address: row.address ?? '',
      city: row.city ?? '',
      state: row.state ?? '',
      latitude: row.latitude == null ? '' : String(row.latitude),
      longitude: row.longitude == null ? '' : String(row.longitude),
      tags: (row.tags ?? []).join(', '),
      photos: (row.photos ?? []).join(', '),
      verified: !!row.verified,
      source: row.source ?? 'admin',
      google_map_link: row.google_map_link ?? '',
    });
    setMode('edit');
    setError('');
  }, []);

  const cancelEdit = useCallback(() => {
    setMode('list');
    setSelected(null);
    setDraft(emptyDraft);
    setError('');
  }, []);

  const runImport = useCallback(async () => {
    const lat = parseFloat(importForm.latitude);
    const lng = parseFloat(importForm.longitude);
    const radius = parseInt(importForm.radiusMeters, 10);

    if (!importForm.locationName.trim()) {
      setImportResult({ success: false, message: 'Location name is required' });
      return;
    }
    if (isNaN(lat) || isNaN(lng)) {
      setImportResult({ success: false, message: 'Valid latitude and longitude are required' });
      return;
    }
    if (isNaN(radius) || radius < 1000) {
      setImportResult({ success: false, message: 'Radius must be at least 1000 meters' });
      return;
    }

    setImporting(true);
    setImportResult(null);

    const GOOGLE_PLACES_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_PLACES_API_KEY || '';
    
    if (!GOOGLE_PLACES_API_KEY) {
      setImportResult({ success: false, message: 'EXPO_PUBLIC_GOOGLE_PLACES_API_KEY not configured in .env.local' });
      setImporting(false);
      return;
    }

    try {
      // Get category type for Google Places
      const placeType = importForm.category.toLowerCase() === 'mosque' ? 'mosque' 
        : importForm.category.toLowerCase() === 'school' ? 'school'
        : importForm.category.toLowerCase() === 'restaurant' ? 'restaurant'
        : importForm.category.toLowerCase() === 'hospital' ? 'hospital'
        : 'point_of_interest';

      // Fetch existing google_place_ids to avoid duplicates
      const { data: existingPlaces, error: fetchError } = await supabase
        .from('places')
        .select('google_place_id')
        .not('google_place_id', 'is', null);

      if (fetchError) {
        setImportResult({ success: false, message: `Database error: ${fetchError.message}` });
        setImporting(false);
        return;
      }

      const existingIds = new Set((existingPlaces || []).map((p) => p.google_place_id));

      // Search nearby places
      const nearbyUrl = 'https://places.googleapis.com/v1/places:searchNearby';
      const nearbyBody = {
        includedTypes: [placeType],
        maxResultCount: 20,
        locationRestriction: {
          circle: {
            center: { latitude: lat, longitude: lng },
            radius: radius,
          },
        },
      };

      const nearbyResponse = await fetch(nearbyUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Goog-Api-Key': GOOGLE_PLACES_API_KEY,
          'X-Goog-FieldMask': 'places.id,places.displayName,places.formattedAddress,places.location,places.types',
        },
        body: JSON.stringify(nearbyBody),
      });

      if (!nearbyResponse.ok) {
        const errorText = await nearbyResponse.text();
        setImportResult({ success: false, message: `Google Places API error: ${nearbyResponse.status} - ${errorText}` });
        setImporting(false);
        return;
      }

      const nearbyData = await nearbyResponse.json();
      const nearbyResults = nearbyData.places || [];

      // Text search as backup
      const textUrl = 'https://places.googleapis.com/v1/places:searchText';
      const textBody = {
        textQuery: `${importForm.category.toLowerCase()}s in ${importForm.locationName}`,
        maxResultCount: 20,
      };

      const textResponse = await fetch(textUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Goog-Api-Key': GOOGLE_PLACES_API_KEY,
          'X-Goog-FieldMask': 'places.id,places.displayName,places.formattedAddress,places.location,places.types',
        },
        body: JSON.stringify(textBody),
      });

      let textResults: typeof nearbyResults = [];
      if (textResponse.ok) {
        const textData = await textResponse.json();
        textResults = textData.places || [];
      }

      const combined = [...nearbyResults, ...textResults];
      let skipped = 0;

      // Parse address helper
      const parseAddress = (formattedAddress: string) => {
        const parts = formattedAddress.split(',').map((p) => p.trim());
        let city: string | null = null;
        let state: string | null = null;
        if (parts.length >= 3) {
          city = parts[parts.length - 3] || null;
          const stateZip = parts[parts.length - 2] || '';
          const stateMatch = stateZip.match(/^([A-Z]{2})\s/);
          if (stateMatch) state = stateMatch[1];
        }
        return { city, state };
      };

      // Deduplicate and prepare inserts
      const allPlaces = new Map<string, {
        name: string;
        category: string;
        address: string | null;
        city: string | null;
        state: string | null;
        latitude: number | null;
        longitude: number | null;
        google_place_id: string;
        source: string;
        verified: boolean;
        tags: string[];
      }>();

      for (const place of combined) {
        if (!place.id) continue;
        if (existingIds.has(place.id) || allPlaces.has(place.id)) {
          skipped++;
          continue;
        }
        const { city, state } = parseAddress(place.formattedAddress || '');
        allPlaces.set(place.id, {
          name: place.displayName?.text || `Unknown ${importForm.category}`,
          category: importForm.category,
          address: place.formattedAddress || null,
          city,
          state,
          latitude: place.location?.latitude || null,
          longitude: place.location?.longitude || null,
          google_place_id: place.id,
          source: 'google_places',
          verified: false,
          tags: [],
        });
      }

      if (allPlaces.size === 0) {
        setImportResult({
          success: true,
          message: 'No new places to import. Database is up to date!',
          stats: { found: combined.length, inserted: 0, skipped, errors: 0 },
        });
        setImporting(false);
        return;
      }

      // Insert places
      const placesArray = Array.from(allPlaces.values());
      const { error: insertError } = await supabase.from('places').insert(placesArray);

      if (insertError) {
        setImportResult({
          success: false,
          message: `Insert error: ${insertError.message}`,
          stats: { found: combined.length, inserted: 0, skipped, errors: placesArray.length },
        });
      } else {
        setImportResult({
          success: true,
          message: `Import complete! Inserted ${placesArray.length} ${importForm.category.toLowerCase()}s.`,
          stats: { found: combined.length, inserted: placesArray.length, skipped, errors: 0 },
        });
        void load();
      }
    } catch (err) {
      setImportResult({
        success: false,
        message: err instanceof Error ? err.message : 'Import failed',
      });
    } finally {
      setImporting(false);
    }
  }, [importForm, load]);

  const closeImportModal = useCallback(() => {
    setShowImportModal(false);
    setImportResult(null);
    setImportForm({
      locationName: '',
      latitude: '',
      longitude: '',
      radiusMeters: '15000',
      category: 'mosque',
    });
  }, []);

  const fetchCoords = useCallback(() => {
    const parsed = extractLatLngFromGoogleMapsUrl(draft.google_map_link);
    if (!parsed) {
      setError('Could not parse coordinates from Google Map Link');
      return;
    }

    setError('');
    setDraft((d) => ({
      ...d,
      latitude: String(Number(parsed.lat.toFixed(6))),
      longitude: String(Number(parsed.lng.toFixed(6))),
    }));
  }, [draft.google_map_link]);

  const save = useCallback(async () => {
    if (Platform.OS !== 'web') return;

    const name = draft.name.trim();
    const category = draft.category.trim().toLowerCase();
    if (!name || !category) {
      setError('Name and category are required');
      return;
    }

    setSaving(true);
    setError('');

    const payload = {
      name,
      category,
      description: draft.description.trim() || null,
      address: draft.address.trim() || null,
      city: draft.city.trim() || null,
      state: draft.state.trim() || null,
      latitude: parseNumberOrNull(draft.latitude),
      longitude: parseNumberOrNull(draft.longitude),
      tags: parseList(draft.tags),
      photos: parseList(draft.photos),
      verified: draft.verified,
      source: draft.source.trim() || null,
      google_map_link: draft.google_map_link.trim() || null,
    };

    try {
      if (mode === 'create') {
        const { error: insertError } = await supabase.from('places').insert(payload);
        if (insertError) {
          setError(insertError.message);
          return;
        }
      } else if (mode === 'edit') {
        if (!selected) {
          setError('No row selected');
          return;
        }

        const { error: updateError } = await supabase.from('places').update(payload).eq('id', selected.id);
        if (updateError) {
          setError(updateError.message);
          return;
        }
      }

      await load();
      cancelEdit();
    } finally {
      setSaving(false);
    }
  }, [cancelEdit, draft, load, mode, selected]);

  const remove = useCallback(
    async (row: PlaceRow) => {
      if (Platform.OS !== 'web') return;

      setSaving(true);
      setError('');
      try {
        const { error: deleteError } = await supabase.from('places').delete().eq('id', row.id);
        if (deleteError) {
          setError(deleteError.message);
          return;
        }
        await load();
      } finally {
        setSaving(false);
      }
    },
    [load],
  );

  const Table = useMemo(() => {
    const tableWidth = Math.max(1280, width - 48);

    return (
      <View style={styles.tableWrap}>
        <View style={styles.listToolbar}>
          <TextInput
            value={searchInput}
            onChangeText={setSearchInput}
            placeholder="Search name/category/address/city/state"
            style={styles.searchInput}
          />

          <View style={styles.pagination}>
            <TouchableOpacity
              style={[styles.secondaryButton, (page <= 0 || loading || saving) && styles.buttonDisabled]}
              onPress={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page <= 0 || loading || saving}
            >
              <Text style={styles.secondaryButtonText}>Prev</Text>
            </TouchableOpacity>
            <Text style={styles.paginationText}>
              Page {Math.min(page + 1, totalPages)} / {totalPages}
            </Text>
            <TouchableOpacity
              style={[styles.secondaryButton, (page + 1 >= totalPages || loading || saving) && styles.buttonDisabled]}
              onPress={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
              disabled={page + 1 >= totalPages || loading || saving}
            >
              <Text style={styles.secondaryButtonText}>Next</Text>
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView horizontal contentContainerStyle={styles.tableScrollContent}>
          <View style={[styles.table, { width: tableWidth }]}>
            <View style={[styles.tableRow, styles.tableHeaderRow]}>
              <Text style={[styles.th, styles.colName]}>Name</Text>
              <Text style={[styles.th, styles.colCategory]}>Category</Text>
              <Text style={[styles.th, styles.colAddress]}>Address</Text>
              <Text style={[styles.th, styles.colCity]}>City</Text>
              <Text style={[styles.th, styles.colState]}>State</Text>
              <Text style={[styles.th, styles.colLat]}>Lat</Text>
              <Text style={[styles.th, styles.colLng]}>Lng</Text>
              <Text style={[styles.th, styles.colFlag]}>Verified</Text>
              <Text style={[styles.th, styles.colDate]}>Created</Text>
              <Text style={[styles.th, styles.colActions]}>Actions</Text>
            </View>

            <ScrollView style={styles.tableBody} contentContainerStyle={styles.tableBodyContent}>
              {rows.map((r, idx) => (
                <View key={r.id} style={[styles.tableRow, idx % 2 === 1 && styles.tableRowAlt]}>
                  <Text style={[styles.td, styles.colName]} numberOfLines={1}>
                    {r.name}
                  </Text>
                  <Text style={[styles.td, styles.colCategory]} numberOfLines={1}>
                    {r.category}
                  </Text>
                  <Text style={[styles.td, styles.colAddress]} numberOfLines={1}>
                    {r.address ?? ''}
                  </Text>
                  <Text style={[styles.td, styles.colCity]} numberOfLines={1}>
                    {r.city ?? ''}
                  </Text>
                  <Text style={[styles.td, styles.colState]} numberOfLines={1}>
                    {r.state ?? ''}
                  </Text>
                  <Text style={[styles.td, styles.colLat, r.latitude == null || r.longitude == null ? styles.missingValue : null]} numberOfLines={1}>
                    {r.latitude == null ? '' : r.latitude.toFixed(6)}
                  </Text>
                  <Text style={[styles.td, styles.colLng, r.latitude == null || r.longitude == null ? styles.missingValue : null]} numberOfLines={1}>
                    {r.longitude == null ? '' : r.longitude.toFixed(6)}
                  </Text>
                  <Text style={[styles.td, styles.colFlag]}>{r.verified ? 'Yes' : 'No'}</Text>
                  <Text style={[styles.td, styles.colDate]} numberOfLines={1}>
                    {r.created_at ? new Date(r.created_at).toLocaleDateString() : ''}
                  </Text>
                  <View style={[styles.colActions, styles.actionsCell]}>
                    <TouchableOpacity style={styles.secondaryButtonSmall} onPress={() => startEdit(r)} disabled={saving}>
                      <Text style={styles.secondaryButtonText}>Edit</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.dangerButtonSmall} onPress={() => void remove(r)} disabled={saving}>
                      <Text style={styles.dangerButtonText}>Delete</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))}

              {!loading && rows.length === 0 ? <Text style={styles.emptyText}>No results</Text> : null}
            </ScrollView>
          </View>
        </ScrollView>
      </View>
    );
  }, [loading, page, remove, rows, saving, searchInput, startEdit, totalPages, width]);

  if (Platform.OS !== 'web') {
    return (
      <View style={styles.center}>
        <Text style={styles.title}>Admin is web-only.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Places</Text>
        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.secondaryButton} onPress={() => void load()} disabled={loading || saving || mode !== 'list'}>
            <Text style={styles.secondaryButtonText}>Refresh</Text>
          </TouchableOpacity>
          <View style={styles.dropdownContainer}>
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={() => setShowNewDropdown(!showNewDropdown)}
              disabled={loading || saving || mode !== 'list'}
            >
              <Text style={styles.primaryButtonText}>New ▾</Text>
            </TouchableOpacity>
            {showNewDropdown && (
              <View style={styles.dropdownMenu}>
                <TouchableOpacity
                  style={styles.dropdownItem}
                  onPress={() => {
                    setShowNewDropdown(false);
                    startCreate();
                  }}
                >
                  <Text style={styles.dropdownItemText}>Create New Place</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.dropdownItem}
                  onPress={() => {
                    setShowNewDropdown(false);
                    // TODO: Import from sheet
                    alert('Import from Sheet coming soon!');
                  }}
                >
                  <Text style={styles.dropdownItemText}>Import from Sheet</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.dropdownItem}
                  onPress={() => {
                    setShowNewDropdown(false);
                    setShowImportModal(true);
                  }}
                >
                  <Text style={styles.dropdownItemText}>Import from Maps</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </View>

      {!!error && <Text style={styles.error}>{error}</Text>}

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator />
        </View>
      ) : (
        Table
      )}

      <Modal
        visible={mode !== 'list'}
        transparent
        animationType="fade"
        onRequestClose={cancelEdit}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{modalTitle}</Text>
              <View style={styles.modalHeaderRight}>
                <TouchableOpacity style={styles.secondaryButton} onPress={cancelEdit} disabled={saving}>
                  <Text style={styles.secondaryButtonText}>Close</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.primaryButton} onPress={() => void save()} disabled={saving}>
                  {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryButtonText}>Save</Text>}
                </TouchableOpacity>
              </View>
            </View>

            {!!error && <Text style={styles.error}>{error}</Text>}

            <ScrollView contentContainerStyle={styles.formContent}>
              <Field label="Name" value={draft.name} onChange={(v) => setDraft((d) => ({ ...d, name: v }))} />
              <Field label="Category" value={draft.category} onChange={(v) => setDraft((d) => ({ ...d, category: v }))} />
              <Field label="Description" value={draft.description} onChange={(v) => setDraft((d) => ({ ...d, description: v }))} multiline />
              <Field label="Address" value={draft.address} onChange={(v) => setDraft((d) => ({ ...d, address: v }))} />
              <Field label="City" value={draft.city} onChange={(v) => setDraft((d) => ({ ...d, city: v }))} />
              <Field label="State" value={draft.state} onChange={(v) => setDraft((d) => ({ ...d, state: v }))} />
              <View style={styles.field}>
                <Text style={styles.fieldLabel}>Google Map Link</Text>
                <View style={styles.fieldRow}>
                  <TextInput
                    value={draft.google_map_link}
                    onChangeText={(v) => setDraft((d) => ({ ...d, google_map_link: v }))}
                    style={[styles.input, styles.fieldRowInput]}
                    multiline={false}
                    returnKeyType="done"
                    blurOnSubmit
                    onSubmitEditing={fetchCoords}
                  />
                  <TouchableOpacity style={styles.secondaryButtonSmall} onPress={fetchCoords} disabled={saving}>
                    <Text style={styles.secondaryButtonText}>Fetch coords</Text>
                  </TouchableOpacity>
                </View>
              </View>
              <Field label="Latitude (optional override)" value={draft.latitude} onChange={(v) => setDraft((d) => ({ ...d, latitude: v }))} />
              <Field label="Longitude (optional override)" value={draft.longitude} onChange={(v) => setDraft((d) => ({ ...d, longitude: v }))} />
              <Field label="Tags (comma-separated)" value={draft.tags} onChange={(v) => setDraft((d) => ({ ...d, tags: v }))} />
              <Field label="Photos (comma-separated URLs)" value={draft.photos} onChange={(v) => setDraft((d) => ({ ...d, photos: v }))} multiline />

              <View style={styles.toggleRow}>
                <Text style={styles.fieldLabel}>Verified</Text>
                <TouchableOpacity
                  style={[styles.toggle, draft.verified ? styles.toggleOn : styles.toggleOff]}
                  onPress={() => setDraft((d) => ({ ...d, verified: !d.verified }))}
                >
                  <Text style={styles.toggleText}>{draft.verified ? 'Yes' : 'No'}</Text>
                </TouchableOpacity>
              </View>

              <Field label="Source" value={draft.source} onChange={(v) => setDraft((d) => ({ ...d, source: v }))} />

              {mode === 'edit' && selected && <Text style={styles.meta}>id: {selected.id}</Text>}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Import from Maps Modal */}
      <Modal
        visible={showImportModal}
        transparent
        animationType="fade"
        onRequestClose={closeImportModal}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Import from Google Maps</Text>
              <View style={styles.modalHeaderRight}>
                <TouchableOpacity style={styles.secondaryButton} onPress={closeImportModal} disabled={importing}>
                  <Text style={styles.secondaryButtonText}>Close</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.primaryButton} onPress={() => void runImport()} disabled={importing}>
                  {importing ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryButtonText}>Import</Text>}
                </TouchableOpacity>
              </View>
            </View>

            {importResult && (
              <View style={[styles.importResultBox, importResult.success ? styles.importResultSuccess : styles.importResultError]}>
                <Text style={styles.importResultText}>{importResult.message}</Text>
                {importResult.stats && (
                  <View style={styles.importStats}>
                    <Text style={styles.importStatText}>Found: {importResult.stats.found}</Text>
                    <Text style={styles.importStatText}>Inserted: {importResult.stats.inserted}</Text>
                    <Text style={styles.importStatText}>Skipped: {importResult.stats.skipped}</Text>
                    {importResult.stats.errors > 0 && (
                      <Text style={[styles.importStatText, styles.importStatError]}>Errors: {importResult.stats.errors}</Text>
                    )}
                  </View>
                )}
              </View>
            )}

            <ScrollView contentContainerStyle={styles.formContent}>
              <Field
                label="Location Name (e.g., Ikorodu, Lagos)"
                value={importForm.locationName}
                onChange={(v) => setImportForm((f) => ({ ...f, locationName: v }))}
              />
              <Field
                label="Latitude"
                value={importForm.latitude}
                onChange={(v) => setImportForm((f) => ({ ...f, latitude: v }))}
              />
              <Field
                label="Longitude"
                value={importForm.longitude}
                onChange={(v) => setImportForm((f) => ({ ...f, longitude: v }))}
              />
              <Field
                label="Radius (meters)"
                value={importForm.radiusMeters}
                onChange={(v) => setImportForm((f) => ({ ...f, radiusMeters: v }))}
              />
              <View style={styles.field}>
                <Text style={styles.fieldLabel}>Category</Text>
                <View style={styles.categoryButtons}>
                  {['mosque', 'school', 'restaurant', 'hospital'].map((cat) => (
                    <TouchableOpacity
                      key={cat}
                      style={[
                        styles.categoryButton,
                        importForm.category === cat && styles.categoryButtonActive,
                      ]}
                      onPress={() => setImportForm((f) => ({ ...f, category: cat }))}
                    >
                      <Text
                        style={[
                          styles.categoryButtonText,
                          importForm.category === cat && styles.categoryButtonTextActive,
                        ]}
                      >
                        {cat}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.importHelpBox}>
                <Text style={styles.importHelpTitle}>How to find coordinates:</Text>
                <Text style={styles.importHelpText}>
                  1. Open Google Maps{'\n'}
                  2. Right-click on the center of the area{'\n'}
                  3. Click the coordinates to copy them{'\n'}
                  4. Paste here (format: lat, lng)
                </Text>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

function Field({
  label,
  value,
  onChange,
  multiline,
  onSubmitEditing,
  returnKeyType,
  blurOnSubmit,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  multiline?: boolean;
  onSubmitEditing?: TextInputProps['onSubmitEditing'];
  returnKeyType?: TextInputProps['returnKeyType'];
  blurOnSubmit?: TextInputProps['blurOnSubmit'];
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChange}
        style={[styles.input, multiline && styles.inputMultiline]}
        multiline={multiline}
        onSubmitEditing={onSubmitEditing}
        returnKeyType={returnKeyType}
        blurOnSubmit={blurOnSubmit}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 24,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
    gap: 12,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  title: {
    fontSize: 22,
    color: '#000',
    fontFamily: 'Quicksand_700Bold',
  },
  error: {
    marginBottom: 12,
    fontSize: 13,
    color: '#b00020',
    fontFamily: 'Quicksand_500Medium',
  },
  listContent: {
    paddingBottom: 40,
  },
  listToolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 12,
  },
  searchInput: {
    flex: 1,
    height: 40,
    borderWidth: 1,
    borderColor: '#EBEBEF',
    borderRadius: 12,
    paddingHorizontal: 12,
    fontSize: 13,
    color: '#000',
    fontFamily: 'Quicksand_500Medium',
  },
  pagination: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  paginationText: {
    fontSize: 12,
    color: '#454745',
    fontFamily: 'Quicksand_500Medium',
  },
  tableWrap: {
    flex: 1,
  },
  tableScrollContent: {
    flexGrow: 1,
  },
  table: {
    borderWidth: 1,
    borderColor: '#EBEBEF',
    borderRadius: 16,
    overflow: 'hidden',
  },
  tableBody: {
    maxHeight: 640,
  },
  tableBodyContent: {
    paddingBottom: 16,
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#EBEBEF',
  },
  tableHeaderRow: {
    backgroundColor: '#F9F7F2',
  },
  tableRowAlt: {
    backgroundColor: '#FFFFFF',
  },
  th: {
    fontSize: 12,
    color: '#454745',
    fontFamily: 'Quicksand_700Bold',
  },
  td: {
    fontSize: 13,
    color: '#000',
    fontFamily: 'Quicksand_500Medium',
  },
  colName: {
    width: 260,
    paddingRight: 10,
  },
  colCategory: {
    width: 160,
    paddingRight: 10,
  },
  colAddress: {
    width: 260,
    paddingRight: 10,
  },
  colCity: {
    width: 150,
    paddingRight: 10,
  },
  colState: {
    width: 150,
    paddingRight: 10,
  },
  colLat: {
    width: 120,
    paddingRight: 10,
  },
  colLng: {
    width: 120,
    paddingRight: 10,
  },
  colFlag: {
    width: 90,
    paddingRight: 10,
  },
  colDate: {
    width: 130,
    paddingRight: 10,
  },
  colActions: {
    width: 220,
  },
  actionsCell: {
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'flex-end',
  },
  emptyText: {
    padding: 14,
    fontSize: 13,
    color: '#454745',
    fontFamily: 'Quicksand_500Medium',
  },
  missingValue: {
    color: '#b00020',
  },
  row: {
    borderWidth: 1,
    borderColor: '#EBEBEF',
    borderRadius: 16,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 10,
  },
  rowLeft: {
    flex: 1,
    minWidth: 0,
  },
  rowRight: {
    flexDirection: 'row',
    gap: 8,
  },
  rowTitle: {
    fontSize: 15,
    color: '#000',
    fontFamily: 'Quicksand_700Bold',
  },
  rowSubtitle: {
    marginTop: 2,
    fontSize: 13,
    color: '#454745',
    fontFamily: 'Quicksand_500Medium',
  },
  rowMeta: {
    marginTop: 2,
    fontSize: 12,
    color: '#454745',
    fontFamily: 'Quicksand_500Medium',
  },
  formContent: {
    paddingBottom: 60,
  },
  field: {
    marginBottom: 12,
  },
  fieldRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  fieldRowInput: {
    flex: 1,
  },
  fieldLabel: {
    fontSize: 12,
    color: '#454745',
    fontFamily: 'Quicksand_500Medium',
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: '#EBEBEF',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#000',
    fontFamily: 'Quicksand_500Medium',
  },
  inputMultiline: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  toggleRow: {
    marginTop: 6,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  toggle: {
    height: 36,
    minWidth: 74,
    paddingHorizontal: 12,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toggleOn: {
    backgroundColor: '#0C6FF9',
  },
  toggleOff: {
    backgroundColor: '#EBEBEF',
  },
  toggleText: {
    fontSize: 13,
    color: '#000',
    fontFamily: 'Quicksand_700Bold',
  },
  meta: {
    marginTop: 6,
    fontSize: 12,
    color: '#454745',
    fontFamily: 'Quicksand_500Medium',
  },
  primaryButton: {
    height: 40,
    paddingHorizontal: 14,
    borderRadius: 999,
    backgroundColor: '#0C6FF9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 13,
    fontFamily: 'Quicksand_700Bold',
  },
  secondaryButton: {
    height: 40,
    paddingHorizontal: 14,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#EBEBEF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryButtonSmall: {
    height: 34,
    paddingHorizontal: 12,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#EBEBEF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryButtonText: {
    color: '#000',
    fontSize: 12,
    fontFamily: 'Quicksand_500Medium',
  },
  dangerButtonSmall: {
    height: 34,
    paddingHorizontal: 12,
    borderRadius: 999,
    backgroundColor: '#b00020',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dangerButtonText: {
    color: '#fff',
    fontSize: 12,
    fontFamily: 'Quicksand_700Bold',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCard: {
    width: '100%',
    maxWidth: 720,
    maxHeight: '90%',
    backgroundColor: '#fff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#EBEBEF',
    padding: 16,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 10,
  },
  modalHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  modalTitle: {
    fontSize: 18,
    color: '#000',
    fontFamily: 'Quicksand_700Bold',
  },
  dropdownContainer: {
    position: 'relative',
  },
  dropdownMenu: {
    position: 'absolute',
    top: '100%',
    right: 0,
    marginTop: 4,
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#EBEBEF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    zIndex: 1000,
    minWidth: 180,
  },
  dropdownItem: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#EBEBEF',
  },
  dropdownItemText: {
    fontSize: 13,
    color: '#000',
    fontFamily: 'Quicksand_500Medium',
  },
  importResultBox: {
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  importResultSuccess: {
    backgroundColor: '#e8f5e9',
    borderWidth: 1,
    borderColor: '#4caf50',
  },
  importResultError: {
    backgroundColor: '#ffebee',
    borderWidth: 1,
    borderColor: '#f44336',
  },
  importResultText: {
    fontSize: 13,
    color: '#000',
    fontFamily: 'Quicksand_600SemiBold',
  },
  importStats: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 8,
  },
  importStatText: {
    fontSize: 12,
    color: '#454745',
    fontFamily: 'Quicksand_500Medium',
  },
  importStatError: {
    color: '#b00020',
  },
  categoryButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 6,
  },
  categoryButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#EBEBEF',
    backgroundColor: '#fff',
  },
  categoryButtonActive: {
    backgroundColor: '#000',
    borderColor: '#000',
  },
  categoryButtonText: {
    fontSize: 13,
    color: '#000',
    fontFamily: 'Quicksand_500Medium',
  },
  categoryButtonTextActive: {
    color: '#fff',
  },
  importHelpBox: {
    marginTop: 16,
    padding: 12,
    backgroundColor: '#F9F7F2',
    borderRadius: 8,
  },
  importHelpTitle: {
    fontSize: 13,
    color: '#000',
    fontFamily: 'Quicksand_600SemiBold',
    marginBottom: 6,
  },
  importHelpText: {
    fontSize: 12,
    color: '#454745',
    fontFamily: 'Quicksand_500Medium',
    lineHeight: 18,
  },
});
