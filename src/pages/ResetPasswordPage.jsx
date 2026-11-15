import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { KeyRound, Eye, EyeOff, AlertCircle, CheckCircle2, LogIn } from 'lucide-react';
import { supabase } from '../services/supabase';

const ResetPasswordPage = () => {
    const navigate = useNavigate();

    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(false);
    const [sessionReady, setSessionReady] = useState(false);

    // O Supabase redireciona com fragmentos de hash (#access_token=...&type=recovery)
    // O SDK detecta automaticamente e emite um evento PASSWORD_RECOVERY
    useEffect(() => {
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
            if (event === 'PASSWORD_RECOVERY') {
                setSessionReady(true);
            }
        });

        return () => subscription.unsubscribe();
    }, []);

    const handleReset = async (e) => {
        e.preventDefault();
        setError(null);

        if (password.length < 6) {
            setError('A senha deve ter no mínimo 6 caracteres.');
            return;
        }
        if (password !== confirmPassword) {
            setError('As senhas não coincidem. Verifique e tente novamente.');
            return;
        }

        setLoading(true);
        try {
            const { error } = await supabase.auth.updateUser({ password });
            if (error) throw error;
            setSuccess(true);
            // Desloga para forçar novo login com a nova senha
            setTimeout(async () => {
                await supabase.auth.signOut();
                navigate('/', { replace: true });
            }, 3000);
        } catch (err) {
            setError(err.message || 'Não foi possível redefinir a senha. Tente solicitar um novo link.');
        } finally {
            setLoading(false);
        }
    };

    const accentColor = '#a3e635';
    const accentGlow = 'rgba(163, 230, 53, 0.35)';
    const accentBg = 'rgba(163, 230, 53, 0.08)';

    return (
        <div style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'var(--bg-primary)',
            padding: '1rem',
        }}>
            <div className="glass-panel animate-fade-in" style={{
                padding: '2.5rem',
                width: '100%',
                maxWidth: '420px',
                textAlign: 'center',
                border: `1px solid ${accentColor}22`,
            }}>
                {/* Ícone */}
                <div style={{
                    width: '68px', height: '68px',
                    background: accentBg,
                    border: `1px solid ${accentColor}44`,
                    borderRadius: '50%',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    margin: '0 auto 1.5rem',
                    color: accentColor,
                    boxShadow: `0 0 20px ${accentGlow}`,
                }}>
                    {success ? <CheckCircle2 size={30} /> : <KeyRound size={30} />}
                </div>

                {success ? (
                    /* ---- Estado de Sucesso ---- */
                    <>
                        <h2 style={{ color: 'var(--text-primary)', fontSize: '1.5rem', fontWeight: 800, marginBottom: '0.5rem' }}>
                            Senha Atualizada!
                        </h2>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.6, marginBottom: '1.5rem' }}>
                            Sua senha foi redefinida com sucesso.<br />
                            Você será redirecionado para o login em instantes...
                        </p>
                        <button
                            type="button"
                            className="btn btn-primary"
                            onClick={() => navigate('/', { replace: true })}
                            style={{
                                width: '100%',
                                justifyContent: 'center',
                                gap: '8px',
                                background: accentColor,
                                color: 'var(--text-on-accent)',
                                boxShadow: `0 0 14px ${accentGlow}`,
                            }}
                        >
                            <LogIn size={17} /> Ir para o Login
                        </button>
                    </>
                ) : !sessionReady ? (
                    /* ---- Aguardando token do Supabase ---- */
                    <>
                        <h2 style={{ color: 'var(--text-primary)', fontSize: '1.4rem', fontWeight: 800, marginBottom: '0.5rem' }}>
                            Redefinir Senha
                        </h2>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', lineHeight: 1.5 }}>
                            Validando seu link de recuperação...
                        </p>
                        <div style={{
                            margin: '1.5rem auto',
                            width: '36px', height: '36px',
                            border: `3px solid ${accentColor}33`,
                            borderTop: `3px solid ${accentColor}`,
                            borderRadius: '50%',
                            animation: 'spin 0.8s linear infinite',
                        }} />
                        <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                            Se demorar, o link pode ter expirado.{' '}
                            <button
                                type="button"
                                onClick={() => navigate('/')}
                                style={{
                                    background: 'none',
                                    border: 'none',
                                    color: accentColor,
                                    cursor: 'pointer',
                                    fontSize: '0.8rem',
                                    fontWeight: 600,
                                    padding: 0,
                                }}
                            >
                                Voltar ao login.
                            </button>
                        </p>
                    </>
                ) : (
                    /* ---- Formulário de nova senha ---- */
                    <>
                        <h2 style={{ color: 'var(--text-primary)', fontSize: '1.5rem', fontWeight: 800, marginBottom: '0.4rem' }}>
                            Nova Senha
                        </h2>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', lineHeight: 1.5, marginBottom: '1.75rem' }}>
                            Escolha uma senha forte para sua conta.
                        </p>

                        {error && (
                            <div style={{
                                background: 'rgba(248, 113, 113, 0.08)',
                                border: '1px solid var(--accent-danger)',
                                color: 'var(--accent-danger)',
                                padding: '12px',
                                borderRadius: '10px',
                                marginBottom: '1.25rem',
                                fontSize: '0.88rem',
                                display: 'flex', alignItems: 'center', gap: '8px',
                                textAlign: 'left',
                            }}>
                                <AlertCircle size={16} style={{ flexShrink: 0 }} />
                                {error}
                            </div>
                        )}

                        <form onSubmit={handleReset} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            {/* Campo Nova Senha */}
                            <div style={{ textAlign: 'left' }}>
                                <label className="label">Nova Senha</label>
                                <div style={{ position: 'relative' }}>
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        className="input"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        placeholder="Mínimo 6 caracteres"
                                        required
                                        autoFocus
                                        style={{ width: '100%', paddingRight: '2.5rem' }}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(v => !v)}
                                        style={{
                                            position: 'absolute', right: '10px', top: '50%',
                                            transform: 'translateY(-50%)',
                                            background: 'transparent', border: 'none',
                                            color: 'var(--text-muted)', cursor: 'pointer', padding: '2px',
                                        }}
                                    >
                                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                    </button>
                                </div>
                            </div>

                            {/* Campo Confirmar Senha */}
                            <div style={{ textAlign: 'left' }}>
                                <label className="label">Confirmar Senha</label>
                                <div style={{ position: 'relative' }}>
                                    <input
                                        type={showConfirm ? 'text' : 'password'}
                                        className="input"
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        placeholder="Repita a nova senha"
                                        required
                                        style={{ width: '100%', paddingRight: '2.5rem' }}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowConfirm(v => !v)}
                                        style={{
                                            position: 'absolute', right: '10px', top: '50%',
                                            transform: 'translateY(-50%)',
                                            background: 'transparent', border: 'none',
                                            color: 'var(--text-muted)', cursor: 'pointer', padding: '2px',
                                        }}
                                    >
                                        {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                                    </button>
                                </div>
                            </div>

                            <button
                                type="submit"
                                className="btn btn-primary"
                                disabled={loading}
                                style={{
                                    width: '100%',
                                    marginTop: '0.25rem',
                                    justifyContent: 'center',
                                    gap: '8px',
                                    background: accentColor,
                                    color: 'var(--text-on-accent)',
                                    boxShadow: `0 0 14px ${accentGlow}`,
                                }}
                            >
                                {loading ? 'Salvando...' : (
                                    <><KeyRound size={17} /> Redefinir Senha</>
                                )}
                            </button>
                        </form>
                    </>
                )}
            </div>

            {/* Animação de spinner */}
            <style>{`
                @keyframes spin {
                    to { transform: rotate(360deg); }
                }
            `}</style>
        </div>
    );
};

export default ResetPasswordPage;
