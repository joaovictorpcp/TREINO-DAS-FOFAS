import React, { createContext, useContext, useState, useEffect } from 'react';

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
        } catch (error) {
            console.error('Failed to load students', error);
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
        } catch (error) {
            console.error('Failed to load body metrics', error);
            return [];
        }
    });

    // Persist Students
    useEffect(() => {
        try {
            localStorage.setItem('students', JSON.stringify(students));
        } catch (error) {
            console.error('Failed to save students', error);
        }
    }, [students]);

    // Persist Body Metrics
    useEffect(() => {
        try {
            localStorage.setItem('bodyMetrics', JSON.stringify(bodyMetrics));
        } catch (error) {
            console.error('Failed to save body metrics', error);
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

    const addStudent = (name, goal) => {
        const newStudent = {
            id: crypto.randomUUID(),
            created_at: new Date().toISOString(),
            name,
            goal
        };
        setStudents(prev => [...prev, newStudent]);
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

    const addBodyMetric = (studentId, weight, date) => {
        const newMetric = {
            id: crypto.randomUUID(),
            studentId,
            weight: parseFloat(weight),
            date,
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
            deleteBodyMetric
        }}>
            {children}
        </StudentContext.Provider>
    );
};
