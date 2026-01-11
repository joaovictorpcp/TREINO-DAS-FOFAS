-- Run this script in the Supabase SQL Editor to update your database structure

-- Add columns for basic workout details
ALTER TABLE workouts 
ADD COLUMN IF NOT EXISTS activity_type text DEFAULT 'weightlifting',
ADD COLUMN IF NOT EXISTS duration_minutes integer,
ADD COLUMN IF NOT EXISTS session_rpe numeric,
ADD COLUMN IF NOT EXISTS normalized_load integer,
ADD COLUMN IF NOT EXISTS volume_load_kg numeric;

-- Add columns for Cardio/Endurance metrics
ALTER TABLE workouts 
ADD COLUMN IF NOT EXISTS distance_km numeric,
ADD COLUMN IF NOT EXISTS average_heart_rate integer,
ADD COLUMN IF NOT EXISTS average_watts integer,
ADD COLUMN IF NOT EXISTS average_pace text,
ADD COLUMN IF NOT EXISTS elevation_gain integer;

-- Add columns for Descriptions and Text
ALTER TABLE workouts 
ADD COLUMN IF NOT EXISTS drills_description text,
ADD COLUMN IF NOT EXISTS main_set_description text,
ADD COLUMN IF NOT EXISTS category text,      -- e.g. "Treino A", "Long Run"
ADD COLUMN IF NOT EXISTS observations text;  -- User notes
