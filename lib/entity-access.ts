import { ApiError, PortalUser } from './api-auth';
import { supabaseAdmin } from './supabase-server';

export function broadProjectAccess(user: PortalUser) {
  return user.roles.some(r => ['admin','office','foreman'].includes(r));
}

export async function requireSiteMembership(user: PortalUser, siteId: string) {
  if (broadProjectAccess(user)) return;
  const db = supabaseAdmin();
  const { data, error } = await db.from('construction_members').select('construction_site_id').eq('construction_site_id', siteId).eq('user_id', user.id).maybeSingle();
  if (error) throw error;
  if (!data) throw new ApiError(403, 'Keine Berechtigung für diese Baustelle.');
}

export async function requireReportAccess(user: PortalUser, reportId: string) {
  if (broadProjectAccess(user)) return;
  const db = supabaseAdmin();
  const { data, error } = await db.from('work_reports').select('created_by,work_report_members(user_id)').eq('id', reportId).single();
  if (error || !data) throw error || new ApiError(404, 'Rapport nicht gefunden.');
  const own = data.created_by === user.id || (data as any).work_report_members?.some((m:any) => m.user_id === user.id);
  if (!own) throw new ApiError(403, 'Keine Berechtigung für diesen Rapport.');
}


export async function requireProjectItemAccess(user:any,itemId:string){
  const db=supabaseAdmin();
  const {data:item,error}=await db.from('project_items').select('id,construction_site_id').eq('id',itemId).single();
  if(error||!item)throw new ApiError(404,'Eintrag nicht gefunden.');
  await requireSiteMembership(user,item.construction_site_id);
  return item;
}


export async function requireMeasurementAccess(user:any,measurementId:string){
  const db=supabaseAdmin();
  const {data:m,error}=await db.from('measurements').select('id,construction_site_id').eq('id',measurementId).single();
  if(error||!m)throw error||new ApiError(404,'Aufmaß nicht gefunden.');
  await requireSiteMembership(user,m.construction_site_id);
  return m;
}

export async function requireTaskAccess(user:any,id:string){
  const db=supabaseAdmin();const {data,error}=await db.from('project_tasks').select('id,construction_site_id,created_by,assigned_to').eq('id',id).single();
  if(error||!data)throw error||new ApiError(404,'Aufgabe nicht gefunden.');
  if(data.construction_site_id)await requireSiteMembership(user,data.construction_site_id);
  else if(!broadProjectAccess(user)&&data.created_by!==user.id&&data.assigned_to!==user.id)throw new ApiError(403,'Keine Berechtigung für diese Aufgabe.');
  return data;
}
export async function requireInternalMessageAccess(user:any,id:string){
  const db=supabaseAdmin();const {data,error}=await db.from('internal_messages').select('id,sender_id,recipient_id').eq('id',id).single();
  if(error||!data)throw error||new ApiError(404,'Nachricht nicht gefunden.');
  if(data.sender_id!==user.id&&data.recipient_id!==user.id&&!user.roles.includes('admin'))throw new ApiError(403,'Keine Berechtigung.');
  return data;
}
export async function requireAssignmentAccess(user:any,id:string){
  const db=supabaseAdmin();const {data,error}=await db.from('assignments').select('id,created_by,assignment_members(user_id)').eq('id',id).single();
  if(error||!data)throw error||new ApiError(404,'Kalendereintrag nicht gefunden.');
  if(!broadProjectAccess(user)&&data.created_by!==user.id&&!(data as any).assignment_members?.some((m:any)=>m.user_id===user.id))throw new ApiError(403,'Keine Berechtigung für diesen Termin.');
  return data;
}
export async function requirePurchaseRequestAccess(user:any,id:string){
  const db=supabaseAdmin();const {data,error}=await db.from('purchase_requests').select('id,construction_site_id,created_by').eq('id',id).single();
  if(error||!data)throw error||new ApiError(404,'Bestellanforderung nicht gefunden.');
  if(data.construction_site_id)await requireSiteMembership(user,data.construction_site_id);
  return data;
}
