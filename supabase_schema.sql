DROP TABLE IF EXISTS workouts;
DROP TABLE IF EXISTS students;

create table students (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  name text not null,
  goal text,
  profile_data jsonb default '{}'::jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table students enable row level security;

create policy "Users can view their own students"
  on students for select
  using (auth.uid() = user_id);

create policy "Users can insert their own students"
  on students for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own students"
  on students for update
  using (auth.uid() = user_id);

create policy "Users can delete their own students"
  on students for delete
  using (auth.uid() = user_id);

create table workouts (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  student_id uuid references students(id) on delete cascade not null,
  date timestamp with time zone not null,
  status text default 'planned',
  
  -- Core Data
  activity_type text default 'weightlifting',
  category text,
  duration_minutes integer,
  session_rpe numeric,
  normalized_load integer,
  volume_load_kg numeric,
  observations text,

  -- Cardio Metrics
  distance_km numeric,
  average_heart_rate integer,
  average_watts integer,
  average_pace text,
  elevation_gain integer,

  -- Descriptions
  drills_description text,
  main_set_description text,

  -- Legacy/Complex Structures
  exercises jsonb default '[]'::jsonb, 
  meta jsonb default '{}'::jsonb,

  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table workouts enable row level security;

create policy "Users can view their own workouts"
  on workouts for select
  using (auth.uid() = user_id);

create policy "Users can insert their own workouts"
  on workouts for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own workouts"
  on workouts for update
  using (auth.uid() = user_id);

create policy "Users can delete their own workouts"
  on workouts for delete
  using (auth.uid() = user_id);
