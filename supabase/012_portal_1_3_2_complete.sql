-- SCHUNK PORTAL 1.3.2 – KOMPLETTE MIGRATION
-- Enthält die Datenbankänderungen von 1.3.0, 1.3.1 und 1.3.2.
-- Bestehende Fachdaten werden nicht gelöscht.

-- SCHUNK PORTAL 1.3.1 – KOMPLETTE MIGRATION
-- Kann direkt von einer 1.2.7-Datenbank aus ausgeführt werden.
-- Enthält 1.3.0 + 1.3.1 und löscht keine bestehenden Fachdaten.

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


-- SCHUNK PORTAL 1.3.1
-- Unterkategorien als echte zweite Ebene einer Baustelle

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

create index if not exists work_reports_section_idx on public.work_reports(section_id, work_date);
create index if not exists time_entries_section_idx on public.time_entries(section_id, work_date);
create index if not exists work_report_materials_section_idx on public.work_report_materials(section_id);
create index if not exists project_tasks_section_idx on public.project_tasks(section_id, status);
create index if not exists files_section_idx on public.files(section_id, upload_status);

-- Bereits vorhandene Daten bleiben unter "Allgemein" (section_id = null).


-- SCHUNK PORTAL 1.3.2
-- Admin-Bearbeitung abgeschlossener Rapporte + Änderungsverlauf

create table if not exists public.work_report_revisions (
  id bigint generated always as identity primary key,
  report_id uuid not null references public.work_reports(id) on delete cascade,
  changed_by uuid not null references public.profiles(id),
  reason text not null,
  before_data jsonb not null,
  after_data jsonb not null,
  created_at timestamptz not null default now()
);

create index if not exists work_report_revisions_report_idx
  on public.work_report_revisions(report_id, created_at desc);

create or replace function public.admin_update_work_report(
  p_report_id uuid,
  p_changed_by uuid,
  p_reason text,
  p_construction_site_id uuid,
  p_section_id uuid,
  p_work_date date,
  p_customer_salutation text,
  p_customer_name text,
  p_work_description text,
  p_remarks text,
  p_work_completed boolean,
  p_members jsonb,
  p_materials jsonb
) returns public.work_reports
language plpgsql
security definer
set search_path=public
as $$
declare
  v_old public.work_reports;
  v_result public.work_reports;
  v_before jsonb;
  v_after jsonb;
  m jsonb;
  mat jsonb;
  v_total integer;
begin
  if nullif(trim(coalesce(p_reason,'')),'') is null then
    raise exception 'Änderungsgrund ist Pflicht.';
  end if;

  select * into v_old from public.work_reports where id=p_report_id for update;
  if not found then raise exception 'Rapport nicht gefunden.'; end if;

  if not exists(select 1 from public.construction_sites where id=p_construction_site_id) then
    raise exception 'Baustelle nicht gefunden.';
  end if;
  if p_section_id is not null and not exists(
    select 1 from public.project_sections
    where id=p_section_id and construction_site_id=p_construction_site_id and archived=false
  ) then
    raise exception 'Unterkategorie gehört nicht zur gewählten Baustelle.';
  end if;

  select jsonb_build_object(
    'report',to_jsonb(v_old),
    'members',coalesce((select jsonb_agg(to_jsonb(x) order by x.id) from public.work_report_members x where x.report_id=p_report_id),'[]'::jsonb),
    'materials',coalesce((select jsonb_agg(to_jsonb(x) order by x.id) from public.work_report_materials x where x.report_id=p_report_id),'[]'::jsonb),
    'time_entries',coalesce((select jsonb_agg(to_jsonb(x) order by x.id) from public.time_entries x where x.source_report_id=p_report_id),'[]'::jsonb)
  ) into v_before;

  update public.work_reports set
    construction_site_id=p_construction_site_id,
    section_id=p_section_id,
    work_date=p_work_date,
    customer_salutation=nullif(p_customer_salutation,''),
    customer_name=nullif(p_customer_name,''),
    work_description=trim(p_work_description),
    remarks=nullif(p_remarks,''),
    work_completed=p_work_completed,
    updated_at=now()
  where id=p_report_id
  returning * into v_result;

  delete from public.work_report_members where report_id=p_report_id;
  for m in select * from jsonb_array_elements(coalesce(p_members,'[]'::jsonb))
  loop
    v_total :=
      ((split_part(m->>'end_time',':',1)::int*60 + split_part(m->>'end_time',':',2)::int)
      -(split_part(m->>'start_time',':',1)::int*60 + split_part(m->>'start_time',':',2)::int)
      -coalesce((m->>'pause_minutes')::int,0));
    if v_total < 0 then raise exception 'Ungültige Mitarbeiterzeit.'; end if;
    insert into public.work_report_members(
      report_id,user_id,start_time,end_time,pause_minutes,travel_setup_minutes,total_minutes
    ) values(
      p_report_id,(m->>'user_id')::uuid,(m->>'start_time')::time,(m->>'end_time')::time,
      coalesce((m->>'pause_minutes')::int,0),coalesce((m->>'travel_setup_minutes')::int,0),v_total
    );
  end loop;

  delete from public.work_report_materials where report_id=p_report_id;
  for mat in select * from jsonb_array_elements(coalesce(p_materials,'[]'::jsonb))
  loop
    if nullif(trim(coalesce(mat->>'description','')),'') is not null then
      insert into public.work_report_materials(report_id,section_id,quantity,unit,description)
      values(
        p_report_id,p_section_id,
        case when nullif(mat->>'quantity','') is null then null else (mat->>'quantity')::numeric end,
        nullif(mat->>'unit',''),
        trim(mat->>'description')
      );
    end if;
  end loop;

  -- Bereits übernommene Zeiten eines abgeschlossenen Rapports immer synchron halten.
  if v_old.locked_at is not null then
    delete from public.time_entries where source_report_id=p_report_id;
    insert into public.time_entries(
      user_id,construction_site_id,section_id,work_date,start_time,end_time,
      pause_minutes,travel_setup_minutes,total_minutes,activity,source_report_id,
      locked,submitted_at,created_by
    )
    select
      wrm.user_id,p_construction_site_id,p_section_id,p_work_date,wrm.start_time,wrm.end_time,
      wrm.pause_minutes,wrm.travel_setup_minutes,wrm.total_minutes,p_work_description,p_report_id,
      true,now(),p_changed_by
    from public.work_report_members wrm
    where wrm.report_id=p_report_id;
  end if;

  select jsonb_build_object(
    'report',to_jsonb(v_result),
    'members',coalesce((select jsonb_agg(to_jsonb(x) order by x.id) from public.work_report_members x where x.report_id=p_report_id),'[]'::jsonb),
    'materials',coalesce((select jsonb_agg(to_jsonb(x) order by x.id) from public.work_report_materials x where x.report_id=p_report_id),'[]'::jsonb),
    'time_entries',coalesce((select jsonb_agg(to_jsonb(x) order by x.id) from public.time_entries x where x.source_report_id=p_report_id),'[]'::jsonb)
  ) into v_after;

  insert into public.work_report_revisions(report_id,changed_by,reason,before_data,after_data)
  values(p_report_id,p_changed_by,trim(p_reason),v_before,v_after);

  return v_result;
end $$;

revoke all on function public.admin_update_work_report(
  uuid,uuid,text,uuid,uuid,date,text,text,text,text,boolean,jsonb,jsonb
) from public, anon, authenticated;
grant execute on function public.admin_update_work_report(
  uuid,uuid,text,uuid,uuid,date,text,text,text,text,boolean,jsonb,jsonb
) to service_role;
