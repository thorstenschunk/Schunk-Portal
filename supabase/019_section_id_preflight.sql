-- SCHUNK PORTAL 1.5.0 – SECTION_ID PREFLIGHT
-- Diese Datei zuerst ausführen, wenn 017 mit ERROR 42703 section_id abbricht.
-- Keine Fachdaten werden gelöscht.

create table if not exists public.project_sections (
  id uuid primary key default gen_random_uuid(),
  construction_site_id uuid not null references public.construction_sites(id) on delete cascade,
  name text not null,
  sort_order integer not null default 0,
  archived boolean not null default false,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.project_items (
  id uuid primary key default gen_random_uuid(),
  construction_site_id uuid not null references public.construction_sites(id) on delete cascade,
  section_id uuid references public.project_sections(id) on delete set null,
  item_type text not null default 'todo',
  title text not null default '',
  description text,
  priority text not null default 'Normal',
  status text not null default 'Offen',
  assigned_to uuid references public.profiles(id),
  due_date date,
  created_by uuid references public.profiles(id),
  resolved_by uuid references public.profiles(id),
  resolved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.project_items
  add column if not exists section_id uuid references public.project_sections(id) on delete set null;

alter table public.work_reports
  add column if not exists section_id uuid references public.project_sections(id) on delete set null;

alter table public.time_entries
  add column if not exists section_id uuid references public.project_sections(id) on delete set null;

alter table public.work_report_materials
  add column if not exists section_id uuid references public.project_sections(id) on delete set null;

alter table public.project_tasks
  add column if not exists section_id uuid references public.project_sections(id) on delete set null;

alter table public.files
  add column if not exists section_id uuid references public.project_sections(id) on delete set null;

select
  table_name,
  column_name
from information_schema.columns
where table_schema='public'
  and column_name='section_id'
  and table_name in (
    'project_items',
    'work_reports',
    'time_entries',
    'work_report_materials',
    'project_tasks',
    'files'
  )
order by table_name;
