-- Shared leaderboard for the Saudi ND memory challenge.
-- Run once in the Supabase SQL editor, then run migrations/002_clients.sql.

create table if not exists public.leaderboard (
  id              text primary key,
  player_name     text        not null check (char_length(player_name) between 1 and 40),
  score           integer     not null check (score >= 0),
  total_time      integer     not null check (total_time >= 0),
  created_at      timestamptz not null default now(),
  matches         integer,
  attempts        integer,
  best_streak     integer,
  levels_cleared  integer
);

create index if not exists leaderboard_rank_idx
  on public.leaderboard (score desc, total_time asc, created_at asc);

-- The game uses the public anon key: allow reading and adding results,
-- never editing or deleting them.
alter table public.leaderboard enable row level security;

drop policy if exists "leaderboard read" on public.leaderboard;
create policy "leaderboard read" on public.leaderboard
  for select to anon using (true);

drop policy if exists "leaderboard insert" on public.leaderboard;
create policy "leaderboard insert" on public.leaderboard
  for insert to anon with check (true);
