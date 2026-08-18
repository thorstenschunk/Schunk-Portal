-- SCHUNK PORTAL 1.7.0 – Mehrtägige Rapporte, Kundenverknüpfung, Neu-Zähler
-- Keine bestehenden Fachdaten werden gelöscht.

alter table public.assignments add column if not exists customer_id uuid references public.customers(id) on delete set null;

create table if not exists public.work_report_days(
  id uuid primary key default gen_random_uuid(),
  report_id uuid not null references public.work_reports(id) on delete cascade,
  work_date date not null,
  work_description text not null,
  remarks text,
  created_by uuid references public.profiles(id),
  closed_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  unique(report_id,work_date)
);
alter table public.work_report_members add column if not exists report_day_id uuid references public.work_report_days(id) on delete cascade;
alter table public.work_report_members drop constraint if exists work_report_members_report_id_user_id_key;
create unique index if not exists work_report_members_day_user_uidx on public.work_report_members(report_day_id,user_id) where report_day_id is not null;
alter table public.work_report_materials add column if not exists report_day_id uuid references public.work_report_days(id) on delete cascade;
alter table public.files add column if not exists report_day_id uuid references public.work_report_days(id) on delete set null;

insert into public.work_report_days(report_id,work_date,work_description,remarks,created_by)
select r.id,r.work_date,r.work_description,r.remarks,r.created_by from public.work_reports r
where not exists(select 1 from public.work_report_days d where d.report_id=r.id);

update public.work_report_members m set report_day_id=d.id
from public.work_report_days d where d.report_id=m.report_id and m.report_day_id is null;
update public.work_report_materials m set report_day_id=d.id
from public.work_report_days d where d.report_id=m.report_id and m.report_day_id is null;

create table if not exists public.user_seen_state(
  user_id uuid not null references public.profiles(id) on delete cascade,
  feed_type text not null,
  seen_at timestamptz not null default '1970-01-01',
  primary key(user_id,feed_type)
);

notify pgrst, 'reload schema';
