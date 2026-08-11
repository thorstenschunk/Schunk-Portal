-- SCHUNK PORTAL 1.0 – produktives Grundschema
-- Ausführen im Supabase SQL Editor.
-- Browserzugriffe auf Fachdaten sind absichtlich gesperrt; Zugriff erfolgt über die serverseitige API.

create extension if not exists pgcrypto;
create extension if not exists btree_gist;

-- ===== Rollen und Benutzer =====
create table if not exists public.roles (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  description text,
  created_at timestamptz not null default now()
);

create table if not exists public.permissions (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  module text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  employee_no text unique,
  phone text,
  weekly_hours numeric(5,2) not null default 40,
  vacation_days_year numeric(5,2) not null default 30,
  active boolean not null default true,
  archived boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.user_roles (
  user_id uuid not null references public.profiles(id) on delete cascade,
  role_id uuid not null references public.roles(id) on delete cascade,
  primary key(user_id, role_id)
);

create table if not exists public.role_permissions (
  role_id uuid not null references public.roles(id) on delete cascade,
  permission_id uuid not null references public.permissions(id) on delete cascade,
  primary key(role_id, permission_id)
);

create table if not exists public.user_permission_overrides (
  user_id uuid not null references public.profiles(id) on delete cascade,
  permission_id uuid not null references public.permissions(id) on delete cascade,
  allowed boolean not null,
  primary key(user_id, permission_id)
);

create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path=public as $$
begin
  insert into public.profiles(id, full_name)
  values(new.id, coalesce(nullif(new.raw_user_meta_data->>'full_name',''), new.email, 'Benutzer'))
  on conflict (id) do nothing;
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
for each row execute function public.handle_new_user();
revoke all on function public.handle_new_user() from public, anon, authenticated;

-- ===== Kunden / Baustellen =====
create sequence if not exists public.customer_seq start 1000;
create table if not exists public.customers (
  id uuid primary key default gen_random_uuid(),
  customer_no text not null unique default ('KD-'||to_char(now(),'YYYY')||'-'||lpad(nextval('public.customer_seq')::text,5,'0')),
  salutation text check (salutation in ('Herr','Frau','Firma') or salutation is null),
  name text not null,
  email text,
  phone text,
  street text,
  postal_code text,
  city text,
  notes text,
  archived boolean not null default false,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create sequence if not exists public.site_seq start 1000;
create table if not exists public.construction_sites (
  id uuid primary key default gen_random_uuid(),
  project_no text not null unique default ('BS-'||to_char(now(),'YYYY')||'-'||lpad(nextval('public.site_seq')::text,5,'0')),
  title text not null,
  customer_id uuid references public.customers(id),
  street text,
  postal_code text,
  city text,
  contact_name text,
  contact_phone text,
  contact_email text,
  status text not null default 'Geplant' check(status in ('Geplant','Aktiv','Pausiert','Abgeschlossen','Archiviert')),
  priority text not null default 'Normal' check(priority in ('Niedrig','Normal','Hoch','Kritisch')),
  description text,
  start_date date,
  end_date date,
  archived boolean not null default false,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.construction_members (
  construction_site_id uuid not null references public.construction_sites(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  role_label text,
  primary key(construction_site_id,user_id)
);

create table if not exists public.project_tasks (
  id uuid primary key default gen_random_uuid(),
  construction_site_id uuid not null references public.construction_sites(id) on delete cascade,
  title text not null,
  description text,
  assigned_to uuid references public.profiles(id),
  due_date date,
  priority text not null default 'Normal' check(priority in ('Niedrig','Normal','Hoch')),
  status text not null default 'Offen' check(status in ('Offen','In Arbeit','Erledigt')),
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.project_notes (
  id uuid primary key default gen_random_uuid(),
  construction_site_id uuid not null references public.construction_sites(id) on delete cascade,
  note text not null,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now()
);

-- ===== Dateien =====
create table if not exists public.files (
  id uuid primary key default gen_random_uuid(),
  entity_type text not null check(entity_type in ('site','report','profile')),
  entity_id uuid not null,
  category text not null,
  title text,
  file_name text not null,
  storage_path text not null unique,
  mime_type text,
  size_bytes bigint,
  description text,
  visibility text not null default 'site_members' check(visibility in ('admin','office','site_members','selected')),
  visible_to uuid[] not null default '{}',
  upload_status text not null default 'pending' check(upload_status in ('pending','ready','deleted')),
  uploaded_by uuid references public.profiles(id),
  created_at timestamptz not null default now()
);

-- ===== Zeiterfassung =====
create table if not exists public.time_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id),
  construction_site_id uuid references public.construction_sites(id),
  work_date date not null,
  start_time time not null,
  end_time time not null,
  pause_minutes integer not null default 0 check(pause_minutes >= 0 and pause_minutes % 15 = 0),
  travel_setup_minutes integer not null default 0 check(travel_setup_minutes >= 0 and travel_setup_minutes % 15 = 0),
  total_minutes integer not null check(total_minutes >= 0 and total_minutes % 15 = 0),
  activity text,
  notes text,
  source_report_id uuid,
  locked boolean not null default false,
  submitted_at timestamptz,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint time_order check(end_time > start_time),
  constraint quarter_start check(extract(minute from start_time)::int % 15 = 0 and extract(second from start_time)=0),
  constraint quarter_end check(extract(minute from end_time)::int % 15 = 0 and extract(second from end_time)=0)
);

create unique index if not exists time_entries_report_user_unique on public.time_entries(source_report_id,user_id) where source_report_id is not null;
do $$ begin
  if not exists(select 1 from pg_constraint where conname='time_entries_no_overlap') then
    alter table public.time_entries add constraint time_entries_no_overlap
      exclude using gist (
        user_id with =,
        tsrange((work_date + start_time)::timestamp, (work_date + end_time)::timestamp, '[)') with &&
      );
  end if;
end $$;

create table if not exists public.time_entry_revisions (
  id bigint generated always as identity primary key,
  time_entry_id uuid not null references public.time_entries(id) on delete cascade,
  changed_by uuid references public.profiles(id),
  reason text not null,
  before_data jsonb not null,
  after_data jsonb not null,
  created_at timestamptz not null default now()
);

create table if not exists public.absences (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id),
  absence_type text not null check(absence_type in ('Urlaub','Krankheit','Freizeitausgleich','Berufsschule','Sonstiges')),
  start_date date not null,
  end_date date not null,
  status text not null default 'Genehmigt' check(status in ('Beantragt','Genehmigt','Abgelehnt')),
  notes text,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  constraint absence_range check(end_date >= start_date)
);

-- ===== Rapporte =====
create sequence if not exists public.report_seq start 1000;
create table if not exists public.work_reports (
  id uuid primary key default gen_random_uuid(),
  report_no text not null unique default ('RAP-'||to_char(now(),'YYYY')||'-'||lpad(nextval('public.report_seq')::text,5,'0')),
  construction_site_id uuid not null references public.construction_sites(id),
  work_date date not null,
  customer_salutation text check(customer_salutation in ('Herr','Frau','Firma') or customer_salutation is null),
  customer_name text,
  work_description text not null,
  remarks text,
  work_completed boolean,
  locked_at timestamptz,
  locked_by uuid references public.profiles(id),
  pdf_file_id uuid references public.files(id),
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.work_report_members (
  id uuid primary key default gen_random_uuid(),
  report_id uuid not null references public.work_reports(id) on delete cascade,
  user_id uuid not null references public.profiles(id),
  start_time time not null,
  end_time time not null,
  pause_minutes integer not null default 0 check(pause_minutes >= 0 and pause_minutes % 15 = 0),
  travel_setup_minutes integer not null default 0 check(travel_setup_minutes >= 0 and travel_setup_minutes % 15 = 0),
  total_minutes integer not null check(total_minutes >= 0 and total_minutes % 15 = 0),
  constraint wr_quarter_start check(extract(minute from start_time)::int % 15 = 0 and extract(second from start_time)=0),
  constraint wr_quarter_end check(extract(minute from end_time)::int % 15 = 0 and extract(second from end_time)=0),
  unique(report_id,user_id)
);

create table if not exists public.work_report_materials (
  id uuid primary key default gen_random_uuid(),
  report_id uuid not null references public.work_reports(id) on delete cascade,
  quantity numeric(12,3),
  unit text,
  description text not null
);

-- ===== Disposition =====
create table if not exists public.assignments (
  id uuid primary key default gen_random_uuid(),
  construction_site_id uuid references public.construction_sites(id),
  title text not null,
  start_at timestamptz not null,
  end_at timestamptz not null,
  notes text,
  status text not null default 'Geplant' check(status in ('Geplant','Bestätigt','Erledigt','Abgesagt')),
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint assignment_range check(end_at > start_at)
);

create table if not exists public.assignment_members (
  assignment_id uuid not null references public.assignments(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  primary key(assignment_id,user_id)
);

-- ===== Audit =====
create table if not exists public.audit_log (
  id bigint generated always as identity primary key,
  user_id uuid references public.profiles(id),
  action text not null,
  entity text not null,
  entity_id text,
  metadata jsonb,
  created_at timestamptz not null default now()
);

-- ===== Portaleinstellungen =====
create table if not exists public.portal_settings (
  id integer primary key default 1 check(id=1),
  company_name text not null default 'Design Tischlerei Schunk',
  street text, postal_code text, city text, phone text, email text, website text,
  default_weekly_hours numeric(5,2) not null default 40,
  default_vacation_days numeric(5,2) not null default 30,
  report_footer text,
  updated_by uuid references public.profiles(id),
  updated_at timestamptz not null default now()
);
insert into public.portal_settings(id) values(1) on conflict(id) do nothing;

-- ===== Basisrechte =====
insert into public.roles(code,name,description) values
('admin','Administrator','Vollzugriff'),
('office','Büro','Büro und Projektorganisation'),
('foreman','Projektleiter','Baustellenleitung und Team'),
('employee','Mitarbeiter','Eigene Baustellen, Zeiten und Rapporte')
on conflict(code) do nothing;

insert into public.permissions(code,name,module) values
('dashboard.read','Dashboard ansehen','Dashboard'),
('customers.read','Kunden ansehen','Kunden'),('customers.manage','Kunden verwalten','Kunden'),
('sites.read','Baustellen ansehen','Baustellen'),('sites.manage','Baustellen verwalten','Baustellen'),
('project.files.read','Dateien ansehen','Dokumentation'),('project.files.upload','Dateien hochladen','Dokumentation'),('project.files.delete','Dateien löschen','Dokumentation'),
('project.tasks.manage','Aufgaben verwalten','Baustellen'),('project.notes.manage','Notizen verwalten','Baustellen'),
('time.own','Eigene Zeiten','Zeiterfassung'),('time.all','Alle Zeiten ansehen','Zeiterfassung'),('time.correct','Zeiten korrigieren','Zeiterfassung'),
('absence.own','Eigene Abwesenheiten','Personal'),('absence.manage','Abwesenheiten verwalten','Personal'),
('reports.read','Rapporte ansehen','Rapporte'),('reports.create','Rapporte erstellen','Rapporte'),('reports.finalize','Rapporte abschließen','Rapporte'),
('calendar.read','Disposition ansehen','Disposition'),('calendar.manage','Disposition verwalten','Disposition'),
('admin.users.manage','Benutzer verwalten','Administration'),('admin.permissions.manage','Rechte verwalten','Administration'),('audit.read','Audit-Log ansehen','Administration')
on conflict(code) do nothing;

-- Admin erhält alle Rechte
insert into public.role_permissions(role_id,permission_id)
select r.id,p.id from public.roles r cross join public.permissions p where r.code='admin'
on conflict do nothing;

-- Büro
insert into public.role_permissions(role_id,permission_id)
select r.id,p.id from public.roles r join public.permissions p on p.code in (
'dashboard.read','customers.read','customers.manage','sites.read','sites.manage','project.files.read','project.files.upload','project.files.delete','project.tasks.manage','project.notes.manage','time.all','time.correct','absence.manage','reports.read','reports.create','reports.finalize','calendar.read','calendar.manage','audit.read') where r.code='office'
on conflict do nothing;

-- Projektleiter
insert into public.role_permissions(role_id,permission_id)
select r.id,p.id from public.roles r join public.permissions p on p.code in (
'dashboard.read','customers.read','sites.read','sites.manage','project.files.read','project.files.upload','project.tasks.manage','project.notes.manage','time.own','time.all','absence.own','reports.read','reports.create','reports.finalize','calendar.read','calendar.manage') where r.code='foreman'
on conflict do nothing;

-- Mitarbeiter
insert into public.role_permissions(role_id,permission_id)
select r.id,p.id from public.roles r join public.permissions p on p.code in (
'dashboard.read','sites.read','project.files.read','project.files.upload','project.notes.manage','time.own','absence.own','reports.read','reports.create','reports.finalize','reports.sign','calendar.read') where r.code='employee'
on conflict do nothing;

-- RLS bewusst ohne Browser-Policies: direkter DB-Zugriff ist gesperrt.
do $$ declare t text; begin
  foreach t in array array['roles','permissions','profiles','user_roles','role_permissions','user_permission_overrides','customers','construction_sites','construction_members','project_tasks','project_notes','files','time_entries','time_entry_revisions','absences','work_reports','work_report_members','work_report_materials','assignments','assignment_members','audit_log','portal_settings']
  loop execute format('alter table public.%I enable row level security', t); end loop;
end $$;

-- Privater Dateispeicher. Keine Storage-Policies: nur serverseitige Service-Role erzeugt signierte URLs.
insert into storage.buckets(id,name,public,file_size_limit)
values('schunk-private','schunk-private',false,52428800)
on conflict(id) do update set public=false,file_size_limit=52428800;

-- Bootstrap-Funktion: nach Anlegen des ersten Auth-Benutzers im SQL Editor aufrufen:
-- select public.bootstrap_admin('deine@email.de');
create or replace function public.bootstrap_admin(p_email text) returns void
language plpgsql security definer set search_path=public,auth as $$
declare uid uuid; rid uuid;
begin
  select id into uid from auth.users where lower(email)=lower(p_email) limit 1;
  if uid is null then raise exception 'Kein Auth-Benutzer mit dieser E-Mail gefunden'; end if;
  insert into public.profiles(id,full_name) values(uid,p_email) on conflict(id) do nothing;
  select id into rid from public.roles where code='admin';
  insert into public.user_roles(user_id,role_id) values(uid,rid) on conflict do nothing;
end $$;

revoke all on function public.bootstrap_admin(text) from public, anon, authenticated;
