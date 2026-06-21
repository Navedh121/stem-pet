-- =============================================================
-- Migration 0002 — age_group moves from child to each session
-- =============================================================
--
-- !! RUN THIS IN THE SUPABASE SQL EDITOR BEFORE DEPLOYING THE NEW CODE !!
--    Dashboard → SQL Editor → New Query → paste → Run
--
-- What this migration does:
--   1. Adds an age_group column to the attempts table so every answer
--      is tagged with the age band the child was playing in that session.
--   2. Drops the NOT NULL constraint on children.age_group — the column
--      stays (and the check constraint stays) but new children are now
--      created without a fixed age group, because age is chosen on the
--      device each time.
--   3. Adds an index to speed up the common dashboard query that filters
--      attempts by child + age_group.
--   4. Leaves all existing RLS policies unchanged.
-- =============================================================


-- ── 1. Add age_group to attempts (nullable) ──────────────────
-- Existing rows get NULL (they were recorded before the device sent age_group).
-- The check allows NULL or one of the three valid bands.
ALTER TABLE attempts
  ADD COLUMN IF NOT EXISTS age_group text
    CHECK (age_group IS NULL OR age_group IN ('6-8', '8-10', '10-12'));


-- ── 2. Make children.age_group optional ──────────────────────
-- The existing check constraint (age_group IN ('6-8','8-10','10-12'))
-- already allows NULL in Postgres (NULL passes CHECK constraints),
-- so we only need to drop NOT NULL.  The column and its values check stay.
ALTER TABLE children
  ALTER COLUMN age_group DROP NOT NULL;


-- ── 3. Index for per-age-group dashboard and adaptive queries ─
CREATE INDEX IF NOT EXISTS attempts_child_age_created
  ON attempts (child_id, age_group, created_at DESC);
