import { ADMIN_EMAILS } from '@/constants/admin';
import { supabase } from '@/lib/supabase';
import { Stack, useRouter, useSegments } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function AdminLayout() {
  const router = useRouter();
  const segments = useSegments();
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    if (Platform.OS !== 'web') return;

    let mounted = true;

    const init = async () => {
      const { data } = await supabase.auth.getSession();
      if (!mounted) return;
      setEmail(data.session?.user.email ?? null);
      setLoading(false);
    };

    void init();

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setEmail(session?.user.email ?? null);
    });

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  const isAllowed = useMemo(() => {
    if (!email) return false;
    return ADMIN_EMAILS.map((e) => e.toLowerCase()).includes(email.toLowerCase());
  }, [email]);

  const isLoginRoute = useMemo(() => {
    return segments[0] === 'admin' && segments[1] === 'login';
  }, [segments]);

  useEffect(() => {
    if (Platform.OS !== 'web') return;
    if (loading) return;

    if (!email && !isLoginRoute) {
      router.replace('/admin/login' as any);
      return;
    }

    if (email && isLoginRoute) {
      router.replace('/admin' as any);
    }
  }, [email, isLoginRoute, loading, router]);

  if (Platform.OS !== 'web') {
    return (
      <View style={styles.center}>
        <Text style={styles.title}>Admin is web-only.</Text>
      </View>
    );
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator />
      </View>
    );
  }

  if (isLoginRoute) {
    return (
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="places" />
        <Stack.Screen name="events" />
        <Stack.Screen name="suggestions" />
        <Stack.Screen name="login" />
      </Stack>
    );
  }

  if (email && !isAllowed) {
    return (
      <View style={styles.center}>
        <Text style={styles.title}>Not authorized</Text>
        <Text style={styles.subtitle}>{email}</Text>
        <TouchableOpacity
          style={styles.button}
          onPress={async () => {
            await supabase.auth.signOut();
            router.replace('/admin/login' as any);
          }}
        >
          <Text style={styles.buttonText}>Sign out</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="places" />
      <Stack.Screen name="events" />
      <Stack.Screen name="suggestions" />
      <Stack.Screen name="login" />
    </Stack>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 18,
    color: '#000',
    fontFamily: 'Quicksand_700Bold',
    textAlign: 'center',
  },
  subtitle: {
    marginTop: 8,
    fontSize: 13,
    color: '#454745',
    fontFamily: 'Quicksand_500Medium',
    textAlign: 'center',
  },
  button: {
    marginTop: 16,
    height: 44,
    paddingHorizontal: 16,
    borderRadius: 999,
    backgroundColor: '#0C6FF9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 14,
    fontFamily: 'Quicksand_700Bold',
  },
});
