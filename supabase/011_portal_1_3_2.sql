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
