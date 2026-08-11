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
