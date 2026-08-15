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

export async function POST(req:NextRequest){try{
 const u=await requireUser(req);const b=await req.json();
 const allowed=['site','report','profile','project_item','measurement','task','internal_message','assignment','purchase_request'];
 if(!allowed.includes(b.entity_type)||!b.entity_id||!b.file_name)throw new ApiError(400,'Ungültige Dateiangaben.');
 await entityAccess(u,b.entity_type,b.entity_id);
 if(b.entity_type==='report'){const {data:r}=await supabaseAdmin().from('work_reports').select('locked_at').eq('id',b.entity_id).single();if(r?.locked_at)throw new ApiError(409,'Abgeschlossene Rapporte sind unveränderbar.');}
 const size=Number(b.size_bytes||0);if(size<=0||size>52428800)throw new ApiError(400,'Datei muss zwischen 1 Byte und 50 MB groß sein.');
 const dangerous=/\.(html?|js|mjs|svg|exe|bat|cmd|ps1|sh)$/i.test(String(b.file_name));if(dangerous)throw new ApiError(400,'Dieser Dateityp ist nicht zulässig.');
 const db=supabaseAdmin();const rawExt=String(b.file_name).includes('.')?(String(b.file_name).split('.').pop()||''):'';const ext=rawExt?'.'+rawExt.replace(/[^a-z0-9]/gi,'').slice(0,8):'';
 const path=`${b.entity_type}/${b.entity_id}/${Date.now()}_${crypto.randomUUID()}${ext}`;
 const {data:signed,error:se}=await db.storage.from('schunk-private').createSignedUploadUrl(path);if(se)throw se;
 const {data:file,error:fe}=await db.from('files').insert({entity_type:b.entity_type,entity_id:b.entity_id,category:b.category||'attachment',title:b.title||b.file_name,file_name:b.file_name,storage_path:path,mime_type:b.mime_type||null,size_bytes:size,description:b.description||null,section_id:b.section_id||null,visibility:'site_members',visible_to:[],upload_status:'pending',uploaded_by:u.id}).select().single();if(fe)throw fe;
 await audit(u.id,'prepare_upload','file',file.id,{entity_type:b.entity_type,entity_id:b.entity_id});
 return NextResponse.json({file_id:file.id,bucket:'schunk-private',path,token:signed.token});
}catch(e){return errorResponse(e)}}
