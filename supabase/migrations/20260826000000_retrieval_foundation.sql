-- Retrieval foundation: section metadata, lexical search, HNSW index, hybrid RPC.

alter table public.chunks
  add column if not exists section_path text,
  add column if not exists page integer;

alter table public.sources
  add column if not exists outline jsonb;

create index if not exists chunks_embedding_hnsw_idx
  on public.chunks using hnsw ((embedding::extensions.halfvec(3072)) extensions.halfvec_cosine_ops);

create index if not exists chunks_section_path_idx
  on public.chunks (section_path);

-- Generated column for BM25-style lexical ranking.
alter table public.chunks
  add column if not exists tsv tsvector
  generated always as (to_tsvector('english', coalesce(text, ''))) stored;

create index if not exists chunks_tsv_idx on public.chunks using gin (tsv);

-- Hybrid retrieval: vector + full-text candidates fused with Reciprocal Rank Fusion.
create or replace function public.match_chunks(
  query_embedding extensions.vector(3072),
  query_text text,
  match_count int default 8,
  source_ids uuid[] default null
)
returns table (
  id uuid,
  source_id uuid,
  chunk_index int,
  section_path text,
  page int,
  text text,
  score float
)
language sql stable
set search_path = public, extensions
as $$
  with lexical_query as (
    select websearch_to_tsquery('english', coalesce(query_text, '')) as tsq
  ),
  vector_candidates as (
    select c.id,
           row_number() over (order by c.embedding <=> query_embedding) as rank
    from public.chunks c
    where (source_ids is null or c.source_id = any(source_ids))
    order by c.embedding <=> query_embedding
    limit least(match_count * 4, 64)
  ),
  lexical_candidates as (
    select c.id,
           row_number() over (order by ts_rank_cd(c.tsv, l.tsq) desc) as rank
    from public.chunks c, lexical_query l
    where l.tsq @@ c.tsv
      and (source_ids is null or c.source_id = any(source_ids))
    order by ts_rank_cd(c.tsv, l.tsq) desc
    limit least(match_count * 4, 64)
  ),
  fused as (
    select id, 1.0 / (60 + rank) as rrf_score from vector_candidates
    union all
    select id, 1.0 / (60 + rank) as rrf_score from lexical_candidates
  )
  select c.id,
         c.source_id,
         c.chunk_index,
         c.section_path,
         c.page,
         c.text,
         sum(f.rrf_score)::float as score
  from fused f
  join public.chunks c on c.id = f.id
  group by c.id, c.source_id, c.chunk_index, c.section_path, c.page, c.text
  order by score desc
  limit match_count;
$$;
