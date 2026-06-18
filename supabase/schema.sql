-- =============================================================
-- STEMPet — Supabase schema
-- Run this in the Supabase SQL editor (Project → SQL Editor → New Query).
-- Run it once when you first create the project.
-- =============================================================

-- ─── Enable UUID generation ───────────────────────────────────
create extension if not exists "pgcrypto";

-- =============================================================
-- TABLE: children
-- One row per child. Linked to the Supabase Auth user (the parent).
-- =============================================================
create table if not exists children (
  id         uuid primary key default gen_random_uuid(),
  parent_id  uuid not null references auth.users(id) on delete cascade,
  name       text not null,
  age_group  text not null check (age_group in ('6-8', '8-10', '10-12')),
  created_at timestamptz not null default now()
);

-- =============================================================
-- TABLE: devices
-- One physical toy per row. Linked to a child.
-- device_code is the short code printed on the toy; the parent
-- types it into the website once to pair the toy to their child.
-- =============================================================
create table if not exists devices (
  id           uuid primary key default gen_random_uuid(),
  child_id     uuid not null references children(id) on delete cascade,
  device_code  text not null unique,
  last_seen_at timestamptz
);

-- =============================================================
-- TABLE: questions
-- Cached / seeded questions. The API reuses these before calling
-- Groq, so we don't generate the same question twice.
-- source = 'generated' (came from Groq) | 'builtin' (seeded)
-- options is a JSON array of exactly 4 strings.
-- correct_index is 0–3.
-- =============================================================
create table if not exists questions (
  id            uuid primary key default gen_random_uuid(),
  skill         text not null check (skill in ('addition','subtraction','multiplication','division')),
  level         int  not null check (level between 1 and 4),
  age_group     text not null check (age_group in ('6-8', '8-10', '10-12')),
  question_text text not null,
  options       jsonb not null,
  correct_index int  not null check (correct_index between 0 and 3),
  source        text not null check (source in ('generated','builtin')),
  created_at    timestamptz not null default now()
);

-- =============================================================
-- TABLE: attempts
-- Every answer a child gives is logged here.
-- This is the raw data the dashboard and the adaptive engine use.
-- =============================================================
create table if not exists attempts (
  id          uuid primary key default gen_random_uuid(),
  child_id    uuid not null references children(id) on delete cascade,
  question_id uuid references questions(id) on delete set null,
  skill       text not null check (skill in ('addition','subtraction','multiplication','division')),
  level       int  not null check (level between 1 and 4),
  is_correct  boolean not null,
  time_ms     int,
  created_at  timestamptz not null default now()
);

-- =============================================================
-- INDEXES — speed up the most common queries
-- =============================================================

-- Dashboard: "show me this child's recent attempts"
create index if not exists attempts_child_created
  on attempts (child_id, created_at desc);

-- Adaptive engine: "last 10 attempts in the current skill"
create index if not exists attempts_child_skill
  on attempts (child_id, skill, created_at desc);

-- API question lookup: "find a cached question for this skill/level/age_group"
create index if not exists questions_skill_level_age
  on questions (skill, level, age_group);

-- =============================================================
-- ROW LEVEL SECURITY
-- A parent can only see data that belongs to their own children.
-- The toy API uses the service_role key (which bypasses RLS),
-- so we don't need a special policy for the toy.
-- =============================================================

alter table children  enable row level security;
alter table devices   enable row level security;
alter table questions enable row level security;
alter table attempts  enable row level security;

-- children: parent can CRUD their own children
create policy "parents see own children"
  on children for all
  using  (parent_id = auth.uid())
  with check (parent_id = auth.uid());

-- devices: parent can see/manage devices linked to their children
create policy "parents see own devices"
  on devices for all
  using  (child_id in (select id from children where parent_id = auth.uid()))
  with check (child_id in (select id from children where parent_id = auth.uid()));

-- questions: everyone can read (needed for the parent dashboard to show question text)
create policy "anyone can read questions"
  on questions for select
  using (true);

-- attempts: parent can only see attempts for their own children
create policy "parents see own attempts"
  on attempts for all
  using  (child_id in (select id from children where parent_id = auth.uid()))
  with check (child_id in (select id from children where parent_id = auth.uid()));
