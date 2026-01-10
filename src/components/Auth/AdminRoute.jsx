import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { Lock } from 'lucide-react';

const AdminRoute = ({ children }) => {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [pin, setPin] = useState('');
    const [error, setError] = useState(false);

    useEffect(() => {
        const SessionAuth = sessionStorage.getItem('admin_auth');
        if (SessionAuth === 'true') {
            setIsAuthenticated(true);
        }
    }, []);

    const handleLogin = (e) => {
        e.preventDefault();
        // Hardcoded PIN for "Trainer" access - safe enough for localStorage app
        if (pin === '0000') {
            sessionStorage.setItem('admin_auth', 'true');
            setIsAuthenticated(true);
        } else {
            setError(true);
            setPin('');
        }
    };

    if (isAuthenticated) {
        return children;
    }

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
                padding: '2rem',
                width: '100%',
                maxWidth: '400px',
                textAlign: 'center',
                border: '1px solid var(--border-subtle)'
            }}>
                <div style={{
                    width: '60px', height: '60px', background: 'rgba(255, 61, 0, 0.1)',
                    borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    margin: '0 auto 1.5rem', color: 'var(--accent-danger)'
                }}>
                    <Lock size={32} />
                </div>
                <h2 style={{ marginBottom: '0.5rem', color: 'var(--text-primary)' }}>Área Restrita</h2>
                <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>Digite o PIN do treinador para continuar.</p>

                <form onSubmit={handleLogin}>
                    <input
                        type="password"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        maxLength="4"
                        placeholder="PIN"
                        className="input"
                        value={pin}
                        onChange={(e) => {
                            setPin(e.target.value);
                            setError(false);
                        }}
                        style={{
                            textAlign: 'center',
                            fontSize: '1.5rem',
                            letterSpacing: '0.5rem',
                            marginBottom: '1rem',
                            borderColor: error ? 'var(--accent-danger)' : 'var(--border-subtle)'
                        }}
                        autoFocus
                    />
                    {error && <p style={{ color: 'var(--accent-danger)', fontSize: '0.9rem', marginBottom: '1rem' }}>PIN Incorreto</p>}
                    <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
                        Acessar
                    </button>
                    <button
                        type="button"
                        onClick={() => window.location.href = '/'}
                        className="btn"
                        style={{ width: '100%', marginTop: '1rem', background: 'transparent', color: 'var(--text-muted)' }}
                    >
                        Voltar
                    </button>
                </form>
            </div>
        </div>
    );
};

export default AdminRoute;
