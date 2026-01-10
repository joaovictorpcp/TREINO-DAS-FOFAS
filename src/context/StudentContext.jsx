import React, { createContext, useContext, useState, useEffect } from 'react';

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
    // Load Students
    const [students, setStudents] = useState(() => {
        try {
            const saved = localStorage.getItem('students');
            return saved ? JSON.parse(saved) : [];
        } catch {
            console.error('Failed to load students');
            return [];
        }
    });

    // Load Selected Student ID
    const [selectedStudentId, setSelectedStudentId] = useState(() => {
        return localStorage.getItem('selectedStudentId') || null;
    });

    // Load Body Metrics
    const [bodyMetrics, setBodyMetrics] = useState(() => {
        try {
            const saved = localStorage.getItem('bodyMetrics');
            return saved ? JSON.parse(saved) : [];
        } catch {
            console.error('Failed to load body metrics');
            return [];
        }
    });

    // Persist Students
    useEffect(() => {
        try {
            localStorage.setItem('students', JSON.stringify(students));
        } catch {
            console.error('Failed to save students');
        }
    }, [students]);

    // Persist Body Metrics
    useEffect(() => {
        try {
            localStorage.setItem('bodyMetrics', JSON.stringify(bodyMetrics));
        } catch {
            console.error('Failed to save body metrics');
        }
    }, [bodyMetrics]);

    // Persist Selection
    useEffect(() => {
        if (selectedStudentId) {
            localStorage.setItem('selectedStudentId', selectedStudentId);
        } else {
            localStorage.removeItem('selectedStudentId');
        }
    }, [selectedStudentId]);

    const addStudent = (name, goal, profileData = {}) => {
        const newStudent = {
            id: crypto.randomUUID(),
            created_at: new Date().toISOString(),
            name,
            goal,
            birthDate: profileData.birthDate || null,
            gender: profileData.gender || 'male', // 'male' or 'female'
            height: profileData.height || '',
            ...profileData
        };

        setStudents(prev => [...prev, newStudent]);

        // If weight provided, log it as first metric
        if (profileData.weight) {
            addBodyMetric(newStudent.id, profileData.weight, new Date().toISOString().split('T')[0]);
        }

        // Auto select if it's the first one
        if (students.length === 0) {
            setSelectedStudentId(newStudent.id);
        }
    };

    const deleteStudent = (id) => {
        setStudents(prev => prev.filter(s => s.id !== id));
        if (selectedStudentId === id) {
            setSelectedStudentId(null);
        }
    };

    const updateStudent = (id, updatedData) => {
        setStudents(prev => prev.map(s => {
            if (s.id === id) {
                return { ...s, ...updatedData };
            }
            return s;
        }));
    };

    const addBodyMetric = (studentId, weight, date, skinfolds = null, bodyFat = null, circumferences = null) => {
        const newMetric = {
            id: crypto.randomUUID(),
            studentId,
            weight: parseFloat(weight),
            date,
            skinfolds, // { chest, axilla, triceps, subscapular, abdomen, suprailiac, thigh }
            circumferences, // { arm, forearm, thigh, calf, hips, abdomen, waist, chest, shoulder, neck }
            bodyFat: bodyFat ? parseFloat(bodyFat) : null,
            created_at: new Date().toISOString()
        };
        setBodyMetrics(prev => [...prev, newMetric]);

        // Also update current weight on student object for caching
        updateStudent(studentId, { weight: parseFloat(weight) });
    };

    const getBodyMetrics = (studentId) => {
        return bodyMetrics
            .filter(m => m.studentId === studentId)
            .sort((a, b) => new Date(a.date) - new Date(b.date));
    };

    const deleteBodyMetric = (id) => {
        // Find existing metric
        const metricToDelete = bodyMetrics.find(m => m.id === id);

        if (metricToDelete) {
            // Filter out the deleted one
            const updatedMetrics = bodyMetrics.filter(m => m.id !== id);

            // Update state
            setBodyMetrics(updatedMetrics);

            // Update student current weight cache
            const studentMetrics = updatedMetrics
                .filter(m => m.studentId === metricToDelete.studentId)
                .sort((a, b) => new Date(a.date) - new Date(b.date));

            const latest = studentMetrics.length > 0 ? studentMetrics[studentMetrics.length - 1] : null;
            updateStudent(metricToDelete.studentId, { weight: latest ? latest.weight : null });
        }
    };

    const updateBodyMetric = (id, weight, date, skinfolds = null, bodyFat = null, circumferences = null) => {
        setBodyMetrics(prev => {
            const updated = prev.map(m => {
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

            // Update student cache if necessary
            // We need to find the studentId to check if this update affects the 'latest' weight
            const metric = prev.find(m => m.id === id);
            if (metric) {
                // Get all metrics for this student from the NEW updated list
                const studentMetrics = updated
                    .filter(m => m.studentId === metric.studentId)
                    .sort((a, b) => new Date(a.date) - new Date(b.date));

                const latest = studentMetrics.length > 0 ? studentMetrics[studentMetrics.length - 1] : null;
                updateStudent(metric.studentId, { weight: latest ? latest.weight : null });
            }

            return updated;
        });
    };

    return (
        <StudentContext.Provider value={{
            students,
            selectedStudentId,
            setSelectedStudentId,
            addStudent,
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
