create extension if not exists pgcrypto;

create table if not exists public.repository_analyses (
  id uuid primary key default gen_random_uuid(),
  github_user_id bigint not null,
  github_login text not null,
  repo_url text not null,
  repo_full_name text not null,
  repo_data jsonb not null,
  analysis_result jsonb not null,
  total_files integer not null default 0,
  total_folders integer not null default 0,
  max_depth integer not null default 0,
  languages jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (github_user_id, repo_full_name)
);

create index if not exists repository_analyses_user_updated_idx
  on public.repository_analyses (github_user_id, updated_at desc);

alter table public.repository_analyses enable row level security;

drop policy if exists "No direct client access to repository analyses" on public.repository_analyses;
create policy "No direct client access to repository analyses"
  on public.repository_analyses
  for all
  using (false)
  with check (false);
