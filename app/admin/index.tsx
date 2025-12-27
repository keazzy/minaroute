import { supabase } from '@/lib/supabase';
import { Link } from 'expo-router';
import React from 'react';
import { Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function AdminHome() {
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
        <Text style={styles.title}>Admin</Text>
        <TouchableOpacity style={styles.signOut} onPress={async () => supabase.auth.signOut()}>
          <Text style={styles.signOutText}>Sign out</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.grid}>
        <Link href="/admin/places" asChild>
          <TouchableOpacity style={styles.card}>
            <Text style={styles.cardTitle}>Places</Text>
            <Text style={styles.cardSubtitle}>Create / edit / delete</Text>
          </TouchableOpacity>
        </Link>

        <Link href="/admin/events" asChild>
          <TouchableOpacity style={styles.card}>
            <Text style={styles.cardTitle}>Events</Text>
            <Text style={styles.cardSubtitle}>Create / edit / delete</Text>
          </TouchableOpacity>
        </Link>

        <Link href="/admin/suggestions" asChild>
          <TouchableOpacity style={styles.card}>
            <Text style={styles.cardTitle}>Suggestions</Text>
            <Text style={styles.cardSubtitle}>Approve into places/events</Text>
          </TouchableOpacity>
        </Link>
      </View>
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
    marginBottom: 18,
  },
  title: {
    fontSize: 22,
    color: '#000',
    fontFamily: 'Quicksand_700Bold',
  },
  signOut: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#EBEBEF',
    borderRadius: 999,
  },
  signOutText: {
    fontSize: 13,
    color: '#000',
    fontFamily: 'Quicksand_500Medium',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  card: {
    width: 260,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#EBEBEF',
    padding: 16,
  },
  cardTitle: {
    fontSize: 16,
    color: '#000',
    fontFamily: 'Quicksand_700Bold',
  },
  cardSubtitle: {
    marginTop: 4,
    fontSize: 13,
    color: '#454745',
    fontFamily: 'Quicksand_500Medium',
  },
});
