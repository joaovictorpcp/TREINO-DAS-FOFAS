import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { UserPlus, Mail, Lock, User, AlertCircle, ArrowRight } from 'lucide-react';
import { supabase } from '../services/supabase';

const RegisterPage = () => {
    const { signUp } = useAuth();
    const navigate = useNavigate();

    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const handleRegister = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            // 1. Create Auth User
            const { data: authData, error: authError } = await signUp(email, password);
            if (authError) throw authError;

            if (authData?.user) {
                // 2. Create Student Record
                // We use the user's ID as the user_id foreign key
                const { error: studentError } = await supabase
                    .from('students')
                    .insert([{
                        user_id: authData.user.id,
                        name: name,
                        goal: 'Hipertrofia', // Default goal
                        profile_data: {}
                    }]);

                if (studentError) {
                    console.error("Error creating student profile:", studentError);
                    // Continue anyway, user exists, maybe they can fix profile later
                }

                alert("Conta criada com sucesso! Faça login para continuar.");
                navigate('/');
            } else {
                // Verification required case
                alert("Verifique seu email para confirmar o cadastro.");
                navigate('/');
            }

        } catch (err) {
            console.error("Registration error:", err);
            setError(err.message || 'Falha ao criar conta');
        } finally {
            setLoading(false);
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
                    width: '64px', height: '64px', background: 'rgba(74, 222, 128, 0.1)',
                    borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    margin: '0 auto 1.5rem', color: '#4ade80'
                }}>
                    <UserPlus size={32} />
                </div>

                <h2 style={{ marginBottom: '0.5rem', color: 'var(--text-primary)', fontSize: '1.5rem', fontWeight: 800 }}>
                    Criar Conta
                </h2>
                <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>
                    Comece sua jornada de treinos hoje.
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
                        {error}
                    </div>
                )}

                <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

                    <div style={{ textAlign: 'left' }}>
                        <label className="label">Nome Completo</label>
                        <div style={{ position: 'relative' }}>
                            <User size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                            <input
                                type="text"
                                className="input"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="Seu Nome"
                                required
                                style={{ width: '100%', paddingLeft: '40px' }}
                            />
                        </div>
                    </div>

                    <div style={{ textAlign: 'left' }}>
                        <label className="label">Email</label>
                        <div style={{ position: 'relative' }}>
                            <Mail size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                            <input
                                type="email"
                                className="input"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="seu@email.com"
                                required
                                style={{ width: '100%', paddingLeft: '40px' }}
                            />
                        </div>
                    </div>

                    <div style={{ textAlign: 'left' }}>
                        <label className="label">Senha</label>
                        <div style={{ position: 'relative' }}>
                            <Lock size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                            <input
                                type="password"
                                className="input"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="Mínimo 6 caracteres"
                                required
                                minLength={6}
                                style={{ width: '100%', paddingLeft: '40px' }}
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        className="btn btn-primary"
                        style={{ width: '100%', marginTop: '0.5rem', justifyContent: 'center', background: '#4ade80', color: '#000' }}
                        disabled={loading}
                    >
                        {loading ? 'Criando...' : (
                            <>Criar Conta <ArrowRight size={18} /></>
                        )}
                    </button>
                </form>

                <div style={{ marginTop: '2rem', borderTop: '1px solid var(--border-subtle)', paddingTop: '1.5rem' }}>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                        Já tem uma conta?{' '}
                        <Link to="/" style={{ color: '#4ade80', textDecoration: 'none', fontWeight: 600 }}>
                            Fazer Login
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default RegisterPage;
