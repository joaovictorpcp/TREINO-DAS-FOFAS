import React, { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useStudent } from '../../context/StudentContext';

const ProtectedRoute = ({ children }) => {
    const { session, loading } = useAuth();
    const { selectedStudentId } = useStudent();
    const location = useLocation();

    if (loading) {
        return (
            <div style={{
                height: '100vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'var(--bg-primary)',
                color: 'var(--accent-primary)'
            }}>
                Carregando...
            </div>
        );
    }

    // Must be logged in AND have a student selected (for student routes)
    // Trainer/Admin routes use AdminRoute instead
    if (!session) {
        return <Navigate to="/" state={{ from: location }} replace />;
    }

    // Optional: If you strictly require a student selection for these routes:
    // Optional: If you strictly require a student selection for these routes:
    if (!selectedStudentId && location.pathname !== '/gateway') {
        // If logged in but no student selected, maybe redirect to gateway?
        return <Navigate to="/gateway" replace />;
    }

    return children;
};

export default ProtectedRoute;
