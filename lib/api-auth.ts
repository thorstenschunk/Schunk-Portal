import { NextRequest, NextResponse } from 'next/server';
import { assertServerConfig, supabaseAdmin, supabaseAnonServer } from './supabase-server';

export type PortalUser = {
  id: string;
  email: string | null;
  full_name: string;
  roles: string[];
  permissions: string[];
  active: boolean;
};

export function bearerToken(req: NextRequest) {
  const value = req.headers.get('authorization') || '';
  return value.startsWith('Bearer ') ? value.slice(7) : '';
}

export async function requireUser(req: NextRequest, permission?: string): Promise<PortalUser> {
  assertServerConfig();
  const token = bearerToken(req);
  if (!token) throw new ApiError(401, 'Nicht angemeldet.');

  const authClient = supabaseAnonServer();
  const { data: authData, error: authError } = await authClient.auth.getUser(token);
  if (authError || !authData.user) throw new ApiError(401, 'Sitzung ungültig oder abgelaufen.');

  const admin = supabaseAdmin();
  const { data: profile, error: profileError } = await admin
    .from('profiles')
    .select('id,full_name,active,archived')
    .eq('id', authData.user.id)
    .single();
  if (profileError || !profile || !profile.active || profile.archived) throw new ApiError(403, 'Benutzer ist gesperrt.');

  const { data: roleRows } = await admin
    .from('user_roles')
    .select('roles(code)')
    .eq('user_id', authData.user.id);
  const roles = (roleRows || []).map((r: any) => r.roles?.code).filter(Boolean) as string[];

  const { data: rolePermissionRows } = await admin
    .from('user_roles')
    .select('roles(role_permissions(permissions(code)))')
    .eq('user_id', authData.user.id);
  const base = new Set<string>();
  for (const row of rolePermissionRows || []) {
    const rp = (row as any).roles?.role_permissions || [];
    for (const item of rp) if (item.permissions?.code) base.add(item.permissions.code);
  }

  const { data: overrides } = await admin
    .from('user_permission_overrides')
    .select('allowed,permissions(code)')
    .eq('user_id', authData.user.id);
  for (const o of overrides || []) {
    const code = (o as any).permissions?.code;
    if (!code) continue;
    if (o.allowed) base.add(code); else base.delete(code);
  }

  const permissions = Array.from(base);
  if (permission && !roles.includes('admin') && !permissions.includes(permission)) {
    throw new ApiError(403, 'Keine Berechtigung für diese Funktion.');
  }

  return {
    id: authData.user.id,
    email: authData.user.email || null,
    full_name: profile.full_name,
    roles,
    permissions,
    active: profile.active,
  };
}

export class ApiError extends Error {
  constructor(public status: number, message: string) { super(message); }
}

export function errorResponse(error: unknown) {
  if (error instanceof ApiError) return NextResponse.json({ error: error.message }, { status: error.status });
  console.error(error);
  return NextResponse.json({ error: error instanceof Error ? error.message : 'Unbekannter Serverfehler.' }, { status: 500 });
}

export async function audit(userId: string, action: string, entity: string, entityId?: string, metadata?: unknown) {
  const admin = supabaseAdmin();
  await admin.from('audit_log').insert({ user_id: userId, action, entity, entity_id: entityId || null, metadata: metadata || null });
}

export function quarterTime(value: string) {
  return /^([01]\d|2[0-3]):(00|15|30|45)$/.test(value);
}

export function minutesBetween(start: string, end: string, pauseMinutes: number) {
  const [sh, sm] = start.split(':').map(Number);
  const [eh, em] = end.split(':').map(Number);
  return (eh * 60 + em) - (sh * 60 + sm) - pauseMinutes;
}
