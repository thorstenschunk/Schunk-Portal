import { NextRequest, NextResponse } from 'next/server';
import { ApiError, audit, errorResponse, minutesBetween, quarterTime, requireUser } from '@/lib/api-auth';
import { supabaseAdmin } from '@/lib/supabase-server';
import { requireReportAccess, requireSiteMembership } from '@/lib/entity-access';
export const dynamic='force-dynamic';

function canSeeAll(u:any){return u.roles.some((r:string)=>['admin','office','foreman'].includes(r));}
function validateMember(m:any){
  const pause=Number(m.pause_minutes||0),travel=Number(m.travel_setup_minutes||0);
  if(!quarterTime(m.start_time)||!quarterTime(m.end_time)||pause%15||travel%15) throw new ApiError(400,'Rapportzeiten müssen im 15-Minuten-Raster liegen.');
  const total=minutesBetween(m.start_time,m.end_time,pause); if(total<0||total%15)throw new ApiError(400,'Ungültige Arbeitszeit.'); if(travel>total)throw new ApiError(400,'Fahrt-/Rüstzeit ist in der Gesamtzeit enthalten und darf diese nicht überschreiten.');
  return {...m,pause_minutes:pause,travel_setup_minutes:travel,total_minutes:total};
}
export async function GET(req:NextRequest){try{const u=await requireUser(req,'reports.read');const db=supabaseAdmin();const id=req.nextUrl.searchParams.get('id');if(id){const {data,error}=await db.from('work_reports').select('*,construction_sites(project_no,title,street,postal_code,city,contact_name,contact_phone,customers(customer_no,name,salutation,street,postal_code,city)),section:project_sections(id,name),work_report_members(*,profiles(full_name)),work_report_materials(*)').eq('id',id).single();if(error)throw error;if(!canSeeAll(u)){const own=(data as any).work_report_members?.some((m:any)=>m.user_id===u.id)||(data as any).created_by===u.id;if(!own)throw new ApiError(403,'Keine Berechtigung für diesen Rapport.');}const [{data:files,error:filesError},{data:creator,error:creatorError}]=await Promise.all([db.from('files').select('*').eq('entity_type','report').eq('entity_id',id).eq('upload_status','ready').order('created_at'),data.created_by?db.from('profiles').select('full_name').eq('id',data.created_by).maybeSingle():Promise.resolve({data:null,error:null} as any)]);if(filesError)throw filesError;if(creatorError)throw creatorError;let revisions:any[]=[];if(u.roles.includes('admin')){const {data:rev,error:revError}=await db.from('work_report_revisions').select('id,reason,created_at,changed_by').eq('report_id',id).order('created_at',{ascending:false}).limit(20);if(revError)throw revError;const changerIds=[...new Set((rev||[]).map((r:any)=>r.changed_by).filter(Boolean))];let names=new Map<string,string>();if(changerIds.length){const {data:people,error:peopleError}=await db.from('profiles').select('id,full_name').in('id',changerIds);if(peopleError)throw peopleError;names=new Map((people||[]).map((x:any)=>[x.id,x.full_name]));}revisions=(rev||[]).map((r:any)=>({...r,profiles:{full_name:names.get(r.changed_by)||'Administrator'}}));}return NextResponse.json({...data,creator:creator||null,files:files||[],revisions})}
let query=db.from('work_reports').select('id,report_no,work_date,work_description,work_completed,locked_at,created_by,construction_sites(project_no,title),section:project_sections(id,name),work_report_members(user_id)').order('work_date',{ascending:false}).order('created_at',{ascending:false});const {data,error}=await query;if(error)throw error;const rows=canSeeAll(u)?data:(data||[]).filter((r:any)=>r.created_by===u.id||r.work_report_members?.some((m:any)=>m.user_id===u.id));return NextResponse.json(rows||[])}catch(e){return errorResponse(e)}}
export async function POST(req:NextRequest){try{const u=await requireUser(req,'reports.create');const b=await req.json();const db=supabaseAdmin();if(!b.construction_site_id||!b.work_date||!String(b.work_description||'').trim())throw new ApiError(400,'Baustelle, Datum und Arbeitsbeschreibung sind Pflicht.');await requireSiteMembership(u,b.construction_site_id);if(b.section_id){const {data:sec,error:se}=await db.from('project_sections').select('id').eq('id',b.section_id).eq('construction_site_id',b.construction_site_id).eq('archived',false).maybeSingle();if(se)throw se;if(!sec)throw new ApiError(400,'Die gewählte Unterkategorie gehört nicht zu dieser Baustelle.');}if(!Array.isArray(b.members)||!b.members.length)throw new ApiError(400,'Mindestens ein Mitarbeiter ist erforderlich.');const members=b.members.map(validateMember);const broad=canSeeAll(u);if(!broad){const {data:siteMembers,error:smErr}=await db.from('construction_members').select('user_id').eq('construction_site_id',b.construction_site_id);if(smErr)throw smErr;const allowed=new Set((siteMembers||[]).map((x:any)=>x.user_id));for(const member of members){if(!allowed.has(member.user_id))throw new ApiError(403,'Im Rapport dürfen nur Mitarbeiter dieser Baustelle erfasst werden.');}}
const {data:report,error}=await db.from('work_reports').insert({construction_site_id:b.construction_site_id,section_id:b.section_id||null,work_date:b.work_date,customer_salutation:b.customer_salutation||null,customer_name:b.customer_name||null,work_description:String(b.work_description).trim(),remarks:b.remarks||null,work_completed:b.work_completed??null,created_by:u.id}).select().single();if(error)throw error;
try{const {error:me}=await db.from('work_report_members').insert(members.map((m:any)=>({report_id:report.id,user_id:m.user_id,start_time:m.start_time,end_time:m.end_time,pause_minutes:m.pause_minutes,travel_setup_minutes:m.travel_setup_minutes,total_minutes:m.total_minutes})));if(me)throw me;if(Array.isArray(b.materials)&&b.materials.length){const mats=b.materials.filter((x:any)=>String(x.description||'').trim()).map((x:any)=>({report_id:report.id,section_id:b.section_id||null,quantity:x.quantity?Number(x.quantity):null,unit:x.unit||null,description:String(x.description).trim()}));if(mats.length){const {error:merr}=await db.from('work_report_materials').insert(mats);if(merr)throw merr;}}}catch(child){await db.from('work_reports').delete().eq('id',report.id);throw child;}
await audit(u.id,'create','work_report',report.id);return NextResponse.json(report)}catch(e){return errorResponse(e)}}
export async function PATCH(req:NextRequest){try{const u=await requireUser(req,'reports.create');const b=await req.json();const db=supabaseAdmin();const {data:old,error:oe}=await db.from('work_reports').select('*').eq('id',b.id).single();if(oe||!old)throw oe||new ApiError(404,'Rapport nicht gefunden.');
if(b.action==='admin-edit'){
  if(!u.roles.includes('admin'))throw new ApiError(403,'Nur Administratoren dürfen abgeschlossene Rapporte nachträglich bearbeiten.');
  if(!String(b.reason||'').trim())throw new ApiError(400,'Ein Änderungsgrund ist Pflicht.');
  if(!b.construction_site_id||!b.work_date||!String(b.work_description||'').trim())throw new ApiError(400,'Baustelle, Datum und Arbeitsbeschreibung sind Pflicht.');
  if(!Array.isArray(b.members)||!b.members.length)throw new ApiError(400,'Mindestens ein Mitarbeiter ist erforderlich.');
  const members=b.members.map(validateMember);
  if(b.section_id){const {data:sec,error:se}=await db.from('project_sections').select('id').eq('id',b.section_id).eq('construction_site_id',b.construction_site_id).eq('archived',false).maybeSingle();if(se)throw se;if(!sec)throw new ApiError(400,'Die gewählte Unterkategorie gehört nicht zu dieser Baustelle.');}
  const materials=Array.isArray(b.materials)?b.materials.filter((x:any)=>String(x.description||'').trim()).map((x:any)=>({quantity:x.quantity===null||x.quantity===''?null:Number(x.quantity),unit:x.unit||null,description:String(x.description).trim()})):[];
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
  const existing=await db.from('time_entries').select('id').eq('source_report_id',b.id);if((existing.data||[]).length)throw new ApiError(409,'Arbeitszeiten dieses Rapports wurden bereits übernommen.');
  const inserts=(members||[]).map((m:any)=>({user_id:m.user_id,construction_site_id:old.construction_site_id,section_id:old.section_id||null,work_date:old.work_date,start_time:m.start_time,end_time:m.end_time,pause_minutes:m.pause_minutes,travel_setup_minutes:m.travel_setup_minutes,total_minutes:m.total_minutes,activity:old.work_description,source_report_id:b.id,locked:true,submitted_at:new Date().toISOString(),created_by:u.id}));const {error:te}=await db.from('time_entries').insert(inserts);if(te){if((te as any).code==='23P01'||(te as any).code==='23505')throw new ApiError(409,'Mindestens eine Mitarbeiterzeit überschneidet sich mit einer vorhandenen Buchung oder wurde bereits übernommen.');throw te;}const {data,error}=await db.from('work_reports').update({locked_at:new Date().toISOString(),locked_by:u.id,work_completed:b.work_completed,updated_at:new Date().toISOString()}).eq('id',b.id).select().single();if(error)throw error;await audit(u.id,'finalize','work_report',b.id);return NextResponse.json(data);
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
