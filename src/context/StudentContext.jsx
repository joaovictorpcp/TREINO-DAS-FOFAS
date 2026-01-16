import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../services/supabase';
import { useAuth } from './AuthContext';

/* eslint-disable react-refresh/only-export-components */

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

    // Selected Student State
    const [selectedStudentId, setSelectedStudentId] = useState(() => {
        return localStorage.getItem('selectedStudentId') || null;
    });

    // Body Metrics are derived from student data now, but we keep this state for compatibility/caching if needed
    // Actually, let's derive it on the fly or fetch it separately?
    // For simplicity, we'll fetch students and their data (including profile_data which has metrics?)
    // Wait, the schema has profile_data for static info.
    // AND we decided to keep metrics inside profile_data for now based on previous context analysis?
    // Let's check the schema again: "profile_data jsonb default '{}'::jsonb, -- Stores height, gender, birthDate, etc."
    // It DOES NOT explicitly say metrics array.
    // However, to avoid creating a new table mid-flight, let's store metrics in `profile_data.metrics`.

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
                .from('students')
                .select('*')
                .order('name');

            if (error) throw error;
            // Flatten profile_data for compatibility with components expecting student.birthDate etc.
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

    // Persist Selection Locally
    useEffect(() => {
        if (selectedStudentId) {
            localStorage.setItem('selectedStudentId', selectedStudentId);
        } else {
            localStorage.removeItem('selectedStudentId');
        }
    }, [selectedStudentId]);

    const addStudent = async (name, goal, profileData = {}) => {
        console.log('[StudentContext] addStudent called', { name, goal, profileData });

        // STRENGTHENED CHECK: Fetch fresh user from Supabase to ensure token is valid for current project
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            console.error('[StudentContext] Fresh Connection Check Failed:', authError);
            console.log('Session context was:', session); // Log what the context thought it had
            alert('Erro: Sessão inválida ou expirada. Por favor, faça login novamente.');
            // Optional: You could trigger a logout here via a callback or window.location
            return;
        }

        console.log('[StudentContext] Fresh User ID:', user.id);
        const userId = user.id;

        // Prepare new student object
        // We'll store initial weight in profile_data.metrics if provided
        let metrics = [];
        if (profileData.weight) {
            metrics.push({
                id: crypto.randomUUID(),
                weight: parseFloat(profileData.weight),
                date: new Date().toISOString().split('T')[0],
                created_at: new Date().toISOString()
            });
        }

        const newStudentData = {
            user_id: userId,
            name,
            goal,
            profile_data: {
                ...profileData,
                metrics // Initialize with first metric
            }
        };

        try {
            console.log('[StudentContext] Sending to Supabase:', newStudentData);
            const { data, error } = await supabase
                .from('students')
                .insert([newStudentData])
                .select()
                .single();

            if (error) {
                console.error('[StudentContext] Supabase Error:', error);
                throw error;
            }

            console.log('[StudentContext] Success:', data);
            const savedStudent = { ...data, ...(data.profile_data || {}) };
            setStudents(prev => [...prev, savedStudent]);

            // Auto select
            if (students.length === 0) {
                setSelectedStudentId(data.id);
            }
        } catch (error) {
            console.error('Error adding student:', error);
            alert(`Erro ao adicionar aluno: ${error.message || error.code}`);
        }
    };

    const deleteStudent = async (id) => {
        try {
            const { error } = await supabase
                .from('students')
                .delete()
                .eq('id', id);

            if (error) throw error;

            setStudents(prev => prev.filter(s => s.id !== id));
            if (selectedStudentId === id) {
                setSelectedStudentId(null);
            }
        } catch (error) {
            console.error('Error deleting student:', error);
            alert('Erro ao apagar aluno.');
        }
    };

    const updateStudent = async (id, updatedData) => {
        // We need to merge updatedData into the existing student
        // Note: updatedData might contain top-level fields (name, goal) OR profile_data fields

        const student = students.find(s => s.id === id);
        if (!student) return;

        const { name, goal, ...profileUpdates } = updatedData;

        // Prepare update object
        const updates = {};
        if (name) updates.name = name;
        if (goal) updates.goal = goal;

        // Merge profile data
        if (Object.keys(profileUpdates).length > 0) {
            updates.profile_data = {
                ...student.profile_data,
                ...profileUpdates
            };
        }

        try {
            const { data, error } = await supabase
                .from('students')
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

    // Body Metrics Helpers - Now working on profile_data.metrics array
    const getBodyMetrics = (studentId) => {
        const student = students.find(s => s.id === studentId);
        if (!student || !student.profile_data?.metrics) return [];

        return student.profile_data.metrics.sort((a, b) => new Date(a.date) - new Date(b.date));
    };

    const addBodyMetric = async (studentId, weight, date, skinfolds = null, bodyFat = null, circumferences = null) => {
        const student = students.find(s => s.id === studentId);
        if (!student) return;

        const currentMetrics = student.profile_data.metrics || [];

        const newMetric = {
            id: crypto.randomUUID(),
            studentId, // redundant but useful for compatibility
            weight: parseFloat(weight),
            date,
            skinfolds,
            circumferences,
            bodyFat: bodyFat ? parseFloat(bodyFat) : null,
            created_at: new Date().toISOString()
        };

        const updatedMetrics = [...currentMetrics, newMetric];

        // Update via updateStudent which handles the profile_data merge
        await updateStudent(studentId, { metrics: updatedMetrics });
    };

    const deleteBodyMetric = async (id) => {
        // Need to find which student has this metric
        // Inefficient search, but safe enough for small data
        // Ideally we pass studentId, but the interface is deleteBodyMetric(id)

        // Actually, we can use selectedStudentId as usage is typically in context of a student
        // Or find the student
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

    // Derived body metrics from all students (Restores compatibility with WeightTrackerPage consumption)
    const bodyMetrics = React.useMemo(() => {
        return students.flatMap(s => s.profile_data?.metrics || []);
    }, [students]);

    return (
        <StudentContext.Provider value={{
            students,
            loading,
            selectedStudentId,
            setSelectedStudentId,
            addStudent,
            deleteStudent,
            updateStudent,
            bodyMetrics, // Deprecated but exposed to avoid breaking destructuring
            addBodyMetric,
            getBodyMetrics,
            deleteBodyMetric,
            updateBodyMetric
        }}>
            {children}
        </StudentContext.Provider>
    );
};
