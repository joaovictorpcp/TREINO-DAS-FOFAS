import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Home, ArrowLeft } from 'lucide-react';

const NotFoundPage = () => {
    const navigate = useNavigate();

    return (
        <div style={{
            height: '100vh',
            width: '100vw',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'var(--bg-primary)',
            color: 'var(--text-primary)',
            textAlign: 'center',
            padding: '2rem'
        }}>
            <h1 style={{
                fontSize: '6rem',
                fontWeight: '800',
                color: 'var(--accent-primary)',
                lineHeight: 1,
                marginBottom: '1rem',
                textShadow: '0 0 20px rgba(74, 222, 128, 0.3)'
            }}>
                404
            </h1>
            <h2 style={{
                fontSize: '2rem',
                fontWeight: '600',
                marginBottom: '1rem'
            }}>
                Página Não Encontrada
            </h2>
            <p style={{
                color: 'var(--text-secondary)',
                maxWidth: '400px',
                marginBottom: '2rem',
                lineHeight: 1.6
            }}>
                A página que você está procurando pode ter sido removida, renomeada ou está temporariamente indisponível.
            </p>

            <div style={{ display: 'flex', gap: '1rem' }}>
                <button
                    onClick={() => navigate(-1)}
                    className="btn"
                    style={{
                        background: 'transparent',
                        border: '1px solid var(--border-subtle)',
                        color: 'var(--text-secondary)',
                        padding: '12px 24px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        borderRadius: '8px',
                        cursor: 'pointer'
                    }}
                >
                    <ArrowLeft size={20} />
                    Voltar
                </button>

                <button
                    onClick={() => navigate('/dashboard')}
                    className="btn"
                    style={{
                        background: 'var(--accent-primary)',
                        border: 'none',
                        color: '#000',
                        padding: '12px 24px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        fontWeight: '600'
                    }}
                >
                    <Home size={20} />
                    Ir para Início
                </button>
            </div>
        </div>
    );
};

export default NotFoundPage;
