import { supabase } from '@/lib/supabase';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

type SuggestionRow = {
  id: string;
  type: 'place' | 'event';
  title: string;
  description: string | null;
  category: string | null;
  tags: string[] | null;
  location_name: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  latitude: number | null;
  longitude: number | null;
  contact_info: string | null;
  submitted_by: string | null;
  approved: boolean | null;
  created_at: string | null;
};

export default function AdminSuggestions() {
  const [loading, setLoading] = useState(true);
  const [workingId, setWorkingId] = useState<string | null>(null);
  const [rows, setRows] = useState<SuggestionRow[]>([]);
  const [error, setError] = useState('');

  const pending = useMemo(() => rows.filter((r) => !r.approved), [rows]);

  const load = useCallback(async () => {
    if (Platform.OS !== 'web') return;

    setLoading(true);
    setError('');

    try {
      const { data, error: selectError } = await supabase
        .from('suggestions')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(200);

      if (selectError) {
        setError(selectError.message);
        setRows([]);
        return;
      }

      setRows((data as SuggestionRow[]) ?? []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const approve = useCallback(
    async (row: SuggestionRow) => {
      if (Platform.OS !== 'web') return;

      setWorkingId(row.id);
      setError('');
      try {
        const { error: rpcError } = await supabase.rpc('approve_suggestion', {
          p_suggestion_id: row.id,
        });

        if (rpcError) {
          setError(rpcError.message);
          return;
        }

        await load();
      } finally {
        setWorkingId(null);
      }
    },
    [load],
  );

  const remove = useCallback(
    async (row: SuggestionRow) => {
      if (Platform.OS !== 'web') return;

      setWorkingId(row.id);
      setError('');
      try {
        const { error: deleteError } = await supabase.from('suggestions').delete().eq('id', row.id);
        if (deleteError) {
          setError(deleteError.message);
          return;
        }
        await load();
      } finally {
        setWorkingId(null);
      }
    },
    [load],
  );

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
        <Text style={styles.title}>Suggestions</Text>
        <TouchableOpacity style={styles.secondaryButton} onPress={() => void load()} disabled={loading || !!workingId}>
          <Text style={styles.secondaryButtonText}>Refresh</Text>
        </TouchableOpacity>
      </View>

      {!!error && <Text style={styles.error}>{error}</Text>}

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator />
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.listContent}>
          {pending.length === 0 ? <Text style={styles.empty}>No pending suggestions</Text> : null}

          {pending.map((r) => {
            const busy = workingId === r.id;
            return (
              <View key={r.id} style={styles.row}>
                <View style={styles.rowLeft}>
                  <Text style={styles.rowTitle}>{r.title}</Text>
                  <Text style={styles.rowSubtitle}>{r.type}</Text>
                  <Text style={styles.rowMeta}>
                    {r.city ?? ''}
                    {r.city && r.state ? ', ' : ''}
                    {r.state ?? ''}
                  </Text>
                  {!!r.description && <Text style={styles.rowBody}>{r.description}</Text>}
                </View>

                <View style={styles.rowRight}>
                  <TouchableOpacity style={styles.primaryButtonSmall} onPress={() => void approve(r)} disabled={busy}>
                    {busy ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryButtonText}>Approve</Text>}
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.dangerButtonSmall} onPress={() => void remove(r)} disabled={busy}>
                    <Text style={styles.dangerButtonText}>Delete</Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          })}
        </ScrollView>
      )}
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
  empty: {
    fontSize: 13,
    color: '#454745',
    fontFamily: 'Quicksand_500Medium',
  },
  row: {
    borderWidth: 1,
    borderColor: '#EBEBEF',
    borderRadius: 16,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 10,
  },
  rowLeft: {
    flex: 1,
    minWidth: 0,
  },
  rowRight: {
    flexDirection: 'column',
    gap: 8,
    alignItems: 'flex-end',
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
  rowBody: {
    marginTop: 8,
    fontSize: 13,
    color: '#000',
    fontFamily: 'Quicksand_500Medium',
  },
  primaryButtonSmall: {
    height: 34,
    paddingHorizontal: 12,
    borderRadius: 999,
    backgroundColor: '#0C6FF9',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 90,
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 12,
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
    minWidth: 90,
  },
  dangerButtonText: {
    color: '#fff',
    fontSize: 12,
    fontFamily: 'Quicksand_700Bold',
  },
});
