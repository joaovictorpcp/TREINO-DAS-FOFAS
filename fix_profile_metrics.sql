-- ============================================================
-- SCRIPT: Preparar tabela `profiles` para salvar pesos e medidas
-- Execute este script no SQL Editor do Supabase
-- ============================================================

-- 1. Garante que a tabela `profiles` possui a coluna `profile_data`
-- Esta coluna armazenará o histórico de pesos, medidas (dobras/perimetria)
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS profile_data jsonb DEFAULT '{}'::jsonb;

-- 2. Adiciona colunas extras que podem ser úteis para cálculos futuros, caso não existam
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS name text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS birth_date date;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS gender text;

-- 3. Atualiza as políticas de segurança (RLS - Row Level Security)
-- Isso permite que um usuário (aluno) possa atualizar sua própria linha na tabela `profiles` para salvar seu peso.
DROP POLICY IF EXISTS "Users can update their own profiles" ON public.profiles;
CREATE POLICY "Users can update their own profiles"
ON public.profiles FOR UPDATE
USING (auth.uid() = id);

-- NOTA: Os professores precisam de permissão para atualizar os profiles de seus alunos 
-- se eles forem os encarregados de inserir as medidas. Uma política mais ampla ou
-- baseada na relação aluno-professor pode ser necessária, mas como uma solução rápida
-- e se ambos (alunos e professores) puderem alterar livremente os perfis dependendo do cargo:

DROP POLICY IF EXISTS "Professors can update any profile" ON public.profiles;
CREATE POLICY "Professors can update any profile" 
ON public.profiles FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'professor'
  )
);
