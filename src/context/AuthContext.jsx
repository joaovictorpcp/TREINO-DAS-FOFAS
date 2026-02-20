import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../services/supabase';

/* eslint-disable react-refresh/only-export-components */

const AuthContext = createContext();

export const useAuth = () => {
    return useContext(AuthContext);
};

export const AuthProvider = ({ children }) => {
    const [session, setSession] = useState(null);
    const [role, setRole] = useState(null);
    const [loading, setLoading] = useState(true);

    /**
     * Fetch the role from the profiles table.
     * IMPORTANT: Do NOT call supabase.auth.getUser() here — it can re-trigger
     * onAuthStateChange and cause an infinite loop.
     * The user object is passed directly from the session or auth event.
     */
    const fetchUserRole = async (userId, userMetadata = {}) => {
        if (!userId) return 'aluno';
        try {
            console.log(`[Auth] Fetching role for user ${userId}...`);
            const { data, error } = await supabase
                .from('profiles')
                .select('role')
                .eq('id', userId)
                .maybeSingle();

            if (error) {
                console.error('[Auth] Error fetching role:', error);
                return 'aluno';
            }

            if (!data) {
                // No profile yet — create one using role from user_metadata
                // (the DB trigger handle_new_user should have already done this,
                //  but as a safety fallback we do it here too)
                const metaRole = userMetadata?.role || 'aluno';
                console.warn(`[Auth] No profile found. Creating with role="${metaRole}"...`);
                const { error: insertError } = await supabase
                    .from('profiles')
                    .insert([{ id: userId, role: metaRole }]);

                if (insertError && insertError.code !== '23505') {
                    // 23505 = unique_violation (profile already exists — race condition, safe to ignore)
                    console.error('[Auth] Failed to create default profile:', insertError);
                } else {
                    console.log('[Auth] Default profile created or already existed.');
                }
                return metaRole;
            }

            console.log(`[Auth] Role fetched: ${data.role}`);
            return data.role || 'aluno';
        } catch (error) {
            console.error('[Auth] Unexpected error fetching role:', error);
            return 'aluno';
        }
    };

    useEffect(() => {
        let mounted = true;

        const inicializarSessao = async () => {
            try {
                // 1. Pega a sessão atual
                const { data: { session }, error } = await supabase.auth.getSession();
                if (error) throw error;

                if (mounted) {
                    setSession(session);

                    // 2. Se tiver usuário, busca a role dele de forma segura
                    if (session?.user) {
                        const userRole = await fetchUserRole(session.user.id, session.user.user_metadata);
                        if (mounted) setRole(userRole);
                    }
                }
            } catch (error) {
                console.error('[Auth] Erro ao inicializar a sessão:', error);
            } finally {
                // 3. Independentemente de dar certo ou errado, tira o loading!
                if (mounted) setLoading(false);
            }
        };

        inicializarSessao();

        // 4. Escuta mudanças (ex: quando o usuário acaba de fazer o login na tela)
        const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
            if (mounted) {
                setSession(session);

                if (event === 'SIGNED_IN' && session?.user) {
                    setLoading(true); // Garante a tela de carregamento durante a busca
                    const userRole = await fetchUserRole(session.user.id, session.user.user_metadata);
                    if (mounted) {
                        setRole(userRole);
                        setLoading(false);
                    }
                } else if (event === 'SIGNED_OUT') {
                    setRole(null);
                    setLoading(false);
                }
            }
        });

        // 5. Limpeza de segurança quando o componente for desmontado
        return () => {
            mounted = false;
            if (authListener?.subscription) {
                authListener.subscription.unsubscribe();
            }
        };
    }, []); // <-- O array vazio garante que isso rode apenas 1 vez ao carregar a página

    const signIn = async (email, password) => {
        return supabase.auth.signInWithPassword({ email, password });
    };

    const signOut = async () => {
        setRole(null);
        return supabase.auth.signOut();
    };

    const value = {
        session,
        user: session?.user ?? null,
        role,
        loading,
        signIn,
        signUp: (email, password, name, role = 'aluno') => supabase.auth.signUp({
            email,
            password,
            options: {
                emailRedirectTo: window.location.origin,
                data: { name, role }
            }
        }),
        signOut
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};
