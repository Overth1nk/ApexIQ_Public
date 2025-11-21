create table if not exists public.analysis_jobs (
  id uuid primary key default gen_random_uuid(),
  upload_id uuid not null unique references public.uploads(id) on delete cascade,
  status text not null default 'pending',
  attempts int not null default 0,
  error_message text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists analysis_jobs_status_idx on public.analysis_jobs (status, created_at);

create or replace function public.touch_analysis_job()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

drop trigger if exists trg_touch_analysis_job on public.analysis_jobs;
create trigger trg_touch_analysis_job
  before update on public.analysis_jobs
  for each row execute function public.touch_analysis_job();
