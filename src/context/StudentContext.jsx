import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../services/supabase';
import { useAuth } from './AuthContext';

const StudentContext = createContext();

export const useStudent = () => {
    const context = useContext(StudentContext);
    if (!context) {
        throw new Error('useStudent must be used within a StudentProvider');
    }
    return context;
};

export const StudentProvider = ({ children }) => {
    const { session } = useAuth();
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(true);

    const [selectedStudentId, setSelectedStudentId] = useState(() => {
        return localStorage.getItem('selectedStudentId') || null;
    });

    useEffect(() => {
        if (session?.user) {
            fetchStudents();
        } else {
            setStudents([]);
            setLoading(false);
        }
    }, [session]);

    const fetchStudents = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('role', 'aluno')
                .order('name');

            if (error) throw error;

            // Unificando profile_data. As vezes os dados vêm dentro de profile_data ou root.
            const mapped = (data || []).map(s => ({
                ...s,
                ...(s.profile_data || {})
            }));

            setStudents(mapped);
        } catch (error) {
            console.error('Error fetching students:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (selectedStudentId) {
            localStorage.setItem('selectedStudentId', selectedStudentId);
        } else {
            localStorage.removeItem('selectedStudentId');
        }
    }, [selectedStudentId]);

    const deleteStudent = async (id) => {
        alert('A exclusão de usuários deve ser feita pelo painel administrativo do Supabase.');
    };

    const updateStudent = async (id, updatedData) => {
        const student = students.find(s => s.id === id);
        if (!student) return;

        const { name, goal, ...profileUpdates } = updatedData;
        const updates = {};
        if (name) updates.name = name;

        if (Object.keys(profileUpdates).length > 0) {
            updates.profile_data = {
                ...student.profile_data,
                ...profileUpdates
            };
        }

        try {
            const { data, error } = await supabase
                .from('profiles')
                .update(updates)
                .eq('id', id)
                .select()
                .single();

            if (error) throw error;

            const savedStudent = { ...data, ...(data.profile_data || {}) };
            setStudents(prev => prev.map(s => s.id === id ? savedStudent : s));
        } catch (error) {
            console.error('Error updating student:', error);
        }
    };

    // --- Body Metrics (Working on profile_data.metrics array) ---
    const getBodyMetrics = (studentId) => {
        const student = students.find(s => s.id === studentId);
        if (!student || !student.profile_data?.metrics) return [];
        return student.profile_data.metrics.sort((a, b) => new Date(a.date) - new Date(b.date));
    };

    const addBodyMetric = async (studentId, weight, date, skinfolds = null, bodyFat = null, circumferences = null) => {
        const student = students.find(s => s.id === studentId);
        if (!student) return;

        const currentMetrics = student.profile_data?.metrics || [];
        const newMetric = {
            id: crypto.randomUUID(),
            studentId,
            weight: parseFloat(weight),
            date,
            skinfolds,
            circumferences,
            bodyFat: bodyFat ? parseFloat(bodyFat) : null,
            created_at: new Date().toISOString()
        };

        const updatedMetrics = [...currentMetrics, newMetric];
        await updateStudent(studentId, { metrics: updatedMetrics });
    };

    const deleteBodyMetric = async (id) => {
        let targetStudent = students.find(s => s.profile_data?.metrics?.some(m => m.id === id));
        if (targetStudent) {
            const currentMetrics = targetStudent.profile_data.metrics || [];
            const updatedMetrics = currentMetrics.filter(m => m.id !== id);
            await updateStudent(targetStudent.id, { metrics: updatedMetrics });
        }
    };

    const updateBodyMetric = async (id, weight, date, skinfolds = null, bodyFat = null, circumferences = null) => {
        let targetStudent = students.find(s => s.profile_data?.metrics?.some(m => m.id === id));
        if (targetStudent) {
            const currentMetrics = targetStudent.profile_data.metrics || [];
            const updatedMetrics = currentMetrics.map(m => {
                if (m.id === id) {
                    return {
                        ...m,
                        weight: parseFloat(weight),
                        date,
                        skinfolds: skinfolds || m.skinfolds,
                        circumferences: circumferences || m.circumferences,
                        bodyFat: bodyFat !== undefined ? parseFloat(bodyFat) : m.bodyFat
                    };
                }
                return m;
            });
            await updateStudent(targetStudent.id, { metrics: updatedMetrics });
        }
    };

    const bodyMetrics = React.useMemo(() => {
        return students.flatMap(s => s.profile_data?.metrics || []);
    }, [students]);

    return (
        <StudentContext.Provider value={{
            students,
            loading,
            selectedStudentId,
            setSelectedStudentId,
            deleteStudent,
            updateStudent,
            bodyMetrics,
            addBodyMetric,
            getBodyMetrics,
            deleteBodyMetric,
            updateBodyMetric
        }}>
            {children}
        </StudentContext.Provider>
    );
};
