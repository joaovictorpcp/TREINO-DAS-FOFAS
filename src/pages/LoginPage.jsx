import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { Lock, LogIn, AlertCircle } from 'lucide-react';

const LoginPage = () => {
    const { signIn, session, role } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    // Redirect back to where they were or /gateway
    const from = location.state?.from?.pathname || '/gateway';

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // Efeito para observar session e role para redirecionar corretamente
    useEffect(() => {
        if (session && role) {
            navigate(from, { replace: true });
        }
    }, [session, role, navigate, from]);

    const handleLogin = async (e) => {
        e.preventDefault();
        // Não removemos o loading globalmente aqui para evitar que o botão volte
        // a ficar clicável enquanto o useEffect redireciona.
        setLoading(true);
        setError(null);

        try {
            const { error } = await signIn(email, password);
            if (error) throw error;
            // O redirecionamento será feito pelo useEffect, 
            // e o loading permanecerá true até desmontar.
        } catch (err) {
            setError(err.message || 'Falha ao fazer login');
            setLoading(false); // Retira o loading caso tenha dado erro
        }
    };

    return (
        <div style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'var(--bg-primary)',
            padding: '1rem'
        }}>
            <div className="glass-panel" style={{
                padding: '2.5rem',
                width: '100%',
                maxWidth: '400px',
                textAlign: 'center',
                border: '1px solid var(--border-subtle)'
            }}>
                <div style={{
                    width: '64px', height: '64px', background: 'rgba(204, 255, 0, 0.1)',
                    borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    margin: '0 auto 1.5rem', color: 'var(--accent-primary)'
                }}>
                    <Lock size={32} />
                </div>

                <h2 style={{ marginBottom: '0.5rem', color: 'var(--text-primary)', fontSize: '1.5rem', fontWeight: 800 }}>
                    Área do Treinador
                </h2>
                <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>
                    Faça login para gerenciar alunos e treinos.
                </p>

                {error && (
                    <div style={{
                        background: 'rgba(239, 68, 68, 0.1)',
                        border: '1px solid var(--accent-danger)',
                        color: 'var(--accent-danger)',
                        padding: '12px',
                        borderRadius: '8px',
                        marginBottom: '1.5rem',
                        fontSize: '0.9rem',
                        display: 'flex', alignItems: 'center', gap: '8px'
                    }}>
                        <AlertCircle size={16} />
                        {error === 'Invalid login credentials' ? 'Email ou senha incorretos' : error}
                    </div>
                )}

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
                        style={{ width: '100%', marginTop: '0.5rem', justifyContent: 'center' }}
                        disabled={loading}
                    >
                        {loading ? 'Entrando...' : (
                            <><LogIn size={18} /> Acessar Sistema</>
                        )}
                    </button>
                </form>

                <div style={{ marginTop: '2rem', borderTop: '1px solid var(--border-subtle)', paddingTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                        Não tem uma conta?{' '}
                        <Link to="/register" style={{ color: '#4ade80', textDecoration: 'none', fontWeight: 600 }}>
                            Criar Conta
                        </Link>
                    </p>

                    <button
                        type="button"
                        onClick={() => window.location.href = '/'}
                        className="btn"
                        style={{ width: '100%', background: 'transparent', color: 'var(--text-muted)', justifyContent: 'center' }}
                    >
                        Voltar para o Início
                    </button>
                </div>
            </div>
        </div>
    );
};

export default LoginPage;
