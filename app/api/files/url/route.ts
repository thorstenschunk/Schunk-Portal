import { NextRequest,NextResponse } from 'next/server';
import { ApiError,errorResponse,requireUser } from '@/lib/api-auth';
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

export async function GET(req:NextRequest){try{
 const u=await requireUser(req);const id=req.nextUrl.searchParams.get('id');if(!id)throw new ApiError(400,'Datei-ID fehlt.');
 const db=supabaseAdmin();const {data:file,error}=await db.from('files').select('*').eq('id',id).eq('upload_status','ready').single();if(error||!file)throw error||new ApiError(404,'Datei nicht gefunden.');
 const broad=u.roles.some((r:string)=>['admin','office','foreman'].includes(r));
 if(!broad){
   if(file.visibility==='admin'||file.visibility==='office')throw new ApiError(403,'Keine Berechtigung für diese Datei.');
   if(file.visibility==='selected'&&!(Array.isArray(file.visible_to)&&file.visible_to.includes(u.id)))throw new ApiError(403,'Keine Berechtigung für diese Datei.');
 }
 const siteId=req.nextUrl.searchParams.get('site_id');
 if(file.entity_type==='report'&&siteId){
   const {data:report,error:re}=await db.from('work_reports').select('id,construction_site_id').eq('id',file.entity_id).single();
   if(re||!report)throw re||new ApiError(404,'Rapport nicht gefunden.');
   if(report.construction_site_id!==siteId)throw new ApiError(403,'Das Rapportbild gehört nicht zu dieser Baustelle.');
   await requireSiteMembership(u,siteId);
 }else{
   await entityAccess(u,file.entity_type,file.entity_id);
 }
 const {data,error:ue}=await db.storage.from('schunk-private').createSignedUrl(file.storage_path,300);if(ue)throw ue;
 return NextResponse.json({url:data.signedUrl,file});
}catch(e){return errorResponse(e)}}
