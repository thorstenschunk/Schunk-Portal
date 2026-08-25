import { NextRequest,NextResponse } from 'next/server';
import { ApiError,audit,errorResponse,requireUser } from '@/lib/api-auth';
import { supabaseAdmin } from '@/lib/supabase-server';
import { requireMeasurementAccess,requireSiteMembership } from '@/lib/entity-access';
export const dynamic='force-dynamic';

function calc(item:any){
  const q=Number(item.quantity||1),l=item.length_mm===''||item.length_mm==null?null:Number(item.length_mm),w=item.width_mm===''||item.width_mm==null?null:Number(item.width_mm),h=item.height_mm===''||item.height_mm==null?null:Number(item.height_mm);
  const perimeter=l!=null&&w!=null?2*(l+w)*q:null;
  const area=l!=null&&w!=null?(l/1000)*(w/1000)*q:null;
  return {position_no:Number(item.position_no||1),label:item.label||null,quantity:q,length_mm:l,width_mm:w,height_mm:h,perimeter_mm:perimeter,area_m2:area,notes:item.notes||null};
}

export async function GET(req:NextRequest){try{
  const u=await requireUser(req,'sites.read');const db=supabaseAdmin();const id=req.nextUrl.searchParams.get('id');const site=req.nextUrl.searchParams.get('site_id');
  if(id){await requireMeasurementAccess(u,id);const {data,error}=await db.from('measurements').select('*,section:project_sections(id,name),construction_sites(id,project_no,title,street,postal_code,city),creator:profiles!measurements_created_by_fkey(full_name),measurement_items(*)').eq('id',id).single();if(error)throw error;const {data:files}=await db.from('files').select('*').eq('entity_type','measurement').eq('entity_id',id).eq('upload_status','ready').order('created_at');const broad=u.roles.some((r:string)=>['admin','office','foreman'].includes(r));const visibleFiles=broad?(files||[]):(files||[]).filter((f:any)=>f.visibility==='site_members'||(f.visibility==='selected'&&Array.isArray(f.visible_to)&&f.visible_to.includes(u.id)));return NextResponse.json({...data,files:visibleFiles})}
  if(!site)throw new ApiError(400,'Baustelle fehlt.');await requireSiteMembership(u,site);const {data,error}=await db.from('measurements').select('*,section:project_sections(id,name),creator:profiles!measurements_created_by_fkey(full_name)').eq('construction_site_id',site).order('created_at',{ascending:false});if(error)throw error;return NextResponse.json(data||[]);
}catch(e){return errorResponse(e)}}

export async function POST(req:NextRequest){try{
  const u=await requireUser(req,'sites.read');const b=await req.json();const db=supabaseAdmin();if(!b.construction_site_id||!String(b.title||'').trim())throw new ApiError(400,'Baustelle und Titel sind Pflicht.');await requireSiteMembership(u,b.construction_site_id);
  if(b.section_id){const {data:s}=await db.from('project_sections').select('id').eq('id',b.section_id).eq('construction_site_id',b.construction_site_id).eq('archived',false).maybeSingle();if(!s)throw new ApiError(400,'Unterkategorie gehört nicht zur Baustelle.')}
  const {data:m,error}=await db.from('measurements').insert({construction_site_id:b.construction_site_id,section_id:b.section_id||null,title:String(b.title).trim(),measurement_type:b.measurement_type||'Freies Aufmaß',notes:b.notes||null,created_by:u.id}).select().single();if(error)throw error;
  try{const rows=(Array.isArray(b.items)?b.items:[]).map(calc);if(rows.length){const {error:ie}=await db.from('measurement_items').insert(rows.map((x:any)=>({...x,measurement_id:m.id})));if(ie)throw ie}}catch(e){await db.from('measurements').delete().eq('id',m.id);throw e}
  await audit(u.id,'create','measurement',m.id,{site:b.construction_site_id});return NextResponse.json(m);
}catch(e){return errorResponse(e)}}

export async function PATCH(req:NextRequest){try{
  const u=await requireUser(req,'sites.read');const b=await req.json();const db=supabaseAdmin();await requireMeasurementAccess(u,b.id);
  const {data:m,error}=await db.from('measurements').update({section_id:b.section_id||null,title:String(b.title||'').trim(),measurement_type:b.measurement_type,notes:b.notes||null,updated_at:new Date().toISOString()}).eq('id',b.id).select().single();if(error)throw error;
  await db.from('measurement_items').delete().eq('measurement_id',b.id);const rows=(Array.isArray(b.items)?b.items:[]).map(calc);if(rows.length){const {error:ie}=await db.from('measurement_items').insert(rows.map((x:any)=>({...x,measurement_id:b.id})));if(ie)throw ie}
  await audit(u.id,'update','measurement',b.id);return NextResponse.json(m);
}catch(e){return errorResponse(e)}}

export async function DELETE(req:NextRequest){try{
  const u=await requireUser(req,'sites.read');const id=req.nextUrl.searchParams.get('id');if(!id)throw new ApiError(400,'ID fehlt.');await requireMeasurementAccess(u,id);const db=supabaseAdmin();
  const {data:files}=await db.from('files').select('storage_path').eq('entity_type','measurement').eq('entity_id',id);const paths=(files||[]).map((x:any)=>x.storage_path).filter(Boolean);if(paths.length)await db.storage.from('schunk-private').remove(paths);await db.from('files').delete().eq('entity_type','measurement').eq('entity_id',id);
  const {error}=await db.from('measurements').delete().eq('id',id);if(error)throw error;await audit(u.id,'delete','measurement',id);return NextResponse.json({ok:true});
}catch(e){return errorResponse(e)}}
