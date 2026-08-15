-- SCHUNK PORTAL 1.5.0
-- Reparatur fehlender Foreign Keys zu public.profiles
-- Ursache der Vercel-Fehler PGRST200 bei Rapporte, Aufmaße und Audit-Log.
-- Bestehende Fachdaten werden nicht gelöscht.

begin;

-- ============================================================
-- 1. work_reports.created_by -> profiles.id
-- Erwarteter Name in der API:
-- work_reports_created_by_fkey
-- ============================================================

do $$
begin
  if to_regclass('public.work_reports') is null then
    raise exception 'Tabelle public.work_reports fehlt.';
  end if;

  if not exists (
    select 1
    from information_schema.columns
    where table_schema='public'
      and table_name='work_reports'
      and column_name='created_by'
  ) then
    alter table public.work_reports
      add column created_by uuid;
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conrelid='public.work_reports'::regclass
      and conname='work_reports_created_by_fkey'
  ) then
    alter table public.work_reports
      add constraint work_reports_created_by_fkey
      foreign key (created_by)
      references public.profiles(id)
      on delete set null
      not valid;
  end if;
end $$;

-- ============================================================
-- 2. measurements.created_by -> profiles.id
-- Erwarteter Name in der API:
-- measurements_created_by_fkey
-- ============================================================

do $$
begin
  if to_regclass('public.measurements') is null then
    raise exception 'Tabelle public.measurements fehlt.';
  end if;

  if not exists (
    select 1
    from information_schema.columns
    where table_schema='public'
      and table_name='measurements'
      and column_name='created_by'
  ) then
    alter table public.measurements
      add column created_by uuid;
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conrelid='public.measurements'::regclass
      and conname='measurements_created_by_fkey'
  ) then
    alter table public.measurements
      add constraint measurements_created_by_fkey
      foreign key (created_by)
      references public.profiles(id)
      on delete set null
      not valid;
  end if;
end $$;

-- ============================================================
-- 3. audit_log.user_id -> profiles.id
-- Die API verwendet profiles(full_name) ohne expliziten Hint.
-- ============================================================

do $$
begin
  if to_regclass('public.audit_log') is null then
    raise exception 'Tabelle public.audit_log fehlt.';
  end if;

  if not exists (
    select 1
    from information_schema.columns
    where table_schema='public'
      and table_name='audit_log'
      and column_name='user_id'
  ) then
    alter table public.audit_log
      add column user_id uuid;
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conrelid='public.audit_log'::regclass
      and conname='audit_log_user_id_fkey'
  ) then
    alter table public.audit_log
      add constraint audit_log_user_id_fkey
      foreign key (user_id)
      references public.profiles(id)
      on delete set null
      not valid;
  end if;
end $$;

-- ============================================================
-- 4. Zusätzlich die von der Rapport-Detailansicht erwartete
--    Revisions-Beziehung absichern.
-- ============================================================

do $$
begin
  if to_regclass('public.work_report_revisions') is not null
     and exists (
       select 1
       from information_schema.columns
       where table_schema='public'
         and table_name='work_report_revisions'
         and column_name='changed_by'
     )
     and not exists (
       select 1
       from pg_constraint
       where conrelid='public.work_report_revisions'::regclass
         and conname='work_report_revisions_changed_by_fkey'
     ) then
    alter table public.work_report_revisions
      add constraint work_report_revisions_changed_by_fkey
      foreign key (changed_by)
      references public.profiles(id)
      on delete set null
      not valid;
  end if;
end $$;

commit;

-- PostgREST / Supabase Schema-Cache neu laden.
notify pgrst, 'reload schema';

-- ============================================================
-- Kontrolle: Diese Beziehungen müssen anschließend erscheinen.
-- ============================================================

select
  conrelid::regclass::text as tabelle,
  conname as constraint_name,
  pg_get_constraintdef(oid) as definition,
  convalidated as validiert
from pg_constraint
where contype='f'
  and conname in (
    'work_reports_created_by_fkey',
    'measurements_created_by_fkey',
    'audit_log_user_id_fkey',
    'work_report_revisions_changed_by_fkey'
  )
order by conname;
