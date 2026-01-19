-- Fix Security Warnings: Mutable Search Path
-- Use this script in the Supabase SQL Editor to resolve the security warnings.

-- 1. Fix public.handle_new_user
-- This function is likely a trigger for new users. 
-- Setting search_path ensures it doesn't look in unexpected schemas.
ALTER FUNCTION public.handle_new_user()
SET search_path = public;

-- 2. Fix public.is_professor
-- Assumes this function takes no arguments or specific arguments. 
-- If this fails (due to wrong signature), try identifying the arguments first.
-- Common signatures: is_professor(), is_professor(uuid), is_professor(user_id uuid)
DO $$
BEGIN
    BEGIN
        ALTER FUNCTION public.is_professor() SET search_path = public;
    EXCEPTION WHEN ORTHERS THEN
        NULL; -- Ignore if signature doesn't match
    END;
    
    BEGIN
        ALTER FUNCTION public.is_professor(uuid) SET search_path = public;
    EXCEPTION WHEN OTHERS THEN
        NULL;
    END;
END $$;

-- Explicitly try the most likely cases if the DO block above is too complex for simple execution
-- Uncomment the one that matches your function if the above doesn't cover it.
-- ALTER FUNCTION public.is_professor(auth.users.id%TYPE) SET search_path = public;

-- Enable Leaked Password Protection (Optional but recommended)
-- Note: This usually requires enabling the extension if not already present, 
-- but often can be toggled in the dashboard UI directly.
