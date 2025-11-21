-- 1) Enums
create type upload_status as enum ('uploaded','processing','metrics_ready','reported','error');
create type sim_title as enum ('iRacing','ACC','AC','rFactor2','AMS2','F1','Other');

-- 2) Profiles
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  display_name text,
  avatar_url text
);

-- bootstrap profile on sign-up
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id) values (new.id) on conflict do nothing;
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- 3) Uploads
create table public.uploads (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  filename text not null,
  size_bytes bigint not null check (size_bytes >= 0),
  storage_path text not null unique,         -- telemetry/{user_id}/{id}.csv
  sim sim_title not null default 'Other',
  track text,
  car text,
  session_date date,
  lap_count int,
  status upload_status not null default 'uploaded',
  error_message text
);
create index uploads_user_created_idx on public.uploads (user_id, created_at desc);
create index uploads_status_idx on public.uploads (status);

-- 4) Metrics (1:1 with upload)
create table public.metrics (
  id uuid primary key default gen_random_uuid(),
  upload_id uuid not null unique references public.uploads(id) on delete cascade,
  computed_at timestamptz not null default now(),
  avg_lap_time_ms int,
  best_lap_time_ms int,
  std_lap_time_ms int,
  lap_consistency numeric(6,3),
  brake_efficiency numeric(6,3),
  throttle_smoothness numeric(6,3),
  corner_entry numeric(6,3),
  corner_exit numeric(6,3),
  invalid_laps int default 0,
  kpi_json jsonb
);

-- 5) AI Reports (1:1 with upload)
create table public.reports (
  id uuid primary key default gen_random_uuid(),
  upload_id uuid not null unique references public.uploads(id) on delete cascade,
  created_at timestamptz not null default now(),
  model text,
  prompt_tokens int,
  completion_tokens int,
  report jsonb not null
);
alter table public.reports
  add constraint reports_report_min_keys_ck
  check (
    report ? 'pace'
    and report ? 'braking'
    and report ? 'throttle'
    and report ? 'corners'
    and report ? 'sessionPlan'
  );

-- 6) RLS
alter table public.profiles enable row level security;
alter table public.uploads  enable row level security;
alter table public.metrics  enable row level security;
alter table public.reports  enable row level security;

-- profiles RLS
drop policy if exists "read_own_profile" on public.profiles;
create policy "read_own_profile" on public.profiles
  for select using (auth.uid() = id);
drop policy if exists "update_own_profile" on public.profiles;
create policy "update_own_profile" on public.profiles
  for update using (auth.uid() = id);
drop policy if exists "insert_own_profile" on public.profiles;
create policy "insert_own_profile" on public.profiles
  for insert with check (auth.uid() = id);

-- uploads RLS
drop policy if exists "ins_own_upload" on public.uploads;
create policy "ins_own_upload" on public.uploads
  for insert with check (auth.uid() = user_id);
drop policy if exists "own_uploads_rw" on public.uploads;
create policy "own_uploads_rw" on public.uploads
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- metrics/reports RLS via ownership of upload
drop policy if exists "own_metrics" on public.metrics;
create policy "own_metrics" on public.metrics
  using (exists (select 1 from public.uploads u where u.id = metrics.upload_id and u.user_id = auth.uid()))
  with check (exists (select 1 from public.uploads u where u.id = metrics.upload_id and u.user_id = auth.uid()));

drop policy if exists "own_reports" on public.reports;
create policy "own_reports" on public.reports
  using (exists (select 1 from public.uploads u where u.id = reports.upload_id and u.user_id = auth.uid()))
  with check (exists (select 1 from public.uploads u where u.id = reports.upload_id and u.user_id = auth.uid()));

-- 7) View
create view public.uploads_with_status as
select
  u.*,
  (m.id is not null) as has_metrics,
  (r.id is not null) as has_report
from public.uploads u
left join public.metrics m on m.upload_id = u.id
left join public.reports r on r.upload_id = u.id;

-- 8) Privileges
revoke all on schema public from anon, authenticated;
grant usage on schema public to anon, authenticated;

revoke insert on public.profiles from authenticated;
grant  update, select on public.profiles to authenticated;

grant select, insert, update, delete on public.uploads, public.metrics, public.reports to authenticated;
revoke select on public.uploads_with_status from anon;
grant  select on public.uploads_with_status to authenticated;

-- 9) Storage bucket + RLS
insert into storage.buckets (id, name, public)
values ('telemetry','telemetry', false)
on conflict (id) do nothing;

drop policy if exists "own_file_read" on storage.objects;
create policy "own_file_read" on storage.objects
  for select using (
    bucket_id = 'telemetry'
    and (owner = auth.uid() or position(auth.uid()::text in name) > 0)
  );

drop policy if exists "own_file_write" on storage.objects;
create policy "own_file_write" on storage.objects
  for insert with check (
    bucket_id = 'telemetry'
    and (owner = auth.uid() or position(auth.uid()::text in name) > 0)
  );

drop policy if exists own_file_update_delete on storage.objects;
create policy "own_file_update_delete" on storage.objects
  for update using (
    bucket_id = 'telemetry'
    and (owner = auth.uid() or position(auth.uid()::text in name) > 0)
  )
  with check (
    bucket_id = 'telemetry'
    and (owner = auth.uid() or position(auth.uid()::text in name) > 0)
  );

-- 10) Status triggers (idempotent)
create or replace function public.mark_metrics_ready()
returns trigger language plpgsql security definer as $$
begin
  update public.uploads
     set status = 'metrics_ready'
   where id = new.upload_id
     and status <> 'reported';
  return new;
end $$;

create or replace function public.mark_reported()
returns trigger language plpgsql security definer as $$
begin
  update public.uploads
     set status = 'reported'
   where id = new.upload_id
     and status <> 'reported';
  return new;
end $$;

drop trigger if exists trg_metrics_ready on public.metrics;
create trigger trg_metrics_ready after insert on public.metrics
for each row execute function public.mark_metrics_ready();

drop trigger if exists trg_reported on public.reports;
create trigger trg_reported after insert on public.reports
for each row execute function public.mark_reported();

-- 11) Notes
comment on type upload_status is 'Keep in sync with UI status strings';
comment on type sim_title      is 'UI enum for sim selection';