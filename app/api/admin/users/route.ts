import { NextRequest, NextResponse } from 'next/server';
import { ApiError, audit, errorResponse, requireUser } from '@/lib/api-auth';
import { supabaseAdmin } from '@/lib/supabase-server';

export const dynamic = 'force-dynamic';

async function adminGuard(req: NextRequest) {
  return requireUser(req, 'admin.users.manage');
}

async function isAdminUser(db: ReturnType<typeof supabaseAdmin>, userId: string) {
  const { data } = await db
    .from('user_roles')
    .select('roles!inner(code)')
    .eq('user_id', userId)
    .eq('roles.code', 'admin')
    .maybeSingle();
  return !!data;
}

async function activeAdminCount(db: ReturnType<typeof supabaseAdmin>) {
  const { data, error } = await db
    .from('user_roles')
    .select('user_id,roles!inner(code),profiles!inner(active,archived)')
    .eq('roles.code', 'admin')
    .eq('profiles.active', true)
    .eq('profiles.archived', false);
  if (error) throw error;
  return (data || []).length;
}

async function protectLastAdmin(db: ReturnType<typeof supabaseAdmin>, targetId: string) {
  if (await isAdminUser(db, targetId)) {
    const count = await activeAdminCount(db);
    if (count <= 1) throw new ApiError(409, 'Der letzte aktive Administrator kann nicht gesperrt oder herabgestuft werden.');
  }
}

export async function GET(req: NextRequest) {
  try {
    await adminGuard(req);
    const db = supabaseAdmin();
    const { data: profiles, error } = await db
      .from('profiles')
      .select('*,user_roles(role_id,roles(code,name)),user_permission_overrides(allowed,permission_id,permissions(code,name,module))')
      .order('full_name');
    if (error) throw error;

    const { data: authData, error: authError } = await db.auth.admin.listUsers({ page: 1, perPage: 1000 });
    if (authError) throw authError;
    const users = (authData.users || []) as any[];
    const authMap = new Map<string, any>(users.map((x: any) => [x.id, x]));

    return NextResponse.json((profiles || []).map((p: any) => {
      const a = authMap.get(p.id);
      return {
        ...p,
        email: a?.email || null,
        last_sign_in_at: a?.last_sign_in_at || null,
        email_confirmed_at: a?.email_confirmed_at || null,
      };
    }));
  } catch (e) {
    return errorResponse(e);
  }
}

export async function POST(req: NextRequest) {
  let createdUserId: string | null = null;
  try {
    const actor = await adminGuard(req);
    const b = await req.json();
    if (!b.email || !b.password || !b.full_name) throw new ApiError(400, 'Name, E-Mail und Startpasswort sind Pflicht.');
    if (String(b.password).length < 10) throw new ApiError(400, 'Startpasswort muss mindestens 10 Zeichen haben.');

    const db = supabaseAdmin();
    const { data, error } = await db.auth.admin.createUser({
      email: String(b.email).trim().toLowerCase(),
      password: String(b.password),
      email_confirm: true,
      user_metadata: { full_name: b.full_name },
    });
    if (error || !data.user) throw error || new Error('Benutzer konnte nicht angelegt werden.');
    createdUserId = data.user.id;

    const { error: profileError } = await db.from('profiles').update({
      full_name: b.full_name,
      employee_no: b.employee_no || null,
      phone: b.phone || null,
      weekly_hours: Number(b.weekly_hours || 40),
      vacation_days_year: Number(b.vacation_days_year || 30),
    }).eq('id', data.user.id);
    if (profileError) throw profileError;

    const { data: role, error: roleError } = await db.from('roles').select('id').eq('code', b.role_code || 'employee').single();
    if (roleError) throw roleError;
    const { error: roleInsertError } = await db.from('user_roles').insert({ user_id: data.user.id, role_id: role.id });
    if (roleInsertError) throw roleInsertError;

    await audit(actor.id, 'create', 'user', data.user.id, { email: b.email, role: b.role_code || 'employee' });
    return NextResponse.json({ id: data.user.id });
  } catch (e) {
    if (createdUserId) await supabaseAdmin().auth.admin.deleteUser(createdUserId).catch(() => undefined);
    return errorResponse(e);
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const actor = await adminGuard(req);
    const b = await req.json();
    if (!b.id) throw new ApiError(400, 'Benutzer-ID fehlt.');
    const db = supabaseAdmin();

    if (b.action === 'password') {
      if (String(b.password || '').length < 10) throw new ApiError(400, 'Passwort muss mindestens 10 Zeichen haben.');
      const { error } = await db.auth.admin.updateUserById(b.id, { password: b.password });
      if (error) throw error;
      await audit(actor.id, 'reset_password', 'user', b.id);
      return NextResponse.json({ ok: true });
    }

    if (b.action === 'email') {
      const { error } = await db.auth.admin.updateUserById(b.id, { email: String(b.email).trim().toLowerCase(), email_confirm: true });
      if (error) throw error;
      await audit(actor.id, 'change_email', 'user', b.id);
      return NextResponse.json({ ok: true });
    }

    if (b.action === 'role') {
      if (await isAdminUser(db, b.id) && b.role_code !== 'admin') await protectLastAdmin(db, b.id);
      const { data: role, error: roleError } = await db.from('roles').select('id').eq('code', b.role_code).single();
      if (roleError) throw roleError;
      await db.from('user_roles').delete().eq('user_id', b.id);
      const { error } = await db.from('user_roles').insert({ user_id: b.id, role_id: role.id });
      if (error) throw error;
      await audit(actor.id, 'change_role', 'user', b.id, { role: b.role_code });
      return NextResponse.json({ ok: true });
    }

    if (b.action === 'permissions') {
      await requireUser(req, 'admin.permissions.manage');
      const overrides = Array.isArray(b.overrides) ? b.overrides : [];
      await db.from('user_permission_overrides').delete().eq('user_id', b.id);
      if (overrides.length) {
        const { data: perms, error: pe } = await db.from('permissions').select('id,code').in('code', overrides.map((x: any) => x.code));
        if (pe) throw pe;
        const map = new Map((perms || []).map((x: any) => [x.code, x.id]));
        const rows = overrides
          .filter((x: any) => map.has(x.code))
          .map((x: any) => ({ user_id: b.id, permission_id: map.get(x.code), allowed: !!x.allowed }));
        if (rows.length) {
          const { error } = await db.from('user_permission_overrides').insert(rows);
          if (error) throw error;
        }
      }
      await audit(actor.id, 'change_permissions', 'user', b.id);
      return NextResponse.json({ ok: true });
    }

    const values: any = { updated_at: new Date().toISOString() };
    for (const k of ['full_name','employee_no','phone','weekly_hours','vacation_days_year','active','archived']) if (k in b) values[k] = b[k];

    if (b.id === actor.id && values.active === false) throw new ApiError(400, 'Der eigene Admin-Zugang kann nicht gesperrt werden.');
    if ((values.active === false || values.archived === true) && await isAdminUser(db, b.id)) await protectLastAdmin(db, b.id);

    const { data, error } = await db.from('profiles').update(values).eq('id', b.id).select().single();
    if (error) throw error;
    await audit(actor.id, 'update', 'user', b.id, values);
    return NextResponse.json(data);
  } catch (e) {
    return errorResponse(e);
  }
}
