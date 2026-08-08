-- AI Voice Diary — database schema
-- Run this in the Supabase SQL Editor (Dashboard → SQL Editor → New query).

-- Diary entries: one row per recorded note.
create table if not exists entries (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  entry_date date not null default (now()::date),
  audio_url text,
  duration_seconds integer,
  raw_transcript text not null,
  clean_transcript text not null,
  category text not null check (
    category in ('Ideas', 'Memories', 'Reflections', 'Reminders', 'Important Events')
  ),
  language text not null default 'en'
);

create index if not exists entries_entry_date_idx on entries (entry_date desc, created_at desc);

-- One AI-generated summary per diary day, regenerated when new entries arrive.
create table if not exists daily_summaries (
  entry_date date primary key,
  summary text not null,
  language text not null default 'en',
  updated_at timestamptz not null default now()
);

-- Public bucket for recorded audio. All writes go through the server
-- (service role key), so no storage RLS policies are needed.
insert into storage.buckets (id, name, public)
values ('audio', 'audio', true)
on conflict (id) do nothing;

-- The app only accesses the database through API routes using the service
-- role key. Keep RLS enabled so the anon key can't touch these tables.
alter table entries enable row level security;
alter table daily_summaries enable row level security;
