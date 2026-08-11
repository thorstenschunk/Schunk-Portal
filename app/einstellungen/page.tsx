'use client';
import { useEffect,useState } from 'react';
import { Save,KeyRound } from 'lucide-react';
import { PageHeader } from '@/components/PageHeader';
import { useAuth } from '@/components/AuthProvider';
import { apiFetch } from '@/lib/api-client';
import { getSupabaseBrowser } from '@/lib/supabase-browser';

export default function SettingsPage(){
  const {accessToken,has,me}=useAuth();
  const isAdmin=has('admin.users.manage');
  const [f,setF]=useState<any>(null);const [msg,setMsg]=useState('');const [error,setError]=useState('');
  const [pw,setPw]=useState({old:'',next:'',confirm:''});const [pwBusy,setPwBusy]=useState(false);

  useEffect(()=>{if(isAdmin)apiFetch<any>('/api/settings',accessToken).then(setF).catch(e=>setError(e.message))},[accessToken,isAdmin]);

  async function changePassword(){try{
    setPwBusy(true);setError('');setMsg('');
    if(!pw.old||!pw.next)throw new Error('Altes und neues Passwort sind erforderlich.');
    if(pw.next.length<8)throw new Error('Das neue Passwort muss mindestens 8 Zeichen lang sein.');
    if(pw.next!==pw.confirm)throw new Error('Die neuen Passwörter stimmen nicht überein.');
    if(!me?.email)throw new Error('Für diesen Benutzer ist keine E-Mail-Adresse vorhanden.');
    const supabase=getSupabaseBrowser();
    const {error:reauth}=await supabase.auth.signInWithPassword({email:me.email,password:pw.old});
    if(reauth)throw new Error('Das bisherige Passwort ist nicht korrekt.');
    const {error}=await supabase.auth.updateUser({password:pw.next});if(error)throw error;
    setPw({old:'',next:'',confirm:''});setMsg('Passwort erfolgreich geändert.');
  }catch(e){setError((e as Error).message)}finally{setPwBusy(false)}}

  const set=(k:string,v:any)=>setF((x:any)=>({...x,[k]:v}));
  async function save(){try{setError('');setMsg('');setF(await apiFetch('/api/settings',accessToken,{method:'PUT',body:JSON.stringify(f)}));setMsg('Einstellungen gespeichert.')}catch(e){setError((e as Error).message)}}

  return <><PageHeader eyebrow="KONTO & SYSTEM" title="Einstellungen" text="Eigenes Konto und – für Administratoren – die Grundeinstellungen des Portals." actions={isAdmin&&f?<button className="btn primary" onClick={save}><Save size={17}/> Firmendaten speichern</button>:undefined}/>
  {error&&<div className="alert error">{error}</div>}{msg&&<div className="alert success">{msg}</div>}
  <div className="grid-2"><div className="card"><div className="section-title"><h2>Mein Konto</h2></div><p><strong>{me?.full_name}</strong><br/><span className="muted">{me?.email}</span></p><div className="form-grid"><label className="span-2">Bisheriges Passwort<input type="password" value={pw.old} onChange={e=>setPw({...pw,old:e.target.value})}/></label><label>Neues Passwort<input type="password" value={pw.next} onChange={e=>setPw({...pw,next:e.target.value})}/></label><label>Neues Passwort bestätigen<input type="password" value={pw.confirm} onChange={e=>setPw({...pw,confirm:e.target.value})}/></label></div><button className="btn primary" disabled={pwBusy} onClick={changePassword} style={{marginTop:18}}><KeyRound size={17}/> {pwBusy?'Ändern…':'Passwort ändern'}</button></div>
  {isAdmin&&f?<><div className="card"><div className="section-title"><h2>Firmendaten</h2></div><div className="form-grid"><label className="span-2">Firmenname<input value={f.company_name||''} onChange={e=>set('company_name',e.target.value)}/></label><label className="span-2">Straße<input value={f.street||''} onChange={e=>set('street',e.target.value)}/></label><label>PLZ<input value={f.postal_code||''} onChange={e=>set('postal_code',e.target.value)}/></label><label>Ort<input value={f.city||''} onChange={e=>set('city',e.target.value)}/></label><label>Telefon<input value={f.phone||''} onChange={e=>set('phone',e.target.value)}/></label><label>E-Mail<input value={f.email||''} onChange={e=>set('email',e.target.value)}/></label><label className="span-2">Webseite<input value={f.website||''} onChange={e=>set('website',e.target.value)}/></label></div></div><div className="card"><div className="section-title"><h2>Personal & Rapporte</h2></div><div className="form-grid"><label>Wochenstunden Standard<input type="number" step="0.25" value={f.default_weekly_hours||40} onChange={e=>set('default_weekly_hours',Number(e.target.value))}/></label><label>Urlaubstage Standard<input type="number" step="0.5" value={f.default_vacation_days||30} onChange={e=>set('default_vacation_days',Number(e.target.value))}/></label><label className="span-2">Zusatztext im Rapport-PDF<textarea value={f.report_footer||''} onChange={e=>set('report_footer',e.target.value)}/></label></div></div></>:null}</div></>;
}
