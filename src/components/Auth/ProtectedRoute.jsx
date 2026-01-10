import React from 'react';
import { Navigate } from 'react-router-dom';
import { useStudent } from '../../context/StudentContext';

const ProtectedRoute = ({ children }) => {
    const { selectedStudentId } = useStudent();

    if (!selectedStudentId) {
        return <Navigate to="/" replace />;
    }

    return children;
};

export default ProtectedRoute;
