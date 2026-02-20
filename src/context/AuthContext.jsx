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

    const fetchUserRole = async (userId) => {
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
                console.warn('[Auth] User has no profile. Attempting to create one...');
                // Try to get role from user metadata (set during sign-up)
                const { data: { user: authUser } } = await supabase.auth.getUser();
                const metaRole = authUser?.user_metadata?.role || 'aluno';
                const { error: insertError } = await supabase
                    .from('profiles')
                    .insert([{ id: userId, role: metaRole }]);

                if (insertError) {
                    console.error('[Auth] Failed to create default profile:', insertError);
                } else {
                    console.log('[Auth] Default profile created successfully.');
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

        // Safety Timeout: Force loading to false after 5 seconds if getting role hangs
        const safetyTimeout = setTimeout(() => {
            if (mounted && loading) {
                console.warn('[Auth] Session check timed out. Forcing generic access.');
                if (mounted) setLoading(false);
                // We do NOT log out here anymore to avoid loops.
                // If init fails, the user might see a broken state, but won't be in a loop.
            }
        }, 5000);

        const initSession = async () => {
            try {
                const { data: { session } } = await supabase.auth.getSession();

                if (mounted) {
                    setSession(session);
                    if (session?.user) {
                        const userRole = await fetchUserRole(session.user.id);
                        if (mounted) setRole(userRole);
                    } else {
                        if (mounted) setRole(null);
                    }
                }
            } catch (error) {
                console.error('[Auth] Session init error:', error);
            } finally {
                if (mounted) setLoading(false);
            }
        };

        initSession();

        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
            if (!mounted) return;
            console.log(`[Auth] Auth State Changed: ${event}`, session?.user?.id ? `User: ${session.user.id}` : 'No User');

            try {
                setSession(session);

                if (session?.user) {
                    const userRole = await fetchUserRole(session.user.id);
                    if (mounted) setRole(userRole);
                } else {
                    if (mounted) setRole(null);
                }
            } catch (error) {
                console.error('[Auth] Auth state change error:', error);
            } finally {
                if (mounted) setLoading(false);
            }
        });

        return () => {
            mounted = false;
            clearTimeout(safetyTimeout);
            subscription.unsubscribe();
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
                data: {
                    name,
                    role
                }
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
