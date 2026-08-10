'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { CalendarDays, ClipboardSignature, Clock3, HardHat, LayoutDashboard, LogOut, Settings, Users, ContactRound } from 'lucide-react';
import { useAuth } from './AuthProvider';
import { LoginScreen } from './LoginScreen';

const nav = [
  { href:'/', label:'Dashboard', icon:LayoutDashboard, permission:'dashboard.read' },
  { href:'/kunden', label:'Kunden', icon:ContactRound, permission:'customers.read' },
  { href:'/baustellen', label:'Baustellen', icon:HardHat, permission:'sites.read' },
  { href:'/zeiterfassung', label:'Zeiterfassung', icon:Clock3, permission:'time.own' },
  { href:'/rapporte', label:'Rapporte', icon:ClipboardSignature, permission:'reports.read' },
  { href:'/kalender', label:'Disposition', icon:CalendarDays, permission:'calendar.read' },
  { href:'/admin', label:'Administration', icon:Users, permission:'admin.users.manage' },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const auth = useAuth(); const pathname = usePathname();
  if (!auth.user || !auth.me || !auth.accessToken) return <LoginScreen/>;
  return <div className="app-shell">
    <aside className="sidebar">
      <div className="brand"><img src="/logo.png" alt="Schunk"/><span>PORTAL</span></div>
      <nav>{nav.filter(n=>auth.has(n.permission)).map(n=>{ const I=n.icon; const active = n.href==='/' ? pathname==='/' : pathname.startsWith(n.href); return <Link key={n.href} href={n.href} className={active?'nav-link active':'nav-link'}><I size={20}/><span>{n.label}</span></Link>})}</nav>
      <div className="sidebar-user"><div className="avatar">{auth.me.full_name.split(' ').map(v=>v[0]).slice(0,2).join('').toUpperCase()}</div><div className="grow"><strong>{auth.me.full_name}</strong><small>{auth.me.roles.join(', ')}</small></div><button className="icon-btn" onClick={auth.logout} title="Abmelden"><LogOut size={18}/></button></div>
    </aside>
    <div className="content-shell"><header className="topbar"><div><span className="eyebrow">DESIGN TISCHLEREI SCHUNK</span><strong>SCHUNK PORTAL</strong></div><Settings size={20}/></header><main className="page">{children}</main></div>
  </div>;
}
