
import React, { createContext, useContext, useState, useEffect } from 'react';

/* eslint-disable react-refresh/only-export-components */

const ExerciseContext = createContext();

export const useExercise = () => {
    const context = useContext(ExerciseContext);
    if (!context) {
        throw new Error('useExercise must be used within an ExerciseProvider');
    }
    return context;
};

export const ExerciseProvider = ({ children }) => {
    const [exercises, setExercises] = useState(() => {
        try {
            const saved = localStorage.getItem('exercises_db');
            return saved ? JSON.parse(saved) : [];
        } catch (error) {
            console.error('Failed to load exercises_db', error);
            return [];
        }
    });

    useEffect(() => {
        try {
            localStorage.setItem('exercises_db', JSON.stringify(exercises));
        } catch (error) {
            console.error('Failed to save exercises_db', error);
        }
    }, [exercises]);

    const addExercise = (exerciseData) => {
        // Check if exists by normalized name
        const normalized = exerciseData.normalizedName || exerciseData.name.trim();
        const exists = exercises.find(ex => ex.normalizedName?.toLowerCase() === normalized.toLowerCase());

        if (exists) {
            return exists; // Return existing
        }

        const newExercise = {
            id: crypto.randomUUID(),
            createdAt: new Date().toISOString(),
            name: exerciseData.name,
            normalizedName: normalized,
            muscleGroup: exerciseData.muscleGroup || 'Other',
            category: exerciseData.category || 'Strength',
            movementPattern: exerciseData.movementPattern || '',
            equipment: exerciseData.equipment || '',
            isCompound: exerciseData.isCompound !== undefined ? exerciseData.isCompound : false,
            riskFactor: exerciseData.riskFactor || 'Low' // From AI
        };

        setExercises(prev => [...prev, newExercise]);
        return newExercise;
    };

    const findExercise = (name) => {
        if (!name) return undefined;
        return exercises.find(ex =>
            ex.name.toLowerCase() === name.toLowerCase() ||
            ex.normalizedName?.toLowerCase() === name.toLowerCase()
        );
    };

    return (
        <ExerciseContext.Provider value={{
            exercises,
            addExercise,
            findExercise
        }}>
            {children}
        </ExerciseContext.Provider>
    );
};
