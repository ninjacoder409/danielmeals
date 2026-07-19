-- Run this in your Supabase SQL Editor — you already ran the base
-- supabase-schema.sql once, this just adds the two new columns it needs
-- for Daniel's weekly suggested meals feature.

alter table app_state add column if not exists suggested_meals jsonb not null default '[]'::jsonb;
alter table app_state add column if not exists suggestions_week_of text;
