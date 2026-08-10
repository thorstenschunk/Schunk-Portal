'use client';

import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import type { User } from '@supabase/supabase-js';
import { getSupabaseBrowser } from '@/lib/supabase-browser';
import { apiFetch } from '@/lib/api-client';

type Me = { id: string; email: string | null; full_name: string; roles: string[]; permissions: string[] };
type AuthContextValue = {
  user: User | null;
  me: Me | null;
  accessToken: string;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  has: (permission: string) => boolean;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [me, setMe] = useState<Me | null>(null);
  const [accessToken, setAccessToken] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let subscription: { unsubscribe: () => void } | undefined;
    try {
      const { data } = getSupabaseBrowser().auth.onAuthStateChange((_event, session) => {
        if (session?.access_token) setAccessToken(session.access_token);
        if (!session) { setUser(null); setMe(null); setAccessToken(''); }
      });
      subscription = data.subscription;
    } catch {
      // Konfigurationsfehler wird beim Login sichtbar ausgegeben.
    }
    return () => subscription?.unsubscribe();
  }, []);

  async function login(email: string, password: string) {
    setLoading(true);
    try {
      const { data, error } = await getSupabaseBrowser().auth.signInWithPassword({ email, password });
      if (error || !data.session || !data.user) throw error || new Error('Anmeldung fehlgeschlagen.');
      const profile = await apiFetch<Me>('/api/auth/me', data.session.access_token);
      setUser(data.user);
      setAccessToken(data.session.access_token);
      setMe(profile);
    } catch (e) {
      await getSupabaseBrowser().auth.signOut({ scope: 'local' }).catch(() => undefined);
      setUser(null); setAccessToken(''); setMe(null);
      throw e;
    } finally { setLoading(false); }
  }

  async function logout() {
    await getSupabaseBrowser().auth.signOut({ scope: 'local' }).catch(() => undefined);
    setUser(null); setMe(null); setAccessToken('');
  }

  const value = useMemo<AuthContextValue>(() => ({
    user, me, accessToken, loading, login, logout,
    has: (permission) => !!me && (me.roles.includes('admin') || me.permissions.includes(permission)),
  }), [user, me, accessToken, loading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('AuthProvider fehlt.');
  return ctx;
}
