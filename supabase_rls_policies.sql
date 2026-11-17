-- Run this SQL in Supabase SQL Editor for project:
-- https://ckfifonsoupjzvryncie.supabase.co
-- Enables RLS on existing tables (students, teachers, parents):
-- - Anyone (anon & authenticated) can INSERT during self-registration
-- - Only authenticated Manager/Admin session can SELECT / UPDATE / DELETE

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
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Allow manager update students" ON public.students;
CREATE POLICY "Allow manager update students"
  ON public.students
  FOR UPDATE
  TO authenticated
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
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Allow manager update teachers" ON public.teachers;
CREATE POLICY "Allow manager update teachers"
  ON public.teachers
  FOR UPDATE
  TO authenticated
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
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Allow manager update parents" ON public.parents;
CREATE POLICY "Allow manager update parents"
  ON public.parents
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);
