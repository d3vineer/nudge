alter table public.chunks
alter column embedding type extensions.vector(3072);
