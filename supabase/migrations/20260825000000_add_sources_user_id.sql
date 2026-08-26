alter table public.sources
  add column if not exists user_id uuid references auth.users(id) on delete cascade;

create index if not exists sources_user_id_idx on public.sources(user_id);
