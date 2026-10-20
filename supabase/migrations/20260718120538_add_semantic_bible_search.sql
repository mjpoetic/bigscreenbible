create extension if not exists vector with schema extensions;

create table if not exists public.bsb_semantic_passages (
  chunk_key text primary key check (char_length(chunk_key) between 8 and 160),
  translation text not null default 'WEB' check (translation = 'WEB'),
  book text not null check (char_length(book) between 2 and 40),
  chapter integer not null check (chapter between 1 and 150),
  start_verse integer not null check (start_verse between 1 and 176),
  end_verse integer not null check (end_verse between start_verse and 176),
  reference text not null check (char_length(reference) between 5 and 100),
  content text not null check (char_length(content) between 10 and 4000),
  content_hash text not null check (content_hash ~ '^[0-9a-f]{64}$'),
  corpus_version text not null check (corpus_version ~ '^[0-9a-f]{64}$'),
  embedding_model text not null default 'gte-small' check (embedding_model = 'gte-small'),
  embedding extensions.vector(384) not null,
  updated_at timestamptz not null default now(),
  unique (translation, book, chapter, start_verse, end_verse)
);

alter table public.bsb_semantic_passages enable row level security;

revoke all on table public.bsb_semantic_passages from anon, authenticated;
grant select, insert, update, delete on table public.bsb_semantic_passages to service_role;

create index if not exists bsb_semantic_passages_reference_idx
  on public.bsb_semantic_passages (book, chapter, start_verse);

create index if not exists bsb_semantic_passages_embedding_idx
  on public.bsb_semantic_passages
  using hnsw (embedding vector_ip_ops);

create or replace function public.match_bsb_semantic_passages(
  query_embedding extensions.vector(384),
  match_threshold double precision default 0.55,
  match_count integer default 12
)
returns table (
  chunk_key text,
  reference text,
  start_ref text,
  content text,
  similarity double precision
)
language sql
stable
security invoker
set search_path = ''
as $$
  select
    passage.chunk_key,
    passage.reference,
    passage.book || ' ' || passage.chapter || ':' || passage.start_verse as start_ref,
    passage.content,
    -(passage.embedding operator(extensions.<#>) query_embedding) as similarity
  from public.bsb_semantic_passages as passage
  where -(passage.embedding operator(extensions.<#>) query_embedding) >= greatest(match_threshold, 0.0)
  order by passage.embedding operator(extensions.<#>) query_embedding
  limit least(greatest(match_count, 1), 20);
$$;

revoke execute on function public.match_bsb_semantic_passages(
  extensions.vector,
  double precision,
  integer
) from public, anon, authenticated;
grant execute on function public.match_bsb_semantic_passages(
  extensions.vector,
  double precision,
  integer
) to service_role;
