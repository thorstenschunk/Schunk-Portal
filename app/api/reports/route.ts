import { NextRequest, NextResponse } from 'next/server';
import { ApiError, audit, errorResponse, minutesBetween, quarterTime, requireUser } from '@/lib/api-auth';
import { supabaseAdmin } from '@/lib/supabase-server';
import { requireReportAccess, requireSiteMembership } from '@/lib/entity-access';
export const dynamic='force-dynamic';

function canSeeAll(u:any){return u.roles.some((r:string)=>['admin','office','foreman'].includes(r));}
function deTime(iso:string){const parts=new Intl.DateTimeFormat('de-DE',{timeZone:'Europe/Berlin',hour:'2-digit',minute:'2-digit',hour12:false}).formatToParts(new Date(iso));return `${parts.find(p=>p.type==='hour')?.value||'00'}:${parts.find(p=>p.type==='minute')?.value||'00'}`}
function timeMin(v:string){const [h,m]=String(v).slice(0,5).split(':').map(Number);return h*60+m}
function validateMember(m:any,strictQuarter=true){
  const pause=Number(m.pause_minutes||0),travel=Number(m.travel_setup_minutes||0);
  if((strictQuarter&&(!quarterTime(m.start_time)||!quarterTime(m.end_time)))||(!strictQuarter&&!quarterTime(m.end_time))||pause%15||travel%15) throw new ApiError(400,'Ungültige Rapportzeit. Die geplante Endzeit und Pausen müssen im 15-Minuten-Raster liegen.');
  const total=minutesBetween(String(m.start_time).slice(0,5),String(m.end_time).slice(0,5),pause); if(total<0)throw new ApiError(400,'Ungültige Arbeitszeit.'); if(travel>total)throw new ApiError(400,'Fahrt-/Rüstzeit ist in der Gesamtzeit enthalten und darf diese nicht überschreiten.');
  return {...m,start_time:String(m.start_time).slice(0,5),end_time:String(m.end_time).slice(0,5),pause_minutes:pause,travel_setup_minutes:travel,total_minutes:total};
}
export async function GET(req:NextRequest){try{const u=await requireUser(req,'reports.read');const db=supabaseAdmin();const id=req.nextUrl.searchParams.get('id');if(id){const {data,error}=await db.from('work_reports').select('*,construction_sites(project_no,title,street,postal_code,city,contact_name,contact_phone,customers(customer_no,name,salutation,street,postal_code,city)),section:project_sections(id,name),creator:profiles!work_reports_created_by_fkey(full_name),work_report_members(*,profiles(full_name)),work_report_materials(*)').eq('id',id).single();if(error)throw error;if(!canSeeAll(u)){const own=(data as any).work_report_members?.some((m:any)=>m.user_id===u.id)||(data as any).created_by===u.id;if(!own)throw new ApiError(403,'Keine Berechtigung für diesen Rapport.');}const {data:files}=await db.from('files').select('*').eq('entity_type','report').eq('entity_id',id).eq('upload_status','ready').order('created_at');const {data:revisions}=u.roles.includes('admin')?await db.from('work_report_revisions').select('id,reason,created_at,changed_by,profiles!work_report_revisions_changed_by_fkey(full_name)').eq('report_id',id).order('created_at',{ascending:false}).limit(20):{data:[] as any[]};return NextResponse.json({...data,files:files||[],revisions:revisions||[]})}
let query=db.from('work_reports').select('id,report_no,work_date,work_description,work_completed,locked_at,created_by,construction_sites(project_no,title),section:project_sections(id,name),work_report_members(user_id)').order('work_date',{ascending:false}).order('created_at',{ascending:false});const {data,error}=await query;if(error)throw error;const rows=canSeeAll(u)?data:(data||[]).filter((r:any)=>r.created_by===u.id||r.work_report_members?.some((m:any)=>m.user_id===u.id));return NextResponse.json(rows||[])}catch(e){return errorResponse(e)}}
export async function POST(req:NextRequest){try{const u=await requireUser(req,'reports.create');const b=await req.json();const db=supabaseAdmin();if(!b.work_date||!String(b.work_description||'').trim())throw new ApiError(400,'Datum und Arbeitsbeschreibung sind Pflicht.');if(b.construction_site_id)await requireSiteMembership(u,b.construction_site_id);if(!b.construction_site_id&&!String(b.customer_name||'').trim())throw new ApiError(400,'Bei einem freien Rapport ist der Kundenname Pflicht.');if(b.section_id){const {data:sec,error:se}=await db.from('project_sections').select('id').eq('id',b.section_id).eq('construction_site_id',b.construction_site_id).eq('archived',false).maybeSingle();if(se)throw se;if(!sec)throw new ApiError(400,'Die gewählte Unterkategorie gehört nicht zu dieser Baustelle.');}if(!Array.isArray(b.members)||!b.members.length)throw new ApiError(400,'Mindestens ein Mitarbeiter ist erforderlich.');const broad=canSeeAll(u);let members:any[];
if(!broad){
  const requested=b.members[0]||{};if(requested.user_id!==u.id)throw new ApiError(403,'Mitarbeiter dürfen im Rapport nur ihre eigene Zeit erfassen.');
  const {data:day,error:de}=await db.from('time_clock_days').select('*').eq('user_id',u.id).eq('work_date',b.work_date).maybeSingle();if(de)throw de;
  if(!day||!['running','stopped'].includes(day.status))throw new ApiError(409,'Für einen Mitarbeiter-Rapport muss der Arbeitstag über die Stempeluhr gestartet sein.');
  const member=validateMember({...requested,pause_minutes:0,travel_setup_minutes:0});
  const {data:existing,error:ee}=await db.from('work_report_members').select('total_minutes,work_reports!inner(work_date)').eq('user_id',u.id).eq('work_reports.work_date',b.work_date);if(ee)throw ee;
  const used=(existing||[]).reduce((s:number,x:any)=>s+Number(x.total_minutes||0),0);
  const startMin=timeMin(deTime(day.started_at));const reportEnd=timeMin(member.end_time);
  let available:number;
  if(day.status==='stopped'&&day.stopped_at){available=Math.max(0,Math.round((new Date(day.stopped_at).getTime()-new Date(day.started_at).getTime())/60000));}
  else{const nowMin=timeMin(deTime(new Date().toISOString()));available=Math.max(0,Math.max(nowMin,reportEnd)-startMin);}
  const autoPause=available>=330?45:(available>0?15:0);const net=Math.max(0,available-autoPause);
  if(used+member.total_minutes>net)throw new ApiError(409,`Die Summe der Rapportzeiten (${used+member.total_minutes} Min.) überschreitet die verfügbare gestempelte Nettoarbeitszeit (${net} Min.).`);
  members=[member];
}else members=b.members.map(validateMember);
const {data:report,error}=await db.from('work_reports').insert({construction_site_id:b.construction_site_id||null,section_id:b.section_id||null,work_date:b.work_date,customer_salutation:b.customer_salutation||null,customer_name:b.customer_name||null,customer_street:b.customer_street||null,customer_postal_code:b.customer_postal_code||null,customer_city:b.customer_city||null,customer_contact:b.customer_contact||null,work_description:String(b.work_description).trim(),remarks:b.remarks||null,work_completed:b.work_completed??null,created_by:u.id}).select().single();if(error)throw error;
try{const {error:me}=await db.from('work_report_members').insert(members.map((m:any)=>({report_id:report.id,user_id:m.user_id,start_time:m.start_time,end_time:m.end_time,pause_minutes:m.pause_minutes,travel_setup_minutes:m.travel_setup_minutes,total_minutes:m.total_minutes})));if(me)throw me;if(Array.isArray(b.materials)&&b.materials.length){const mats=b.materials.filter((x:any)=>String(x.description||'').trim()).map((x:any)=>({report_id:report.id,section_id:b.section_id||null,quantity:x.quantity?Number(x.quantity):null,unit:x.unit||null,description:String(x.description).trim()}));if(mats.length){const {error:merr}=await db.from('work_report_materials').insert(mats);if(merr)throw merr;}}}catch(child){await db.from('work_reports').delete().eq('id',report.id);throw child;}
await audit(u.id,'create','work_report',report.id);return NextResponse.json(report)}catch(e){return errorResponse(e)}}
export async function PATCH(req:NextRequest){try{const u=await requireUser(req,'reports.create');const b=await req.json();const db=supabaseAdmin();const {data:old,error:oe}=await db.from('work_reports').select('*').eq('id',b.id).single();if(oe||!old)throw oe||new ApiError(404,'Rapport nicht gefunden.');
if(b.action==='admin-edit'){
  if(!u.roles.includes('admin'))throw new ApiError(403,'Nur Administratoren dürfen abgeschlossene Rapporte nachträglich bearbeiten.');
  if(!String(b.reason||'').trim())throw new ApiError(400,'Ein Änderungsgrund ist Pflicht.');
  if(!b.work_date||!String(b.work_description||'').trim())throw new ApiError(400,'Datum und Arbeitsbeschreibung sind Pflicht.');
  if(!Array.isArray(b.members)||!b.members.length)throw new ApiError(400,'Mindestens ein Mitarbeiter ist erforderlich.');
  const members=b.members.map(validateMember);
  if(b.section_id){const {data:sec,error:se}=await db.from('project_sections').select('id').eq('id',b.section_id).eq('construction_site_id',b.construction_site_id).eq('archived',false).maybeSingle();if(se)throw se;if(!sec)throw new ApiError(400,'Die gewählte Unterkategorie gehört nicht zu dieser Baustelle.');}
  const materials=Array.isArray(b.materials)?b.materials.filter((x:any)=>String(x.description||'').trim()).map((x:any)=>({quantity:x.quantity===null||x.quantity===''?null:Number(x.quantity),unit:x.unit||null,description:String(x.description).trim()})):[];
  if(!b.construction_site_id){
    const before=old;
    const {data:updated,error:ue}=await db.from('work_reports').update({construction_site_id:null,section_id:null,work_date:b.work_date,customer_salutation:b.customer_salutation||null,customer_name:b.customer_name||null,customer_street:b.customer_street||old.customer_street||null,customer_postal_code:b.customer_postal_code||old.customer_postal_code||null,customer_city:b.customer_city||old.customer_city||null,customer_contact:b.customer_contact||old.customer_contact||null,work_description:String(b.work_description).trim(),remarks:b.remarks||null,work_completed:b.work_completed??null,updated_at:new Date().toISOString()}).eq('id',b.id).select().single();if(ue)throw ue;
    await db.from('work_report_members').delete().eq('report_id',b.id);await db.from('work_report_members').insert(members.map((m:any)=>({report_id:b.id,user_id:m.user_id,start_time:m.start_time,end_time:m.end_time,pause_minutes:m.pause_minutes,travel_setup_minutes:m.travel_setup_minutes,total_minutes:m.total_minutes})));
    await db.from('work_report_materials').delete().eq('report_id',b.id);if(materials.length)await db.from('work_report_materials').insert(materials.map((m:any)=>({...m,report_id:b.id,section_id:null})));
    await db.from('work_report_revisions').insert({report_id:b.id,changed_by:u.id,reason:String(b.reason).trim(),before_data:{report:before},after_data:{report:updated}});
    await audit(u.id,'admin_edit','work_report',b.id,{reason:String(b.reason).trim(),free_report:true});return NextResponse.json({report:updated,pdf_needs_regeneration:!!old.locked_at});
  }
  const {data,error}=await db.rpc('admin_update_work_report',{
    p_report_id:b.id,p_changed_by:u.id,p_reason:String(b.reason).trim(),
    p_construction_site_id:b.construction_site_id,p_section_id:b.section_id||null,
    p_work_date:b.work_date,p_customer_salutation:b.customer_salutation||null,
    p_customer_name:b.customer_name||null,p_work_description:String(b.work_description).trim(),
    p_remarks:b.remarks||null,p_work_completed:b.work_completed??null,
    p_members:members,p_materials:materials
  });
  if(error)throw error;
  await audit(u.id,'admin_edit','work_report',b.id,{reason:String(b.reason).trim(),moved:old.construction_site_id!==b.construction_site_id||old.section_id!==(b.section_id||null)});
  return NextResponse.json({report:data,pdf_needs_regeneration:!!old.locked_at});
}
if(old.locked_at)throw new ApiError(409,'Dieser Rapport ist verbindlich abgeschlossen und gesperrt.');if(b.action==='finalize'){
  await requireUser(req,'reports.finalize');
  if(typeof b.work_completed!=='boolean')throw new ApiError(400,'Bitte angeben, ob die Arbeiten abgeschlossen oder nicht abgeschlossen sind.');
  const {data:members}=await db.from('work_report_members').select('*').eq('report_id',b.id);if(!members?.length)throw new ApiError(400,'Keine Mitarbeiterzeiten vorhanden.');
  const {data:sigs}=await db.from('files').select('category').eq('entity_type','report').eq('entity_id',b.id).eq('upload_status','ready').in('category',['signature_customer','signature_employee']);const cats=new Set((sigs||[]).map((s:any)=>s.category));if(!cats.has('signature_customer')||!cats.has('signature_employee'))throw new ApiError(400,'Kunden- und Mitarbeiterunterschrift sind vor Abschluss erforderlich.');
  // Seit 1.5.0 ist die Stempeluhr die führende Arbeitszeitquelle. Der Rapport dokumentiert die Auftragszeit, erzeugt aber keine zweite Zeitbuchung.
  const {data,error}=await db.from('work_reports').update({locked_at:new Date().toISOString(),locked_by:u.id,work_completed:b.work_completed,updated_at:new Date().toISOString()}).eq('id',b.id).select().single();if(error)throw error;await audit(u.id,'finalize','work_report',b.id);return NextResponse.json(data);
  }
  const values:any={updated_at:new Date().toISOString()};for(const k of ['customer_salutation','customer_name','work_description','remarks','work_completed'])if(k in b)values[k]=b[k];const {data,error}=await db.from('work_reports').update(values).eq('id',b.id).select().single();if(error)throw error;await audit(u.id,'update','work_report',b.id,values);return NextResponse.json(data)
}catch(e){return errorResponse(e)}}

