import { ADMIN_EMAILS } from '@/constants/admin';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'expo-router';
import React, { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, Platform, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

export default function AdminLogin() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');

  const allowlisted = useMemo(() => {
    const normalized = email.trim().toLowerCase();
    if (!normalized) return true;
    return ADMIN_EMAILS.map((e) => e.toLowerCase()).includes(normalized);
  }, [email]);

  const signIn = useCallback(async () => {
    if (Platform.OS !== 'web') return;

    const cleanEmail = email.trim();
    if (!cleanEmail || !password) {
      setError('Enter email and password');
      return;
    }

    if (!allowlisted) {
      setError('Not authorized');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password,
      });

      if (signInError) {
        setError(signInError.message);
        return;
      }

      router.replace('/admin' as any);
    } finally {
      setLoading(false);
    }
  }, [allowlisted, email, password, router]);

  if (Platform.OS !== 'web') {
    return (
      <View style={styles.center}>
        <Text style={styles.title}>Admin is web-only.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>Admin Login</Text>
        <Text style={styles.subtitle}>Email + password</Text>

        {!!error && <Text style={styles.error}>{error}</Text>}

        <TextInput
          value={email}
          onChangeText={setEmail}
          placeholder="Email"
          autoCapitalize="none"
          keyboardType="email-address"
          style={styles.input}
        />
        <TextInput
          value={password}
          onChangeText={setPassword}
          placeholder="Password"
          secureTextEntry
          style={styles.input}
        />

        <TouchableOpacity style={[styles.button, loading && styles.buttonDisabled]} onPress={() => void signIn()} disabled={loading}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Sign in</Text>}
        </TouchableOpacity>

        <Text style={styles.hint}>
          If you can sign in but still can’t CRUD data, add your user id into `public.admin_users`.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    backgroundColor: '#fff',
  },
  card: {
    width: '100%',
    maxWidth: 420,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#EBEBEF',
    padding: 16,
  },
  title: {
    fontSize: 20,
    color: '#000',
    fontFamily: 'Quicksand_700Bold',
  },
  subtitle: {
    marginTop: 4,
    fontSize: 13,
    color: '#454745',
    fontFamily: 'Quicksand_500Medium',
  },
  error: {
    marginTop: 10,
    fontSize: 13,
    color: '#b00020',
    fontFamily: 'Quicksand_500Medium',
  },
  input: {
    marginTop: 12,
    height: 48,
    borderWidth: 1,
    borderColor: '#EBEBEF',
    borderRadius: 12,
    paddingHorizontal: 12,
    fontSize: 14,
    color: '#000',
    fontFamily: 'Quicksand_500Medium',
  },
  button: {
    marginTop: 14,
    height: 48,
    borderRadius: 999,
    backgroundColor: '#0C6FF9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#fff',
    fontSize: 15,
    fontFamily: 'Quicksand_700Bold',
  },
  hint: {
    marginTop: 12,
    fontSize: 12,
    color: '#454745',
    fontFamily: 'Quicksand_500Medium',
  },
});
