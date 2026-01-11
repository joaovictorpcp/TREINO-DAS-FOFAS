-- Enable RLS
ALTER TABLE workouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Users can view their own workouts" ON workouts;
DROP POLICY IF EXISTS "Users can insert their own workouts" ON workouts;
DROP POLICY IF EXISTS "Users can update their own workouts" ON workouts;
DROP POLICY IF EXISTS "Users can delete their own workouts" ON workouts;

DROP POLICY IF EXISTS "Users can view their own students" ON students;
DROP POLICY IF EXISTS "Users can insert their own students" ON students;
DROP POLICY IF EXISTS "Users can update their own students" ON students;
DROP POLICY IF EXISTS "Users can delete their own students" ON students;

-- Create Workouts Policies
CREATE POLICY "Users can view their own workouts"
ON workouts FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own workouts"
ON workouts FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own workouts"
ON workouts FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own workouts"
ON workouts FOR DELETE
USING (auth.uid() = user_id);

-- Create Students Policies
CREATE POLICY "Users can view their own students"
ON students FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own students"
ON students FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own students"
ON students FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own students"
ON students FOR DELETE
USING (auth.uid() = user_id);
