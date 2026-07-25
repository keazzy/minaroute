import { createClient } from '@supabase/supabase-js';
import * as SecureStore from 'expo-secure-store';

import { SUPABASE_ANON_KEY, SUPABASE_URL } from './supabase-config';

const storage = {
  getItem: (key: string) => SecureStore.getItemAsync(key),
  setItem: (key: string, value: string) => SecureStore.setItemAsync(key, value),
  removeItem: (key: string) => SecureStore.deleteItemAsync(key),
};

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    storage,
  },
});
