import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Lock, Loader2 } from 'lucide-react';

const AdminRoute = ({ children }) => {
    const { session, loading } = useAuth();
    const location = useLocation();

    if (loading) {
        return (
            <div style={{
                minHeight: '100vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'var(--bg-primary)',
                color: 'var(--text-primary)'
            }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
                    <Loader2 className="spin" size={32} style={{ color: 'var(--accent-primary)' }} />
                    <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Verificando acesso...</span>
                </div>
            </div>
        );
    }

    if (!session) {
        // Redirect to login page, saving the current location they were trying to go to
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    return children;
};

export default AdminRoute;