export async function DELETE(req:NextRequest){try{
  const u=await requireUser(req,'reports.create');
  if(!u.roles.includes('admin'))throw new ApiError(403,'Nur Administratoren dürfen Rapporte löschen.');
  const id=req.nextUrl.searchParams.get('id');const reason=req.nextUrl.searchParams.get('reason');
  if(!id)throw new ApiError(400,'Rapport-ID fehlt.');
  if(!String(reason||'').trim())throw new ApiError(400,'Ein Löschgrund ist Pflicht.');
  const db=supabaseAdmin();
  const {data:report,error:re}=await db.from('work_reports').select('*,work_report_members(*),work_report_materials(*)').eq('id',id).single();
  if(re||!report)throw re||new ApiError(404,'Rapport nicht gefunden.');
  const {data:files,error:fe}=await db.from('files').select('*').eq('entity_type','report').eq('entity_id',id);
  if(fe)throw fe;
  const snapshot={report,files:files||[]};
  await audit(u.id,'delete','work_report',id,{reason:String(reason).trim(),snapshot});
  const paths=(files||[]).map((f:any)=>f.storage_path).filter(Boolean);
  if(paths.length){const {error:se}=await db.storage.from('schunk-private').remove(paths);if(se)throw se;}
  await db.from('time_entries').delete().eq('source_report_id',id);
  await db.from('work_reports').update({pdf_file_id:null}).eq('id',id);
  if((files||[]).length){const {error:fde}=await db.from('files').delete().eq('entity_type','report').eq('entity_id',id);if(fde)throw fde;}
  const {error:de}=await db.from('work_reports').delete().eq('id',id);if(de)throw de;
  return NextResponse.json({ok:true});
}catch(e){return errorResponse(e)}}
