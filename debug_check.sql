-- check total workouts
SELECT count(*) as total_rows_in_table FROM workouts;

-- check how many rows allow access (if RLS is on, this shows only yours. if OFF/Bypassed, shows all)
-- Run this in Supabase SQL Editor.
SELECT id, user_id, status, date FROM workouts ORDER BY created_at DESC LIMIT 5;

-- Check specific user's workouts (Replace UUID with your ID from the Dashboard Debug Footer)
-- SELECT * FROM workouts WHERE user_id = 'YOUR_UUID_HERE';
