-- Run this in the Supabase SQL Editor to create the shared_analyses table.

create table if not exists public.shared_analyses (
  id uuid primary key default gen_random_uuid(),
  repo_url text not null,
  repo_full_name text not null,
  analysis_result jsonb not null,
  repo_data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

comment on table public.shared_analyses is 'Publicly shareable repository analyses';

-- Allow anyone to read (public shares)
alter table public.shared_analyses enable row level security;

create policy "Allow public read access"
  on public.shared_analyses
  for select
  using (true);

-- Only the service role can insert (no user auth needed for creation)
create policy "Service role insert only"
  on public.shared_analyses
  for insert
  with check (true);
