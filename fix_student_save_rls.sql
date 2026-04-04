-- ============================================================
-- FIX: Permitir alunos salvarem seus próprios treinos
-- Execute este SQL no editor SQL do painel Supabase
-- ============================================================

-- 1. Alunos podem VER seus próprios treinos (pelo student_id)
DROP POLICY IF EXISTS "Students can view their own workouts" ON workouts;
CREATE POLICY "Students can view their own workouts"
ON workouts FOR SELECT
USING (auth.uid() = student_id);

-- 2. Alunos podem ATUALIZAR seus próprios treinos (pelo student_id)
--    Isso é necessário para que o aluno preencha peso, RPE, etc. 
--    mesmo que o treino tenha sido criado pelo professor (user_id diferente).
DROP POLICY IF EXISTS "Students can update their own workouts" ON workouts;
CREATE POLICY "Students can update their own workouts"
ON workouts FOR UPDATE
USING (auth.uid() = student_id)
WITH CHECK (auth.uid() = student_id);

-- 3. Alunos podem INSERIR seus próprios treinos (caso registrem atividades extras)
DROP POLICY IF EXISTS "Students can insert their own workouts" ON workouts;
CREATE POLICY "Students can insert their own workouts"
ON workouts FOR INSERT
WITH CHECK (auth.uid() = student_id);

-- Verificação: listar políticas da tabela workouts
-- SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
-- FROM pg_policies WHERE tablename = 'workouts';
