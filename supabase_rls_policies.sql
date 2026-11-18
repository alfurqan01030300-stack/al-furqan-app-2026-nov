-- Run this SQL in Supabase SQL Editor for your active Supabase project.
-- 1) Safely ensures tables & required columns exist without deleting/altering existing data
-- 2) Grants anon/authenticated privileges and enables RLS allowing unauthenticated registration (WITH CHECK (true))

CREATE TABLE IF NOT EXISTS public.students (
  id text PRIMARY KEY,
  name text NOT NULL DEFAULT '',
  age integer,
  phone text NOT NULL DEFAULT '',
  parent_name text DEFAULT '',
  parent_phone text DEFAULT '',
  education_system text DEFAULT 'general',
  stage text DEFAULT '',
  grade_level text DEFAULT '',
  track text DEFAULT '',
  study_scope text DEFAULT 'all',
  selected_subjects jsonb DEFAULT '[]'::jsonb,
  course text DEFAULT '',
  fee_status text DEFAULT 'unpaid',
  notes text DEFAULT '',
  registered_date text DEFAULT '',
  registered_by_self boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.teachers (
  id text PRIMARY KEY,
  name text NOT NULL DEFAULT '',
  phone text NOT NULL DEFAULT '',
  normalized_phone text DEFAULT '',
  age integer,
  location text DEFAULT '',
  teaching_systems text DEFAULT 'both',
  teaching_mode text DEFAULT 'multiple',
  teaching_stages jsonb DEFAULT '[]'::jsonb,
  teaching_grades jsonb DEFAULT '[]'::jsonb,
  teaching_track text DEFAULT '',
  subjects jsonb DEFAULT '[]'::jsonb,
  daily_hours integer,
  available_period text DEFAULT 'الاتنين',
  experience_years integer,
  avatar_url text DEFAULT '',
  specialization text DEFAULT '',
  status text DEFAULT 'pending',
  role text DEFAULT 'teacher',
  registered_by_self boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.teachers ADD COLUMN IF NOT EXISTS name text NOT NULL DEFAULT '';
ALTER TABLE public.teachers ADD COLUMN IF NOT EXISTS phone text NOT NULL DEFAULT '';
ALTER TABLE public.teachers ADD COLUMN IF NOT EXISTS normalized_phone text DEFAULT '';
ALTER TABLE public.teachers ADD COLUMN IF NOT EXISTS age integer;
ALTER TABLE public.teachers ADD COLUMN IF NOT EXISTS location text DEFAULT '';
ALTER TABLE public.teachers ADD COLUMN IF NOT EXISTS teaching_systems text DEFAULT 'both';
ALTER TABLE public.teachers ADD COLUMN IF NOT EXISTS teaching_mode text DEFAULT 'multiple';
ALTER TABLE public.teachers ADD COLUMN IF NOT EXISTS teaching_stages jsonb DEFAULT '[]'::jsonb;
ALTER TABLE public.teachers ADD COLUMN IF NOT EXISTS teaching_grades jsonb DEFAULT '[]'::jsonb;
ALTER TABLE public.teachers ADD COLUMN IF NOT EXISTS teaching_track text DEFAULT '';
ALTER TABLE public.teachers ADD COLUMN IF NOT EXISTS subjects jsonb DEFAULT '[]'::jsonb;
ALTER TABLE public.teachers ADD COLUMN IF NOT EXISTS daily_hours integer;
ALTER TABLE public.teachers ADD COLUMN IF NOT EXISTS available_period text DEFAULT 'الاتنين';
ALTER TABLE public.teachers ADD COLUMN IF NOT EXISTS experience_years integer;
ALTER TABLE public.teachers ADD COLUMN IF NOT EXISTS avatar_url text DEFAULT '';
ALTER TABLE public.teachers ADD COLUMN IF NOT EXISTS specialization text DEFAULT '';
ALTER TABLE public.teachers ADD COLUMN IF NOT EXISTS status text DEFAULT 'pending';
ALTER TABLE public.teachers ADD COLUMN IF NOT EXISTS role text DEFAULT 'teacher';
ALTER TABLE public.teachers ADD COLUMN IF NOT EXISTS registered_by_self boolean DEFAULT true;
ALTER TABLE public.teachers ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now();

CREATE TABLE IF NOT EXISTS public.parents (
  id text PRIMARY KEY DEFAULT ('par-' || gen_random_uuid()::text),
  name text NOT NULL DEFAULT '',
  phone text NOT NULL DEFAULT '',
  student_id text,
  student_name text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE ON public.students, public.teachers, public.parents TO anon, authenticated;

ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teachers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.parents  ENABLE ROW LEVEL SECURITY;

-- 1. STUDENTS policies
DROP POLICY IF EXISTS "Allow public student registration insert" ON public.students;
CREATE POLICY "Allow public student registration insert"
  ON public.students
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "Allow manager read students" ON public.students;
CREATE POLICY "Allow manager read students"
  ON public.students
  FOR SELECT
  TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "Allow manager update students" ON public.students;
CREATE POLICY "Allow manager update students"
  ON public.students
  FOR UPDATE
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

-- 2. TEACHERS policies
DROP POLICY IF EXISTS "Allow public teacher registration insert" ON public.teachers;
CREATE POLICY "Allow public teacher registration insert"
  ON public.teachers
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "Allow manager read teachers" ON public.teachers;
CREATE POLICY "Allow manager read teachers"
  ON public.teachers
  FOR SELECT
  TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "Allow manager update teachers" ON public.teachers;
CREATE POLICY "Allow manager update teachers"
  ON public.teachers
  FOR UPDATE
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

-- 3. PARENTS policies
DROP POLICY IF EXISTS "Allow public parent registration insert" ON public.parents;
CREATE POLICY "Allow public parent registration insert"
  ON public.parents
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "Allow manager read parents" ON public.parents;
CREATE POLICY "Allow manager read parents"
  ON public.parents
  FOR SELECT
  TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "Allow manager update parents" ON public.parents;
CREATE POLICY "Allow manager update parents"
  ON public.parents
  FOR UPDATE
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

NOTIFY pgrst, 'reload schema';
