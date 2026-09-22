-- 002 — one game, many clients.
--
-- Every result belongs to a client (the `?client=` in the game's URL), so
-- each client sees only its own leaderboard. A client can clear its own
-- standings from the operator panel with a PIN; the PIN is stored hashed
-- in a schema the public API cannot read.
--
-- Run once in the Supabase SQL editor. Safe to re-run.

create extension if not exists pgcrypto with schema extensions;

-- Start clean: the rows so far were test data.
delete from public.leaderboard;

-- Results -------------------------------------------------------------------
alter table public.leaderboard
  add column if not exists client text not null default 'default';

alter table public.leaderboard drop constraint if exists leaderboard_client_check;
alter table public.leaderboard
  add constraint leaderboard_client_check check (client ~ '^[a-z0-9-]{1,40}$');

drop index if exists public.leaderboard_rank_idx;
create index if not exists leaderboard_client_rank_idx
  on public.leaderboard (client, score desc, total_time asc, created_at asc);

-- Clients (public profile) --------------------------------------------------
create table if not exists public.clients (
  id          text primary key check (id ~ '^[a-z0-9-]{1,40}$'),
  name        text not null,
  event_title text,
  logo_url    text,
  created_at  timestamptz not null default now()
);

alter table public.clients enable row level security;
drop policy if exists "clients read" on public.clients;
create policy "clients read" on public.clients for select to anon, authenticated using (true);

-- Client PINs (private: not exposed by the API) -----------------------------
create schema if not exists private;
revoke all on schema private from anon, authenticated;

create table if not exists private.client_pins (
  client_id       text primary key references public.clients (id) on delete cascade,
  pin_hash        text not null,
  failed_attempts integer not null default 0,
  locked_until    timestamptz
);

-- add_client: run from the SQL editor only (not callable with the public key).
create or replace function public.add_client(
  p_id text,
  p_name text,
  p_pin text,
  p_event_title text default null,
  p_logo_url text default null
) returns void
language plpgsql
security definer
set search_path = public, private, extensions
as $$
begin
  if char_length(coalesce(p_pin, '')) < 6 then
    raise exception 'PIN must be at least 6 characters';
  end if;

  insert into public.clients (id, name, event_title, logo_url)
  values (p_id, p_name, p_event_title, p_logo_url)
  on conflict (id) do update
    set name = excluded.name, event_title = excluded.event_title, logo_url = excluded.logo_url;

  insert into private.client_pins (client_id, pin_hash)
  values (p_id, crypt(p_pin, gen_salt('bf')))
  on conflict (client_id) do update
    set pin_hash = excluded.pin_hash, failed_attempts = 0, locked_until = null;
end;
$$;

revoke all on function public.add_client(text, text, text, text, text) from public, anon, authenticated;

-- reset_leaderboard: callable from the game. Returns the rows deleted,
-- -1 for a wrong PIN or unknown client, -2 while locked out. Five wrong
-- PINs lock that client for 15 minutes, so a PIN cannot be guessed.
create or replace function public.reset_leaderboard(p_client text, p_pin text)
returns integer
language plpgsql
security definer
set search_path = public, private, extensions
as $$
declare
  rec private.client_pins;
  deleted integer;
begin
  select * into rec from private.client_pins where client_id = p_client for update;
  if not found then
    return -1;
  end if;

  if rec.locked_until is not null and rec.locked_until > now() then
    return -2;
  end if;

  if rec.pin_hash <> crypt(coalesce(p_pin, ''), rec.pin_hash) then
    update private.client_pins
       set failed_attempts = rec.failed_attempts + 1,
           locked_until = case when rec.failed_attempts + 1 >= 5
                               then now() + interval '15 minutes' end
     where client_id = p_client;
    return -1;
  end if;

  update private.client_pins set failed_attempts = 0, locked_until = null
   where client_id = p_client;

  delete from public.leaderboard where client = p_client;
  get diagnostics deleted = row_count;
  return deleted;
end;
$$;

revoke all on function public.reset_leaderboard(text, text) from public;
grant execute on function public.reset_leaderboard(text, text) to anon, authenticated;

-- Register clients (edit the PINs — at least 6 characters — and run):
--
--   select public.add_client('default', 'اليوم الوطني السعودي', 'CHANGE-ME-1');
--   select public.add_client('byd', 'BYD', 'CHANGE-ME-2', 'احتفال BYD باليوم الوطني',
--                            'https://example.com/byd-logo.png');
--
-- Then open the game at  …/saudi-nd-memory-challenge/?client=byd
