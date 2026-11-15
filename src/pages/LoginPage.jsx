import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { LogIn, AlertCircle, Dumbbell, GraduationCap, KeyRound, ArrowLeft, Mail, CheckCircle2 } from 'lucide-react';
import { supabase } from '../services/supabase';

const LoginPage = () => {
    const { signIn, session, role } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    const from = location.state?.from?.pathname || '/gateway';

    const [selectedProfile, setSelectedProfile] = useState('aluno'); // 'aluno' | 'professor'
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // --- Esqueci minha senha ---
    const [showForgotPassword, setShowForgotPassword] = useState(false);
    const [forgotEmail, setForgotEmail] = useState('');
    const [forgotLoading, setForgotLoading] = useState(false);
    const [forgotError, setForgotError] = useState(null);
    const [forgotSuccess, setForgotSuccess] = useState(false);

    // Redireciona quando sessão + role estiverem prontos
    useEffect(() => {
        if (session && role) {
            navigate(from, { replace: true });
        }
    }, [session, role, navigate, from]);

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const { error } = await signIn(email, password);
            if (error) throw error;
            // Redirecionamento via useEffect após role ser carregado
        } catch (err) {
            setError(err.message || 'Falha ao fazer login');
            setLoading(false);
        }
    };

    const handleForgotPassword = async (e) => {
        e.preventDefault();
        setForgotLoading(true);
        setForgotError(null);

        try {
            const redirectTo = `${window.location.origin}/reset-password`;
            const { error } = await supabase.auth.resetPasswordForEmail(forgotEmail.trim(), {
                redirectTo,
            });
            if (error) throw error;
            setForgotSuccess(true);
        } catch (err) {
            setForgotError(err.message || 'Não foi possível enviar o email. Tente novamente.');
        } finally {
            setForgotLoading(false);
        }
    };

    const handleCloseForgot = () => {
        setShowForgotPassword(false);
        setForgotEmail('');
        setForgotError(null);
        setForgotSuccess(false);
    };

    // Cores e textos dinâmicos por perfil
    const isAluno = selectedProfile === 'aluno';
    const accentColor = isAluno ? '#a3e635' : '#60a5fa';
    const accentGlow = isAluno ? 'rgba(163, 230, 53, 0.35)' : 'rgba(96, 165, 250, 0.35)';
    const accentBg = isAluno ? 'rgba(163, 230, 53, 0.08)' : 'rgba(96, 165, 250, 0.08)';

    const profileConfig = {
        aluno: {
            icon: <Dumbbell size={28} />,
            title: 'Área do Aluno',
            subtitle: 'Acesse seus treinos, evolução e medidas corporais.',
            btnLabel: 'Entrar como Aluno',
        },
        professor: {
            icon: <GraduationCap size={28} />,
            title: 'Área do Professor',
            subtitle: 'Gerencie seus alunos, treinos e planejamentos.',
            btnLabel: 'Entrar como Professor',
        },
    };

    const cfg = profileConfig[selectedProfile];

    return (
        <div style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'var(--bg-primary)',
            padding: '1rem'
        }}>
            <div className="glass-panel animate-fade-in" style={{
                padding: '2.5rem',
                width: '100%',
                maxWidth: '420px',
                textAlign: 'center',
                border: `1px solid ${accentColor}22`,
                transition: 'border-color 0.4s ease',
            }}>

                {/* Ícone dinâmico */}
                <div style={{
                    width: '68px', height: '68px',
                    background: accentBg,
                    border: `1px solid ${accentColor}44`,
                    borderRadius: '50%',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    margin: '0 auto 1.5rem',
                    color: accentColor,
                    transition: 'all 0.4s ease',
                    boxShadow: `0 0 20px ${accentGlow}`,
                }}>
                    {cfg.icon}
                </div>

                {/* Título dinâmico */}
                <h2 style={{
                    marginBottom: '0.4rem',
                    color: 'var(--text-primary)',
                    fontSize: '1.5rem',
                    fontWeight: 800,
                    transition: 'all 0.3s ease',
                }}>
                    {cfg.title}
                </h2>
                <p style={{ color: 'var(--text-secondary)', marginBottom: '1.75rem', fontSize: '0.9rem', lineHeight: 1.5 }}>
                    {cfg.subtitle}
                </p>

                {/* Seletor de Perfil */}
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: '0.5rem',
                    marginBottom: '1.75rem',
                    padding: '4px',
                    background: 'var(--bg-secondary)',
                    borderRadius: '14px',
                    border: '1px solid var(--border-subtle)',
                }}>
                    {[
                        { key: 'aluno', label: 'Sou Aluno', icon: <Dumbbell size={15} />, color: '#a3e635' },
                        { key: 'professor', label: 'Sou Professor', icon: <GraduationCap size={15} />, color: '#60a5fa' },
                    ].map(opt => {
                        const active = selectedProfile === opt.key;
                        return (
                            <button
                                key={opt.key}
                                type="button"
                                onClick={() => { setSelectedProfile(opt.key); setError(null); }}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '7px',
                                    padding: '10px 8px',
                                    borderRadius: '10px',
                                    border: active ? `1.5px solid ${opt.color}66` : '1.5px solid transparent',
                                    background: active ? `${opt.color}12` : 'transparent',
                                    color: active ? opt.color : 'var(--text-muted)',
                                    fontWeight: active ? 700 : 500,
                                    fontSize: '0.83rem',
                                    cursor: 'pointer',
                                    transition: 'all 0.25s ease',
                                    whiteSpace: 'nowrap',
                                    minHeight: '40px',
                                }}
                            >
                                {opt.icon}
                                {opt.label}
                            </button>
                        );
                    })}
                </div>

                {/* Alerta de Erro */}
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
                        {error === 'Invalid login credentials' ? 'Email ou senha incorretos.' : error}
                    </div>
                )}

                {/* Formulário */}
                <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div style={{ textAlign: 'left' }}>
                        <label className="label">Email</label>
                        <input
                            type="email"
                            className="input"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="seu@email.com"
                            required
                            style={{ width: '100%' }}
                        />
                    </div>

                    <div style={{ textAlign: 'left' }}>
                        <label className="label">Senha</label>
                        <input
                            type="password"
                            className="input"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="••••••••"
                            required
                            style={{ width: '100%' }}
                        />
                        {/* Link Esqueci minha senha */}
                        <button
                            type="button"
                            onClick={() => { setShowForgotPassword(true); setForgotEmail(email); }}
                            style={{
                                background: 'transparent',
                                border: 'none',
                                color: accentColor,
                                fontSize: '0.8rem',
                                fontWeight: 600,
                                cursor: 'pointer',
                                padding: '6px 0 0',
                                display: 'block',
                                textAlign: 'right',
                                width: '100%',
                                opacity: 0.85,
                                transition: 'opacity 0.2s',
                            }}
                            onMouseOver={e => e.currentTarget.style.opacity = '1'}
                            onMouseOut={e => e.currentTarget.style.opacity = '0.85'}
                        >
                            Esqueci minha senha
                        </button>
                    </div>

                    <button
                        type="submit"
                        className="btn btn-primary"
                        style={{
                            width: '100%',
                            marginTop: '0.5rem',
                            justifyContent: 'center',
                            gap: '8px',
                            background: accentColor,
                            color: 'var(--text-on-accent)',
                            boxShadow: `0 0 14px ${accentGlow}`,
                            transition: 'all 0.3s ease',
                        }}
                        disabled={loading}
                    >
                        {loading ? 'Entrando...' : (
                            <><LogIn size={17} /> {cfg.btnLabel}</>
                        )}
                    </button>
                </form>

                {/* Rodapé */}
                <div style={{
                    marginTop: '2rem',
                    borderTop: '1px solid var(--border-subtle)',
                    paddingTop: '1.5rem',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.75rem',
                }}>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem' }}>
                        Não tem uma conta?{' '}
                        <Link
                            to="/register"
                            style={{ color: accentColor, textDecoration: 'none', fontWeight: 700, transition: 'color 0.3s' }}
                        >
                            Criar Conta
                        </Link>
                    </p>
                    <button
                        type="button"
                        onClick={() => navigate('/')}
                        style={{
                            background: 'transparent',
                            border: 'none',
                            color: 'var(--text-muted)',
                            fontSize: '0.85rem',
                            cursor: 'pointer',
                            padding: '4px',
                        }}
                    >
                        Voltar para o Início
                    </button>
                </div>
            </div>

            {/* ===== MODAL ESQUECI MINHA SENHA ===== */}
            {showForgotPassword && (
                <div
                    style={{
                        position: 'fixed',
                        inset: 0,
                        background: 'rgba(0,0,0,0.65)',
                        backdropFilter: 'blur(4px)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 1000,
                        padding: '1rem',
                    }}
                    onClick={(e) => { if (e.target === e.currentTarget) handleCloseForgot(); }}
                >
                    <div className="glass-panel animate-fade-in" style={{
                        padding: '2rem',
                        width: '100%',
                        maxWidth: '380px',
                        textAlign: 'center',
                        border: `1px solid ${accentColor}33`,
                    }}>
                        {/* Ícone */}
                        <div style={{
                            width: '58px', height: '58px',
                            background: accentBg,
                            border: `1px solid ${accentColor}44`,
                            borderRadius: '50%',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            margin: '0 auto 1.25rem',
                            color: accentColor,
                            boxShadow: `0 0 18px ${accentGlow}`,
                        }}>
                            {forgotSuccess ? <CheckCircle2 size={26} /> : <KeyRound size={26} />}
                        </div>

                        {forgotSuccess ? (
                            /* --- Estado de Sucesso --- */
                            <>
                                <h3 style={{ color: 'var(--text-primary)', fontSize: '1.2rem', fontWeight: 800, marginBottom: '0.5rem' }}>
                                    Email Enviado!
                                </h3>
                                <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', lineHeight: 1.6, marginBottom: '1.5rem' }}>
                                    Enviamos um link de redefinição de senha para{' '}
                                    <strong style={{ color: accentColor }}>{forgotEmail}</strong>.
                                    <br /><br />
                                    Verifique sua caixa de entrada (e a pasta de spam).
                                </p>
                                <button
                                    type="button"
                                    className="btn btn-primary"
                                    onClick={handleCloseForgot}
                                    style={{
                                        width: '100%',
                                        justifyContent: 'center',
                                        background: accentColor,
                                        color: 'var(--text-on-accent)',
                                        boxShadow: `0 0 14px ${accentGlow}`,
                                    }}
                                >
                                    Voltar ao Login
                                </button>
                            </>
                        ) : (
                            /* --- Formulário de Recuperação --- */
                            <>
                                <h3 style={{ color: 'var(--text-primary)', fontSize: '1.2rem', fontWeight: 800, marginBottom: '0.4rem' }}>
                                    Recuperar Senha
                                </h3>
                                <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', lineHeight: 1.5, marginBottom: '1.5rem' }}>
                                    Informe seu email cadastrado e enviaremos um link para você criar uma nova senha.
                                </p>

                                {forgotError && (
                                    <div style={{
                                        background: 'rgba(248, 113, 113, 0.08)',
                                        border: '1px solid var(--accent-danger)',
                                        color: 'var(--accent-danger)',
                                        padding: '10px 12px',
                                        borderRadius: '10px',
                                        marginBottom: '1rem',
                                        fontSize: '0.85rem',
                                        display: 'flex', alignItems: 'center', gap: '8px',
                                        textAlign: 'left',
                                    }}>
                                        <AlertCircle size={15} style={{ flexShrink: 0 }} />
                                        {forgotError}
                                    </div>
                                )}

                                <form onSubmit={handleForgotPassword} style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
                                    <div style={{ textAlign: 'left' }}>
                                        <label className="label" style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                                            <Mail size={13} /> Email cadastrado
                                        </label>
                                        <input
                                            type="email"
                                            className="input"
                                            value={forgotEmail}
                                            onChange={(e) => setForgotEmail(e.target.value)}
                                            placeholder="seu@email.com"
                                            required
                                            autoFocus
                                            style={{ width: '100%' }}
                                        />
                                    </div>

                                    <button
                                        type="submit"
                                        className="btn btn-primary"
                                        disabled={forgotLoading}
                                        style={{
                                            width: '100%',
                                            justifyContent: 'center',
                                            gap: '8px',
                                            background: accentColor,
                                            color: 'var(--text-on-accent)',
                                            boxShadow: `0 0 14px ${accentGlow}`,
                                        }}
                                    >
                                        {forgotLoading ? 'Enviando...' : (
                                            <><Mail size={16} /> Enviar Link de Recuperação</>
                                        )}
                                    </button>

                                    <button
                                        type="button"
                                        onClick={handleCloseForgot}
                                        style={{
                                            background: 'transparent',
                                            border: 'none',
                                            color: 'var(--text-muted)',
                                            fontSize: '0.85rem',
                                            cursor: 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            gap: '5px',
                                            padding: '4px',
                                        }}
                                    >
                                        <ArrowLeft size={14} /> Voltar ao Login
                                    </button>
                                </form>
                            </>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default LoginPage;
