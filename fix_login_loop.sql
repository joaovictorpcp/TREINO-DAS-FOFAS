-- ============================================================
-- FIX: Login Infinite Loop + Security Warnings
-- Execute no Supabase SQL Editor
-- ============================================================

-- PASSO 1: Recriar handle_new_user com search_path correto
-- e usando ON CONFLICT para evitar erros em caso de race condition
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'role', 'aluno')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

-- Garantir que a trigger existe
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


-- PASSO 2: Recriar auto_create_student_profile com search_path correto
CREATE OR REPLACE FUNCTION public.auto_create_student_profile()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  professor_id UUID;
  student_name TEXT;
BEGIN
  IF NEW.role <> 'aluno' THEN
    RETURN NEW;
  END IF;

  SELECT
    COALESCE(raw_user_meta_data->>'name', email)
  INTO student_name
  FROM auth.users
  WHERE id = NEW.id;

  SELECT id INTO professor_id
  FROM public.profiles
  WHERE role = 'professor'
  LIMIT 1;

  IF professor_id IS NOT NULL THEN
    INSERT INTO public.students (user_id, name, goal, profile_data)
    VALUES (
      professor_id,
      COALESCE(student_name, 'Aluno'),
      'Hipertrofia',
      jsonb_build_object('auth_user_id', NEW.id, 'metrics', '[]'::jsonb)
    )
    ON CONFLICT DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_aluno_profile_created ON public.profiles;
CREATE TRIGGER on_aluno_profile_created
  AFTER INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_create_student_profile();


-- PASSO 3: Corrigir is_professor (se existir) para evitar warnings de segurança
DO $$
BEGIN
  BEGIN
    ALTER FUNCTION public.is_professor() SET search_path = public;
  EXCEPTION WHEN OTHERS THEN NULL;
  END;
  BEGIN
    ALTER FUNCTION public.is_professor(uuid) SET search_path = public;
  EXCEPTION WHEN OTHERS THEN NULL;
  END;
END $$;
