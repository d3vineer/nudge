-- Per-user data isolation: users only see rows tied to their own sources.

alter table public.sources enable row level security;
alter table public.chunks enable row level security;
alter table public.generated_assets enable row level security;
alter table public.parse_jobs enable row level security;

-- Sources: full ownership on user_id.
drop policy if exists "users select own sources" on public.sources;
create policy "users select own sources"
  on public.sources for select
  using (user_id = auth.uid());

drop policy if exists "users insert own sources" on public.sources;
create policy "users insert own sources"
  on public.sources for insert
  with check (user_id = auth.uid());

drop policy if exists "users update own sources" on public.sources;
create policy "users update own sources"
  on public.sources for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

drop policy if exists "users delete own sources" on public.sources;
create policy "users delete own sources"
  on public.sources for delete
  using (user_id = auth.uid());

-- Child tables: ownership derived from the parent source.
drop policy if exists "users select own chunks" on public.chunks;
create policy "users select own chunks"
  on public.chunks for select
  using (
    exists (
      select 1 from public.sources s
      where s.id = chunks.source_id and s.user_id = auth.uid()
    )
  );

drop policy if exists "users select own generated assets" on public.generated_assets;
create policy "users select own generated assets"
  on public.generated_assets for select
  using (
    exists (
      select 1 from public.sources s
      where s.id = generated_assets.source_id and s.user_id = auth.uid()
    )
  );

drop policy if exists "users select own parse jobs" on public.parse_jobs;
create policy "users select own parse jobs"
  on public.parse_jobs for select
  using (
    exists (
      select 1 from public.sources s
      where s.id = parse_jobs.source_id and s.user_id = auth.uid()
    )
  );

-- Storage: restrict to the uploading owner instead of any authenticated user.
drop policy if exists "single user mvp can upload study materials" on storage.objects;
create policy "users can upload own study materials"
  on storage.objects for insert
  with check (bucket_id = 'study-materials' and auth.uid() = owner);

drop policy if exists "single user mvp can read study materials" on storage.objects;
create policy "users can read own study materials"
  on storage.objects for select
  using (bucket_id = 'study-materials' and auth.uid() = owner);
