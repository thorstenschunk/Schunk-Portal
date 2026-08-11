-- SCHUNK PORTAL 1.3.0
-- Baustellenbereiche/Gewerke sowie Mängel, Probleme, To-dos und Nachrichten

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
create index if not exists project_sections_site_idx on public.project_sections(construction_site_id, archived, sort_order);

create table if not exists public.project_items (
  id uuid primary key default gen_random_uuid(),
  construction_site_id uuid not null references public.construction_sites(id) on delete cascade,
  section_id uuid references public.project_sections(id) on delete set null,
  item_type text not null check (item_type in ('defect','problem','todo','message')),
  title text not null,
  description text,
  priority text not null default 'Normal' check (priority in ('Niedrig','Normal','Hoch','Dringend')),
  status text not null default 'Offen' check (status in ('Offen','In Arbeit','Erledigt','Geklärt')),
  assigned_to uuid references public.profiles(id),
  due_date date,
  created_by uuid not null references public.profiles(id),
  resolved_by uuid references public.profiles(id),
  resolved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists project_items_site_idx on public.project_items(construction_site_id, item_type, status, created_at desc);
create index if not exists project_items_section_idx on public.project_items(section_id, status);
create index if not exists project_items_assigned_idx on public.project_items(assigned_to, status);

create table if not exists public.project_item_comments (
  id uuid primary key default gen_random_uuid(),
  item_id uuid not null references public.project_items(id) on delete cascade,
  message text not null,
  created_by uuid not null references public.profiles(id),
  created_at timestamptz not null default now()
);
create index if not exists project_item_comments_item_idx on public.project_item_comments(item_id, created_at);

-- bestehende Dateiablage um Baustellenmeldungen erweitern
alter table public.files drop constraint if exists files_entity_type_check;
alter table public.files add constraint files_entity_type_check
  check (entity_type in ('site','report','profile','project_item'));

-- Mitarbeitende dürfen Meldungsfotos/Anhänge selbst hochladen.
-- Die API erzwingt weiterhin Baustellenmitgliedschaft und Zugriff.
