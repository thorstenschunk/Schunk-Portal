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
