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
        console.log(`[Auth] Fetching role for user ${userId}...`);
        try {
            const fetchPromise = supabase
                .from('profiles')
                .select('role')
                .eq('id', userId)
                .single();

            const timeoutPromise = new Promise((_, reject) =>
                setTimeout(() => reject(new Error('TIMEOUT')), 3000)
            );

            console.log(`[Auth] Iniciando busca no DB com timeout de 3s...`);
            const { data, error } = await Promise.race([fetchPromise, timeoutPromise]);

            if (error) {
                console.error('[Auth] Erro do Supabase ao buscar role:', error.message);
                return userMetadata?.role || 'aluno';
            }

            console.log(`[Auth] DB Sucesso! Role fetched: ${data?.role}`);
            return data?.role || 'aluno';

        } catch (error) {
            if (error.message === 'TIMEOUT') {
                console.error('[Auth] ERRO DE TIMEOUT: O banco de dados (profiles) demorou mais de 3 segundos para responder. Abortando e retornando role fallback.');
            } else {
                console.error('[Auth] Unexpected error fetching role:', error);
            }
            return userMetadata?.role || 'aluno';
        }
    };

    useEffect(() => {
        let mounted = true;

        const inicializarSessao = async () => {
            try {
                const { data: { session }, error } = await supabase.auth.getSession();
                if (error) throw error;

                if (mounted) {
                    setSession(session);
                    if (session?.user) {
                        const userRole = await fetchUserRole(session.user.id, session.user.user_metadata);
                        if (mounted) setRole(userRole);
                    }
                }
            } catch (error) {
                console.error('[Auth] Erro ao inicializar a sessão:', error);
            } finally {
                if (mounted) setLoading(false);
            }
        };

        inicializarSessao();

        const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
            console.log('[Auth] Evento recebido:', event);

            if (mounted) {
                setSession(session);

                // Silently update session on these events without showing loading screen or fetching role
                if (['TOKEN_REFRESHED', 'USER_UPDATED', 'INITIAL_SESSION'].includes(event)) {
                    return;
                }

                if (event === 'SIGNED_IN' && session?.user && !role) {
                    setLoading(true);
                    try {
                        const userRole = await fetchUserRole(session.user.id, session.user.user_metadata);
                        if (mounted) setRole(userRole);
                    } catch (error) {
                        console.error('[Auth] Erro não tratado no listener:', error);
                        if (mounted) setRole('aluno');
                    } finally {
                        if (mounted) setLoading(false);
                    }
                } else if (event === 'SIGNED_OUT') {
                    setRole(null);
                    setLoading(false);
                }
            }
        });

        return () => {
            mounted = false;
            if (authListener?.subscription) {
                authListener.subscription.unsubscribe();
            }
        };
    }, []);

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
