create extension if not exists vector with schema extensions;
set search_path = public, extensions;
create table if not exists public.rag_chunks (
 id bigint generated always as identity primary key,
 version_id uuid not null,
 source_url text not null,
 title text not null,
 section text not null default '',
 content text not null,
 embedding vector(1024) not null,
 searchable tsvector generated always as (to_tsvector('english', title || ' ' || section || ' ' || content)) stored
);
alter table public.rag_chunks add column if not exists source_hash text;
alter table public.rag_chunks add column if not exists fetched_at timestamptz;
alter table public.rag_chunks add column if not exists source_last_modified text;
alter table public.rag_chunks add column if not exists embedding_model text;
create index if not exists rag_chunks_fts on public.rag_chunks using gin(searchable);
create table if not exists public.rag_active_version (singleton boolean primary key default true check(singleton), version_id uuid not null);
create table if not exists public.rag_products (id bigint generated always as identity primary key, version_id uuid not null, name text not null, category text not null, status text not null check (status in ('active','legacy','unknown')), source_url text not null, verified boolean not null default false);
create table if not exists public.rag_categories (version_id uuid not null, category text not null, reconciled boolean not null default false, primary key(version_id,category));
alter table public.rag_chunks enable row level security;
alter table public.rag_active_version enable row level security;
alter table public.rag_products enable row level security;
alter table public.rag_categories enable row level security;
create or replace function public.hybrid_search(query_text text, query_embedding vector(1024), query_model text, match_count int default 30, preview_version uuid default null)
returns table(id bigint,source_url text,title text,section text,content text,score double precision)
language sql stable security invoker set search_path = public, extensions as $$
 with active as (select coalesce(preview_version,(select version_id from public.rag_active_version where singleton)) as version_id),
 lexical as (select c.id,row_number() over(order by ts_rank_cd(c.searchable,websearch_to_tsquery('english',query_text)) desc) as rank from public.rag_chunks c join active a using(version_id) where c.embedding_model=query_model and c.searchable @@ websearch_to_tsquery('english',query_text) order by rank limit 50),
 semantic as (select c.id,row_number() over(order by c.embedding <=> query_embedding) as rank from public.rag_chunks c join active a using(version_id) where c.embedding_model=query_model order by rank limit 50),
 fused as (select coalesce(l.id,s.id) as id, coalesce(1.0/(60+l.rank),0)+coalesce(1.0/(60+s.rank),0) as score from lexical l full outer join semantic s on l.id=s.id)
 select c.id,c.source_url,c.title,c.section,c.content,f.score::double precision from fused f join public.rag_chunks c using(id) order by f.score desc limit greatest(1,least(match_count,50));
$$;
revoke all on public.rag_chunks, public.rag_active_version, public.rag_products, public.rag_categories from anon, authenticated;
grant select,insert,update,delete on public.rag_chunks, public.rag_active_version, public.rag_products, public.rag_categories to service_role;
grant usage,select on sequence public.rag_chunks_id_seq, public.rag_products_id_seq to service_role;
revoke all on function public.hybrid_search(text,vector,text,integer,uuid) from public, anon, authenticated;
grant execute on function public.hybrid_search(text,vector,text,integer,uuid) to service_role;
