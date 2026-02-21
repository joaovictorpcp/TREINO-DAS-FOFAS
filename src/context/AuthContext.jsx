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
        let jaBuscouCargo = false; // <-- Nossa trava mágica contra o recarregamento de abas

        const inicializarSessao = async () => {
            try {
                const { data: { session }, error } = await supabase.auth.getSession();
                if (error) throw error;

                if (mounted) {
                    setSession(session);
                    if (session?.user) {
                        const userRole = await fetchUserRole(session.user.id, session.user.user_metadata);
                        if (mounted) {
                            setRole(userRole);
                            jaBuscouCargo = true; // Marca que já temos os dados
                        }
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
            if (!mounted) return;

            // 1. IGNORA MUDANÇAS DE ABA (O "porteiro" do Supabase)
            if (event === 'USER_UPDATED' || event === 'TOKEN_REFRESHED' || event === 'INITIAL_SESSION') {
                setSession(session); // Atualiza os dados por baixo dos panos silenciosamente
                return;
            }

            // 2. SE FIZER LOGOUT DE VERDADE
            if (event === 'SIGNED_OUT') {
                setSession(null);
                setRole(null);
                jaBuscouCargo = false; // Zera a trava para o próximo login
                setLoading(false);
                return;
            }

            // 3. SE FIZER LOGIN DE VERDADE NA TELA
            if (event === 'SIGNED_IN' && session?.user) {
                setSession(session);

                // Só aciona o "Carregando" se realmente for um login novo que ainda não puxou o cargo
                if (!jaBuscouCargo) {
                    setLoading(true);
                    const userRole = await fetchUserRole(session.user.id, session.user.user_metadata);
                    if (mounted) {
                        setRole(userRole);
                        jaBuscouCargo = true;
                        setLoading(false);
                    }
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

    const logout = async () => {
        try {
            await supabase.auth.signOut();
            window.location.href = '/'; // Força a volta para a tela inicial de Login
        } catch (error) {
            console.error("Erro ao sair:", error);
        }
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
                data: { full_name: name, role: role }
            }
        }),
        signOut,
        logout
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};
