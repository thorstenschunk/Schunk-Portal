-- SCHUNK PORTAL 1.1 – Migration. Bestehende Fachdaten werden nicht gelöscht.
begin;
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
insert into public.portal_settings(id,company_name,street,postal_code,city,phone,email,website)
values(1,'Design Tischlerei Schunk','Industriestr. 9','53359','Rheinbach','02226 895 985 3','info@t-schunk.de','www.t-schunk.de')
on conflict(id) do nothing;
alter table public.portal_settings enable row level security;
commit;
