'use client';
import Link from 'next/link';
import { useEffect,useState } from 'react';
import { usePathname } from 'next/navigation';
import {
  BarChart3, CalendarDays, ClipboardList, ClipboardSignature, Clock3, FolderOpen,
  HardHat, LayoutDashboard, LogOut, Menu, MessageCircle, PackageSearch, Settings,
  TriangleAlert, Users, ContactRound, FolderTree, X
} from 'lucide-react';
import { useAuth } from './AuthProvider';
import { apiFetch } from '@/lib/api-client';
import { LoginScreen } from './LoginScreen';

const nav = [
  { href:'/', label:'Dashboard', icon:LayoutDashboard, permission:'dashboard.read' },
  { href:'/kunden', label:'Kunden', icon:ContactRound, permission:'customers.read' },
  { href:'/baustellen', label:'Baustellen', icon:HardHat, permission:'sites.read' },
  { href:'/unterkategorien', label:'Unterkategorien', icon:FolderTree, permission:'sites.read' },
  { href:'/rapporte', label:'Rapporte', icon:ClipboardSignature, permission:'reports.read' },
  { href:'/material', label:'Material & Lager', icon:PackageSearch, permission:'reports.read' },
  { href:'/maengel', label:'Mängel & Probleme', icon:TriangleAlert, permission:'sites.read' },
  { href:'/aufgaben', label:'Aufgaben', icon:ClipboardList, permission:'sites.read' },
  { href:'/dokumente', label:'Dokumente', icon:FolderOpen, permission:'project.files.read' },
  { href:'/nachrichten', label:'Nachrichten', icon:MessageCircle, permission:'sites.read' },
  { href:'/auswertungen', label:'Auswertungen', icon:BarChart3, permission:'dashboard.read' },
  { href:'/zeiterfassung', label:'Zeiterfassung', icon:Clock3, permission:'time.own' },
  { href:'/kalender', label:'Disposition', icon:CalendarDays, permission:'calendar.read' },
  { href:'/admin', label:'Administration', icon:Users, permission:'admin.users.manage' },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const auth = useAuth(); const pathname = usePathname();const [messageCount,setMessageCount]=useState(0);const [mobileMenuOpen,setMobileMenuOpen]=useState(false);
  useEffect(()=>{if(auth.accessToken)apiFetch<any[]>('/api/internal-messages',auth.accessToken).then(x=>setMessageCount(x.filter((m:any)=>m.status!=='Geklärt'&&m.last_sender_id!==auth.me?.id&&!m.read_at).length)).catch(()=>setMessageCount(0))},[auth.accessToken,pathname,auth.me?.id]);useEffect(()=>{setMobileMenuOpen(false)},[pathname]);
  if (auth.loading) return <div className="boot-screen"><div className="boot-spinner"/><span>SCHUNK PORTAL wird geladen…</span></div>;
  if (!auth.user || !auth.me || !auth.accessToken) return <LoginScreen/>;

  return <div className="app-shell">
    <aside className={mobileMenuOpen?"sidebar mobile-open":"sidebar"}>
      <div className="brand"><img src="/logo.png" alt="Schunk"/><span>PORTAL</span></div>
      <nav>{nav.filter(n=>auth.has(n.permission)).map(n=>{const I=n.icon;const active=n.href==='/'?pathname==='/':pathname.startsWith(n.href);return <Link key={n.href} href={n.href} className={active?'nav-link active':'nav-link'}><I size={20}/><span>{n.label}</span>{n.href==='/nachrichten'&&messageCount>0?<b className="nav-count">{messageCount}</b>:null}</Link>})}</nav>
      <div className="sidebar-user"><div className="avatar">{auth.me.full_name.split(' ').map(v=>v[0]).slice(0,2).join('').toUpperCase()}</div><div className="grow"><strong>{auth.me.full_name}</strong><small>{auth.me.roles.join(', ')}</small></div><button className="icon-btn" onClick={auth.logout} title="Abmelden"><LogOut size={18}/></button></div>
    </aside>{mobileMenuOpen&&<button className="mobile-menu-backdrop" onClick={()=>setMobileMenuOpen(false)} aria-label="Menü schließen"/>}
    <div className="content-shell">
      <header className="topbar">
        <div className="topbar-brand"><button className="mobile-menu-btn" onClick={()=>setMobileMenuOpen(v=>!v)} aria-label={mobileMenuOpen?'Menü schließen':'Menü öffnen'}>{mobileMenuOpen?<X size={25}/>:<Menu size={25}/>}</button><img className="mobile-top-logo" src="/logo.png" alt="Tischlerei Schunk"/></div>
        <div className="topbar-user">
          <div className="topbar-user-icon"><Users size={19}/></div>
          <div><strong>{auth.me.full_name}</strong><small>{auth.me.roles.includes('admin')?'Administrator':auth.me.roles.join(', ')}</small></div>
          <Link href="/einstellungen" className="icon-btn" title="Einstellungen"><Settings size={20}/></Link>
        </div>
      </header>
      <main className="page">{children}</main>
    </div>
  </div>;
}
