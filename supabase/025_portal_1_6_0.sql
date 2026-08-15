-- SCHUNK PORTAL 1.6.0 – Upgrade bestehende Datenbank
-- Keine bestehenden Fachdaten werden gelöscht.

-- Freie Rapporte / Kleinaufträge
alter table public.work_reports alter column construction_site_id drop not null;
alter table public.work_reports add column if not exists customer_street text;
alter table public.work_reports add column if not exists customer_postal_code text;
alter table public.work_reports add column if not exists customer_city text;
alter table public.work_reports add column if not exists customer_contact text;

-- Aufgaben erweitern
alter table public.project_tasks alter column construction_site_id drop not null;
alter table public.project_tasks add column if not exists section_id uuid references public.project_sections(id) on delete set null;
alter table public.project_tasks add column if not exists completed_at timestamptz;

create table if not exists public.project_task_comments (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references public.project_tasks(id) on delete cascade,
  user_id uuid not null references public.profiles(id),
  message text not null,
  created_at timestamptz not null default now()
);
create index if not exists project_task_comments_task_idx on public.project_task_comments(task_id,created_at);

-- Kalender detaillierter
alter table public.assignments add column if not exists description text;
alter table public.assignments add column if not exists location text;

-- Bestellanforderungen
create table if not exists public.purchase_requests (
  id uuid primary key default gen_random_uuid(),
  construction_site_id uuid references public.construction_sites(id) on delete set null,
  section_id uuid references public.project_sections(id) on delete set null,
  quantity numeric(12,3),
  unit text,
  description text not null,
  notes text,
  status text not null default 'Neu' check(status in ('Neu','Bestellt','Geliefert','Erledigt')),
  created_by uuid not null references public.profiles(id),
  updated_by uuid references public.profiles(id),
  admin_seen_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists purchase_requests_status_idx on public.purchase_requests(status,created_at desc);

-- Dateiablage um neue Entitäten erweitern
alter table public.files drop constraint if exists files_entity_type_check;
alter table public.files add constraint files_entity_type_check
  check(entity_type in ('site','report','profile','project_item','measurement','task','internal_message','assignment','purchase_request'));

notify pgrst, 'reload schema';
