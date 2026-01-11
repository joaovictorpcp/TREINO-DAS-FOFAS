import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Fail gracefully if env vars are missing to allow the app to render an error screen
let supabaseClient;

if (!supabaseUrl || !supabaseUrl.startsWith('http')) {
    console.error('CRITICAL: Supabase URL issue.');
    console.log('Value received:', supabaseUrl);
    console.log('Type:', typeof supabaseUrl);
    if (supabaseUrl) console.log('First char:', supabaseUrl.charAt(0));
    console.error('VITE_SUPABASE_URL is missing, empty, or does not start with http.');
    // Create a dummy client that warns on every method call to prevent "cannot read property of undefined" crashes
    supabaseClient = {
        auth: {
            getSession: async () => ({ data: { session: null } }),
            onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => { } } } }),
            signInWithPassword: async () => ({ error: { message: 'Supabase not configured' } }),
            signOut: async () => ({ error: null })
        },
        from: () => ({
            select: () => ({ order: () => ({ data: [], error: { message: 'Supabase Configuration Missing' } }) }),
            insert: () => ({ select: () => ({ single: () => ({ data: null, error: { message: 'Supabase Configuration Missing' } }) }) }),
            update: () => ({ eq: () => ({ select: () => ({ single: () => ({ data: null, error: { message: 'Supabase Configuration Missing' } }) }) }) }),
            delete: () => ({ eq: () => ({ error: { message: 'Supabase Configuration Missing' } }) })
        })
    };
} else {
    supabaseClient = createClient(supabaseUrl, supabaseAnonKey);
}

export const supabase = supabaseClient;
