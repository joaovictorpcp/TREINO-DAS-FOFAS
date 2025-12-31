import React, { createContext, useContext, useState, useEffect } from 'react';

const WorkoutContext = createContext();

export const useWorkout = () => {
  const context = useContext(WorkoutContext);
  if (!context) {
    throw new Error('useWorkout must be used within a WorkoutProvider');
  }
  return context;
};

export const WorkoutProvider = ({ children }) => {
  // Initialize with empty array (clean slate)
  const [workouts, setWorkouts] = useState(() => {
    try {
      const saved = localStorage.getItem('workouts');
      return saved ? JSON.parse(saved) : [];
    } catch (error) {
      console.error('Failed to load workouts', error);
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('workouts', JSON.stringify(workouts));
    } catch (error) {
      console.error('Failed to save workouts', error);
    }
  }, [workouts]);

  const addWorkout = (workout) => {
    const newWorkout = {
      id: crypto.randomUUID(), // Ensure string ID
      date: new Date().toISOString(),
      ...workout,
    };
    setWorkouts((prev) => [newWorkout, ...prev]);
  };

  const updateWorkout = (id, updatedData) => {
    setWorkouts(prev => prev.map(w => w.id == id ? { ...w, ...updatedData } : w));
  };

  const deleteWorkout = (id) => {
    setWorkouts((prev) => prev.filter((w) => w.id !== id));
  };

  const clearWorkouts = () => {
    setWorkouts([]);
    localStorage.removeItem('workouts');
  };

  const getWorkoutById = (id) => {
    return workouts.find(w => w.id == id);
  };

  const getExerciseHistory = (exerciseName) => {
    const history = [];
    workouts.forEach(w => {
      w.exercises?.forEach(ex => {
        if (ex.name.toLowerCase() === exerciseName.toLowerCase()) {
          history.push({ date: w.date, ...ex });
        }
      });
    });
    return history.sort((a, b) => new Date(b.date) - new Date(a.date));
  };

  const getRecentAverageVolume = (weeks = 3) => {
    if (workouts.length === 0) return 0;
    const sortedWorkouts = [...workouts].sort((a, b) => new Date(b.date) - new Date(a.date));
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - (weeks * 7));
    const recentWorkouts = sortedWorkouts.filter(w => new Date(w.date) >= cutoffDate);
    if (recentWorkouts.length === 0) return 0;
    const totalVolume = recentWorkouts.reduce((acc, w) => {
      const sessionVol = w.exercises?.reduce((v, ex) => v + (ex.vtt || 0), 0) || 0;
      return acc + sessionVol;
    }, 0);
    return totalVolume / recentWorkouts.length;
  };

  const generateFullMesocycle = (baseWorkout) => {
    const newWorkouts = [];
    const baseDate = new Date(baseWorkout.date);
    const meso = baseWorkout.meta?.mesocycle || 1;

    for (let i = 1; i <= 3; i++) {
      const nextWeek = (baseWorkout.meta?.week || 1) + i;
      if (nextWeek > 4) break;

      const clonedExercises = baseWorkout.exercises.map(ex => ({
        ...ex,
        id: Date.now() + Math.random(),
        sets: ex.sets,
        reps: '',
        load: ex.load,
        rpe: '',
        rir: '',
        vtt: 0,
        suggestProgression: false
      }));

      const nextDate = new Date(baseDate);
      nextDate.setDate(baseDate.getDate() + (i * 7));

      newWorkouts.push({
        id: crypto.randomUUID(),
        date: nextDate.toISOString(),
        status: 'planned',
        meta: {
          mesocycle: meso,
          week: nextWeek
        },
        exercises: clonedExercises
      });
    }
    setWorkouts(prev => [...newWorkouts, ...prev]);
  };

  return (
    <WorkoutContext.Provider value={{
      workouts,
      addWorkout,
      deleteWorkout,
      updateWorkout,
      getWorkoutById,
      clearWorkouts,
      generateFullMesocycle,
      getExerciseHistory,
      getRecentAverageVolume
    }}>
      {children}
    </WorkoutContext.Provider>
  );
};
