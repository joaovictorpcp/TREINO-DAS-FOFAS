-- DANGER: This disables security for debugging purposes.
-- Run this in Supabase SQL Editor.

-- 1. Disable RLS on workouts entirely (allows public access if anon key has permissions, but authenticated users definitely get full access)
ALTER TABLE workouts DISABLE ROW LEVEL SECURITY;

-- 2. Also disable on students just in case
ALTER TABLE students DISABLE ROW LEVEL SECURITY;

-- 3. Verify
SELECT count(*) as workouts_count FROM workouts;
