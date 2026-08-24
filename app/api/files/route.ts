import { NextRequest,NextResponse } from 'next/server';
import { ApiError,audit,errorResponse,requireUser } from '@/lib/api-auth';
import { supabaseAdmin } from '@/lib/supabase-server';
import { requireReportAccess,requireSiteMembership,requireProjectItemAccess,requireMeasurementAccess,requireTaskAccess,requireInternalMessageAccess,requireAssignmentAccess,requirePurchaseRequestAccess } from '@/lib/entity-access';
async function entityAccess(u:any,type:string,id:string){
  if(type==='site')return requireSiteMembership(u,id);
  if(type==='report')return requireReportAccess(u,id);
  if(type==='project_item')return requireProjectItemAccess(u,id);
  if(type==='measurement')return requireMeasurementAccess(u,id);
  if(type==='task')return requireTaskAccess(u,id);
  if(type==='internal_message')return requireInternalMessageAccess(u,id);
  if(type==='assignment')return requireAssignmentAccess(u,id);
  if(type==='purchase_request')return requirePurchaseRequestAccess(u,id);
  if(type==='profile'&&id!==u.id&&!u.roles.includes('admin'))throw new ApiError(403,'Keine Berechtigung.');
}

export const dynamic='force-dynamic';
export async function GET(req:NextRequest){try{
 const u=await requireUser(req);const type=req.nextUrl.searchParams.get('entity_type');const id=req.nextUrl.searchParams.get('entity_id');if(!type||!id)throw new ApiError(400,'entity_type und entity_id sind erforderlich.');
 await entityAccess(u,type,id);const db=supabaseAdmin();const {data,error}=await db.from('files').select('*').eq('entity_type',type).eq('entity_id',id).eq('upload_status','ready').order('created_at',{ascending:false});if(error)throw error;const broad=u.roles.some((r:string)=>['admin','office','foreman'].includes(r));const visible=broad?(data||[]):(data||[]).filter((f:any)=>f.visibility==='site_members'||(f.visibility==='selected'&&Array.isArray(f.visible_to)&&f.visible_to.includes(u.id)));return NextResponse.json(visible);
}catch(e){return errorResponse(e)}}
export async function DELETE(req:NextRequest){try{
 const u=await requireUser(req);const id=req.nextUrl.searchParams.get('id');if(!id)throw new ApiError(400,'ID fehlt.');const db=supabaseAdmin();const {data:file,error}=await db.from('files').select('*').eq('id',id).single();if(error||!file)throw error||new ApiError(404,'Datei nicht gefunden.');
 await entityAccess(u,file.entity_type,file.entity_id);
 if(file.entity_type==='report'){const {data:r}=await db.from('work_reports').select('locked_at').eq('id',file.entity_id).single();if(r?.locked_at)throw new ApiError(409,'Dateien abgeschlossener Rapporte dürfen nicht gelöscht werden.');}
 const {error:se}=await db.storage.from('schunk-private').remove([file.storage_path]);if(se)throw se;await db.from('files').update({upload_status:'deleted'}).eq('id',id);await audit(u.id,'delete','file',id);return NextResponse.json({ok:true});
}catch(e){return errorResponse(e)}}

export async function PATCH(req:NextRequest){try{
 const u=await requireUser(req);const b=await req.json();if(!b.id)throw new ApiError(400,'Datei-ID fehlt.');
 const db=supabaseAdmin();const {data:file,error}=await db.from('files').select('*').eq('id',b.id).single();if(error||!file)throw error||new ApiError(404,'Datei nicht gefunden.');
 await entityAccess(u,file.entity_type,file.entity_id);
 if(!u.roles.some((r:string)=>['admin','office','foreman'].includes(r)))throw new ApiError(403,'Nur Büro/Administration darf Dateiberechtigungen ändern.');
 const allowed=['admin','office','site_members','selected'];if(!allowed.includes(b.visibility))throw new ApiError(400,'Ungültige Sichtbarkeit.');
 const values={visibility:b.visibility,visible_to:b.visibility==='selected'&&Array.isArray(b.visible_to)?b.visible_to:[]};
 const {data,error:ue}=await db.from('files').update(values).eq('id',b.id).select().single();if(ue)throw ue;
 await audit(u.id,'permissions','file',b.id,values);return NextResponse.json(data);
}catch(e){return errorResponse(e)}}
