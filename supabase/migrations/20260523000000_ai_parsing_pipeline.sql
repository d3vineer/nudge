create extension if not exists vector with schema extensions;

create table if not exists public.sources (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  mime_type text not null,
  storage_path text not null unique,
  size bigint not null default 0,
  status text not null default 'queued' check (status in ('queued', 'uploading', 'processing', 'needs_ocr', 'ready', 'failed')),
  progress integer not null default 0 check (progress >= 0 and progress <= 100),
  stage text not null default 'metadata' check (stage in ('metadata', 'upload', 'extract_text', 'ocr', 'chunk', 'embed', 'generate', 'complete', 'failed')),
  error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.chunks (
  id uuid primary key default gen_random_uuid(),
  source_id uuid not null references public.sources(id) on delete cascade,
  chunk_index integer not null,
  text text not null,
  token_count integer not null default 0,
  embedding extensions.vector(3072),
  created_at timestamptz not null default now(),
  unique (source_id, chunk_index)
);

create table if not exists public.generated_assets (
  id uuid primary key default gen_random_uuid(),
  source_id uuid not null references public.sources(id) on delete cascade,
  type text not null default 'study_pack' check (type = 'study_pack'),
  title text not null,
  content_json jsonb not null,
  created_at timestamptz not null default now()
);

create table if not exists public.parse_jobs (
  id uuid primary key default gen_random_uuid(),
  source_id uuid not null references public.sources(id) on delete cascade,
  status text not null default 'queued' check (status in ('queued', 'running', 'needs_ocr', 'completed', 'failed')),
  stage text not null default 'metadata',
  error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists chunks_source_id_idx on public.chunks(source_id);
create index if not exists generated_assets_source_id_idx on public.generated_assets(source_id);
create index if not exists parse_jobs_source_id_idx on public.parse_jobs(source_id);
create index if not exists sources_created_at_idx on public.sources(created_at desc);

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists sources_touch_updated_at on public.sources;
create trigger sources_touch_updated_at
before update on public.sources
for each row execute function public.touch_updated_at();

drop trigger if exists parse_jobs_touch_updated_at on public.parse_jobs;
create trigger parse_jobs_touch_updated_at
before update on public.parse_jobs
for each row execute function public.touch_updated_at();

insert into storage.buckets (id, name, public)
values ('study-materials', 'study-materials', false)
on conflict (id) do nothing;

drop policy if exists "single user mvp can upload study materials" on storage.objects;
create policy "single user mvp can upload study materials"
on storage.objects for insert
with check (bucket_id = 'study-materials');

drop policy if exists "single user mvp can read study materials" on storage.objects;
create policy "single user mvp can read study materials"
on storage.objects for select
using (bucket_id = 'study-materials');
