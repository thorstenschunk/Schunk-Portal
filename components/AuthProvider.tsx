'use client';

import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import type { Session, User } from '@supabase/supabase-js';
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
  const [loading, setLoading] = useState(true);

  async function applySession(session: Session | null) {
    if (!session?.user || !session.access_token) {
      setUser(null); setMe(null); setAccessToken('');
      return;
    }
    setUser(session.user);
    setAccessToken(session.access_token);
    try {
      const profile = await apiFetch<Me>('/api/auth/me', session.access_token);
      setMe(profile);
    } catch (e) {
      setMe(null);
      throw e;
    }
  }

  useEffect(() => {
    if (!user) return;
    const LIMIT=60*60*1000, KEY='schunk_last_activity';
    let timer:ReturnType<typeof setTimeout>;
    const expire=async()=>{await getSupabaseBrowser().auth.signOut({scope:'local'}).catch(()=>undefined);setUser(null);setMe(null);setAccessToken('')};
    const arm=()=>{clearTimeout(timer);const last=Number(localStorage.getItem(KEY)||Date.now());const left=LIMIT-(Date.now()-last);if(left<=0){expire();return}timer=setTimeout(expire,left)};
    const active=()=>{localStorage.setItem(KEY,String(Date.now()));arm()};
    if(!localStorage.getItem(KEY))localStorage.setItem(KEY,String(Date.now()));
    ['mousedown','keydown','touchstart','scroll'].forEach(e=>window.addEventListener(e,active,{passive:true}));
    const storage=(e:StorageEvent)=>{if(e.key===KEY)arm()};window.addEventListener('storage',storage);arm();
    return()=>{clearTimeout(timer);['mousedown','keydown','touchstart','scroll'].forEach(e=>window.removeEventListener(e,active));window.removeEventListener('storage',storage)}
  }, [user]);

  useEffect(() => {
    let alive = true;
    const supabase = getSupabaseBrowser();

    (async () => {
      try {
        const { data, error } = await supabase.auth.getSession();
        if (error) throw error;
        if (alive) localStorage.setItem('schunk_last_activity',String(Date.now()));
      await applySession(data.session);
      } catch {
        if (alive) { setUser(null); setMe(null); setAccessToken(''); }
      } finally {
        if (alive) setLoading(false);
      }
    })();

    const { data } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!alive) return;
      if (event === 'SIGNED_OUT') {
        setUser(null); setMe(null); setAccessToken('');
        return;
      }
      if (session?.access_token) {
        try { await applySession(session); } catch { /* API zeigt Fehler bei Bedarf */ }
      }
    });

    return () => { alive = false; data.subscription.unsubscribe(); };
  }, []);

  async function login(email: string, password: string) {
    setLoading(true);
    try {
      const { data, error } = await getSupabaseBrowser().auth.signInWithPassword({ email, password });
      if (error || !data.session || !data.user) throw error || new Error('Anmeldung fehlgeschlagen.');
      await applySession(data.session);
    } catch (e) {
      await getSupabaseBrowser().auth.signOut({ scope: 'local' }).catch(() => undefined);
      setUser(null); setAccessToken(''); setMe(null);
      throw e;
    } finally { setLoading(false); }
  }

  async function logout() {
    setLoading(true);
    try { await getSupabaseBrowser().auth.signOut({ scope: 'local' }); }
    finally { setUser(null); setMe(null); setAccessToken(''); setLoading(false); }
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
