-- SCHUNK PORTAL 1.5.0 – Reparatur ERROR 42703: section_id
-- Keine Fachdaten werden gelöscht.

alter table public.project_items
  add column if not exists section_id uuid references public.project_sections(id) on delete set null;

create index if not exists project_items_section_idx
  on public.project_items(section_id, status);

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
