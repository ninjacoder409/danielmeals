-- Run this once in your Supabase project's SQL Editor (Database > SQL Editor > New query)

create table app_state (
  id text primary key,
  recipes jsonb not null default '[]'::jsonb,
  plan jsonb not null default '{}'::jsonb,
  suggested_meals jsonb not null default '[]'::jsonb,
  suggestions_week_of text,
  updated_at timestamptz not null default now()
);

-- No login/auth yet in this first slice, so this policy is intentionally open:
-- anyone with your app's URL can read and write this table. That's an
-- acceptable tradeoff for a private family beta, not for anything wider.
-- Real per-household access control is the next step once this is proven out.
alter table app_state enable row level security;

create policy "open read/write for beta"
  on app_state
  for all
  using (true)
  with check (true);

-- seed the single household row this beta uses
insert into app_state (id, recipes, plan)
values ('household-1', '[]'::jsonb, '{}'::jsonb)
on conflict (id) do nothing;
