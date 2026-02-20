-- ============================================================
-- SCRIPT: Auto-Criação de Perfil de Aluno no Dashboard do Professor
-- Execute este script no SQL Editor do Supabase
-- ============================================================

-- PASSO 1: Atualizar handle_new_user para gravar o role correto
-- (Lê o role do user_metadata enviado pelo frontend)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'role', 'aluno')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Garantir que a trigger existe na tabela auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


-- ============================================================
-- PASSO 2: Criar função que auto-gera perfil de aluno na
-- tabela students quando um novo usuário com role='aluno' é criado
-- ============================================================
CREATE OR REPLACE FUNCTION public.auto_create_student_profile()
RETURNS TRIGGER AS $$
DECLARE
  professor_id UUID;
  student_name TEXT;
BEGIN
  -- Só executa para alunos
  IF NEW.role <> 'aluno' THEN
    RETURN NEW;
  END IF;

  -- Busca o nome do aluno no user_metadata do auth.users
  SELECT
    COALESCE(
      raw_user_meta_data->>'name',
      email
    )
  INTO student_name
  FROM auth.users
  WHERE id = NEW.id;

  -- Busca o primeiro professor disponível
  SELECT id INTO professor_id
  FROM public.profiles
  WHERE role = 'professor'
  LIMIT 1;

  -- Só cria o perfil se houver um professor cadastrado
  IF professor_id IS NOT NULL THEN
    INSERT INTO public.students (user_id, name, goal, profile_data)
    VALUES (
      professor_id,
      COALESCE(student_name, 'Aluno'),
      'Hipertrofia',
      jsonb_build_object(
        'auth_user_id', NEW.id,
        'metrics', '[]'::jsonb
      )
    )
    ON CONFLICT DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- PASSO 3: Criar trigger na tabela profiles
DROP TRIGGER IF EXISTS on_aluno_profile_created ON public.profiles;
CREATE TRIGGER on_aluno_profile_created
  AFTER INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_create_student_profile();
