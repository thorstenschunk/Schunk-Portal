'use client';
import { FormEvent, useState } from 'react';
import { useAuth } from './AuthProvider';

export function LoginScreen() {
  const { login, loading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  async function submit(e: FormEvent) {
    e.preventDefault(); setError('');
    try { await login(email.trim(), password); }
    catch (err) { setError(err instanceof Error ? err.message : 'Anmeldung fehlgeschlagen.'); }
  }
  return <main className="login-shell">
    <section className="login-panel">
      <div className="login-brand"><img src="/logo.png" alt="Tischlerei Schunk" /><div><span>SCHUNK PORTAL</span><small>Baustelle · Zeit · Dokumentation</small></div></div>
      <div className="login-copy"><p className="eyebrow">BETRIEBSPORTAL</p><h1>Alles auf der Baustelle.<br/>Sauber dokumentiert.</h1><p>Zentral, rollenbasiert und ohne lokale Fachdaten im Browser.</p></div>
    </section>
    <section className="login-card-wrap">
      <form className="login-card" onSubmit={submit}>
        <p className="eyebrow">ANMELDUNG</p><h2>Willkommen zurück</h2><p className="muted">Nach einem Neuladen ist aus Sicherheitsgründen eine erneute Anmeldung erforderlich.</p>
        <label>E-Mail<input type="email" value={email} onChange={e=>setEmail(e.target.value)} autoComplete="username" required /></label>
        <label>Passwort<input type="password" value={password} onChange={e=>setPassword(e.target.value)} autoComplete="current-password" required /></label>
        {error && <div className="alert error">{error}</div>}
        <button className="btn primary wide" disabled={loading}>{loading ? 'Anmeldung…' : 'Anmelden'}</button>
      </form>
    </section>
  </main>;
}
