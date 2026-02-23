-- Allow students to update workouts assigned to them
DROP POLICY IF EXISTS "Students can update their own workouts" ON workouts;
CREATE POLICY "Students can update their own workouts"
ON workouts FOR UPDATE
USING (auth.uid() = student_id);

-- Allow students to view their own workouts (just in case they couldn't)
DROP POLICY IF EXISTS "Students can view their own workouts" ON workouts;
CREATE POLICY "Students can view their own workouts"
ON workouts FOR SELECT
USING (auth.uid() = student_id);

-- Allow students to update their own profile data (body metrics)
DROP POLICY IF EXISTS "Students can update their own profiles" ON profiles;
CREATE POLICY "Students can update their own profiles"
ON profiles FOR UPDATE
USING (auth.uid() = id);

-- Allow students to insert workouts (if they create empty days themselves)
DROP POLICY IF EXISTS "Students can insert their own workouts" ON workouts;
CREATE POLICY "Students can insert their own workouts"
ON workouts FOR INSERT
WITH CHECK (auth.uid() = student_id);
