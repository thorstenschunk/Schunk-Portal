-- SCHUNK PORTAL 1.2.7
-- Baustellendokumente mit Sichtbarkeit pro Datei
alter table public.files add column if not exists description text;
alter table public.files add column if not exists visibility text not null default 'site_members';
alter table public.files add column if not exists visible_to uuid[] not null default '{}';

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'files_visibility_check'
  ) then
    alter table public.files
      add constraint files_visibility_check
      check (visibility in ('admin','office','site_members','selected'));
  end if;
end $$;

create index if not exists files_visibility_idx
  on public.files(entity_type, entity_id, visibility, upload_status);
