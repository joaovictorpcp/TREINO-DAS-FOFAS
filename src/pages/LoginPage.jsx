import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { LogIn, AlertCircle, Dumbbell, GraduationCap } from 'lucide-react';

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
        </div>
    );
};

export default LoginPage;
