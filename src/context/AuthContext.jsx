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
            // Tenta buscar do banco de dados
            const { data, error } = await supabase
                .from('profiles')
                .select('role')
                .eq('id', userId)
                .single();

            if (error) {
                console.error('[Auth] Erro do Supabase ao buscar role:', error.message);
                // Se der erro no banco, tenta usar o que está no metadata, ou assume 'aluno'
                return userMetadata?.role || 'aluno';
            }

            console.log(`[Auth] Role fetched: ${data?.role}`);
            return data?.role || 'aluno';

        } catch (error) {
            console.error('[Auth] Unexpected error fetching role:', error);
            return 'aluno';
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
            if (mounted) {
                setSession(session);

                if (event === 'SIGNED_IN' && session?.user) {
                    setLoading(true);
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
