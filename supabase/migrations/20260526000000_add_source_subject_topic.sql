alter table public.sources
add column if not exists subject text,
add column if not exists topic text;

create index if not exists sources_subject_topic_idx
on public.sources(subject, topic);
