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
      const parsed = saved ? JSON.parse(saved) : [];
      return Array.isArray(parsed) ? parsed : [];
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

  const mirrorWeekToMonth = (studentId, mesocycle) => {
    // 1. Get Week 1 Workouts for this Student & Mesocycle
    const week1Workouts = workouts.filter(w =>
      w.studentId === studentId &&
      (w.meta?.mesocycle || 1) === mesocycle &&
      (w.meta?.week || 1) === 1
    );

    if (week1Workouts.length === 0) {
      alert("Nenhum treino encontrado na Semana 1 para espelhar.");
      return;
    }

    const newWorkouts = [];

    // 2. Generate Weeks 2, 3, 4
    for (let w = 2; w <= 4; w++) {
      const weekOffsetDays = (w - 1) * 7;

      week1Workouts.forEach(baseWorkout => {
        const baseDate = new Date(baseWorkout.date);
        const nextDate = new Date(baseDate);
        nextDate.setDate(baseDate.getDate() + weekOffsetDays);

        // Clone Exercises (Reset performance data)
        const clonedExercises = baseWorkout.exercises.map(ex => ({
          ...ex,
          id: Date.now() + Math.random(), // Unique ID
          load: '', // Reset Load
          rpe: '',  // Reset RPE
          rir: '',  // Reset RIR
          vtt: 0,   // Reset Volume
          suggestProgression: false
        }));

        newWorkouts.push({
          id: crypto.randomUUID(),
          date: nextDate.toISOString(),
          status: 'planned',
          category: baseWorkout.category,
          studentId: baseWorkout.studentId,
          meta: {
            mesocycle: mesocycle,
            week: w
          },
          exercises: clonedExercises
        });
      });
    }

    setWorkouts(prev => [...newWorkouts, ...prev]);
    alert(`Sucesso! Espelho realizado. ${newWorkouts.length} novos treinos criados para as semanas 2, 3 e 4.`);
  };

  const createMesocycle = (programData) => {
    const { name, weeks, baseWorkouts, studentId, startDate } = programData;
    const newWorkouts = [];
    const mesoId = crypto.randomUUID(); // Unique ID for this specific mesocycle run (optional usage)
    // We can use a timestamp or increment for the 'mesocycle' number, but let's stick to the user's input or auto-detect
    // For now, let's find the max mesocycle and increment
    const latestMeso = workouts.filter(w => w.studentId === studentId).length > 0
      ? Math.max(...workouts.filter(w => w.studentId === studentId).map(w => w.meta?.mesocycle || 0))
      : 0;
    const nextMesoNum = latestMeso + 1;

    const startObj = new Date(startDate);

    for (let w = 1; w <= weeks; w++) {
      // Calculate start of this week
      // Week 1 starts on startDate. Week 2 on startDate + 7 days, etc.
      const weekStart = new Date(startObj);
      weekStart.setDate(startObj.getDate() + (w - 1) * 7);

      // Iterate over base workouts (A, B, C...)
      // We need to spread them out. 
      // Strategy: Just create them with the same date (Monday of that week) or spread them?
      // User didn't specify spreading logic, but standard is usually Mon/Wed/Fri or just "Day 1, Day 2".
      // Let's assume user will manage exact dates later, or we default them to:
      // Workout 1: +0 days, Workout 2: +2 days, Workout 3: +4 days (Mon/Wed/Fri style)

      baseWorkouts.forEach((base, index) => {
        const workoutDate = new Date(weekStart);
        // Simple spacing logic: 0, 2, 4, 1, 3, 5...
        const offset = (index * 2) % 7;
        workoutDate.setDate(weekStart.getDate() + offset);

        const exercises = base.exercises.map(ex => ({
          id: crypto.randomUUID(),
          name: ex.name,
          sets: ex.sets,
          reps: ex.reps,
          load: '', // Empty
          rpe: '',  // Empty
          rir: '',  // Empty
          vtt: 0,
          suggestProgression: false
        }));

        newWorkouts.push({
          id: crypto.randomUUID(),
          studentId,
          date: workoutDate.toISOString(),
          status: 'planned',
          category: base.name, // 'Treino A', 'Treino B'
          meta: {
            mesocycle: nextMesoNum,
            week: w,
            programName: name
          },
          exercises
        });
      });
    }

    setWorkouts(prev => [...newWorkouts, ...prev]);
    return nextMesoNum;
  };

  const importMesocycle = (fromStudentId, toStudentId, mesocycleNumber) => {
    // 1. Get Source Workouts
    const sourceWorkouts = workouts.filter(w =>
      w.studentId === fromStudentId &&
      (w.meta?.mesocycle || 1) === mesocycleNumber
    ).sort((a, b) => new Date(a.date) - new Date(b.date));

    if (sourceWorkouts.length === 0) {
      throw new Error("Nenhum treino encontrado para importar.");
    }

    // 2. Determine Next Mesocycle Number for Target Student
    const targetStudentWorkouts = workouts.filter(w => w.studentId === toStudentId);
    const latestMeso = targetStudentWorkouts.length > 0
      ? Math.max(...targetStudentWorkouts.map(w => w.meta?.mesocycle || 0))
      : 0;
    const newMesoNum = latestMeso + 1;

    // 3. Calculate Date Offset (Start 'Today')
    const today = new Date();
    const sourceStartDate = new Date(sourceWorkouts[0].date);

    // Normalize time components to avoid partial day shifts if desired, 
    // or just calculate raw diff. Let's act like "First workout is today".
    const timeDiff = today.getTime() - sourceStartDate.getTime();

    // 4. Clone Workouts
    const newWorkouts = sourceWorkouts.map(source => {
      const newDate = new Date(new Date(source.date).getTime() + timeDiff);

      const clonedExercises = source.exercises.map(ex => ({
        ...ex,
        id: crypto.randomUUID(),
        load: '', // Reset
        rpe: '',
        rir: '',
        vtt: 0,
        suggestProgression: false
      }));

      return {
        ...source,
        id: crypto.randomUUID(),
        studentId: toStudentId,
        date: newDate.toISOString(),
        status: 'planned',
        meta: {
          ...source.meta,
          mesocycle: newMesoNum, // Assign new incremental meso number
        },
        exercises: clonedExercises
      };
    });

    setWorkouts(prev => [...newWorkouts, ...prev]);
    return newWorkouts.length;
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
      mirrorWeekToMonth,
      createMesocycle,
      getExerciseHistory,
      getRecentAverageVolume,
      importMesocycle
    }}>
      {children}
    </WorkoutContext.Provider>
  );
};
