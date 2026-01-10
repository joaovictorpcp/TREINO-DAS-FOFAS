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
      console.error('Data load error', error);
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('workouts', JSON.stringify(workouts));
    } catch (error) {
      console.error('Data save error', error);
    }
  }, [workouts]);

  const addWorkout = (workout) => {
    const newWorkout = {
      id: crypto.randomUUID(), // Ensure string ID
      date: new Date().toISOString(),
      ...workout,
    };
    setWorkouts((prev) => {
      const updated = [newWorkout, ...prev];
      // Trigger PMC Recalc if needed (or just let consumer call getPMC)
      return updated;
    });
  };

  // --- PERFORMANCE LOGIC START ---

  const calculateVolumeLoad = (workout) => {
    if (!workout || !workout.exercises) return 0;
    return workout.exercises.reduce((total, ex) => {
      // Logic: sets * reps * weight
      const sets = parseInt(ex.sets) || 0;

      // Reps: Handle ranges "8-12" -> 10
      let reps = 0;
      const repsStr = String(ex.reps);
      if (repsStr.toLowerCase().includes('falha')) {
        reps = 15; // Assumption for failure
      } else if (repsStr.includes('-')) {
        const parts = repsStr.split('-').map(p => parseInt(p.trim()));
        if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
          reps = (parts[0] + parts[1]) / 2;
        } else {
          reps = parseInt(repsStr) || 0;
        }
      } else {
        reps = parseInt(repsStr) || 0;
      }

      // Weight: Handle 0/NaN (Bodyweight)
      let weight = parseFloat(ex.load) || 0;
      if (weight === 0) {
        // Fallback logic for volume load only
        weight = 20;
      }

      const exerciseLoad = sets * reps * weight;
      return total + exerciseLoad;
    }, 0);
  };

  /**
   * Foster Method Calculation (RPE * Duration)
   * This is the TRUTH for the PMC Chart.
   */
  const calculateNormalizedLoad = (workout) => {
    // Scenario A: Explicit Data
    if (workout.normalized_load) return workout.normalized_load;

    // Check if we have fields to calc it on the fly
    const rpe = parseFloat(workout.session_rpe);
    const duration = parseFloat(workout.duration_minutes);

    if (!isNaN(rpe) && !isNaN(duration) && rpe > 0 && duration > 0) {
      return rpe * duration;
    }

    // Scenario B: Fallback / Estimation
    if (!workout.exercises || workout.exercises.length === 0) return 0;

    // 1. Estimate Duration: Sets * 3 mins
    const totalSets = workout.exercises.reduce((acc, ex) => acc + (parseInt(ex.sets) || 0), 0);
    const estimatedDuration = totalSets * 3;

    // 2. Estimate RPE: Avg of exercises or 6
    let rpeSum = 0;
    let rpeCount = 0;
    workout.exercises.forEach(ex => {
      const val = parseFloat(ex.rpe);
      if (!isNaN(val) && val > 0) {
        rpeSum += val;
        rpeCount++;
      }
    });

    const estimatedRpe = rpeCount > 0 ? (rpeSum / rpeCount) : 6;

    return Math.round(estimatedDuration * estimatedRpe);
  };

  // PMC Algorithm: ATL (7d), CTL (42d), TSB (CTL - ATL)
  // We need to process workouts chronologically.
  const getPMCData = (studentId) => {
    if (!studentId) return [];

    // 1. Filter & Sort Workouts for Student
    // 1. Filter & Sort Workouts for Student
    const studentWorkouts = workouts
      .filter(w => {
        const s = (w.status || '').toLowerCase();
        const match = s === 'completed' || s === 'done' || s === 'finished' || w.isCompleted === true;
        return w.studentId === studentId && match;
      })
      .sort((a, b) => new Date(a.date) - new Date(b.date));



    // 2. Aggregate Daily Load
    // We need a continuous timeline. If no workout, load is 0.
    // Let's find start and end date.
    if (studentWorkouts.length === 0) return [];

    const startDate = new Date(studentWorkouts[0].date);
    const today = new Date();
    const timeline = [];

    // Create map of date -> normalized load
    const loadMap = {};
    studentWorkouts.forEach(w => {
      const dKey = new Date(w.date).toISOString().split('T')[0];
      const load = calculateNormalizedLoad(w);

      // Sum load if multiple workouts in one day
      loadMap[dKey] = (loadMap[dKey] || 0) + load;
    });

    // 3. Calculate EMA (Exponential Moving Average)
    // Formula: EMA_today = (Load_today * k) + (EMA_yesterday * (1-k))
    // k = 2 / (N + 1)
    const k_atl = 2 / (7 + 1);
    const k_ctl = 2 / (42 + 1);

    let currentATL = 0;
    let currentCTL = 0;

    // Determine strict range
    const lastWorkoutDate = new Date(studentWorkouts[studentWorkouts.length - 1].date);
    const endDate = new Date(Math.max(today.getTime(), lastWorkoutDate.getTime()));

    // Iterate day by day from first workout to end of range (future included)
    const iterDate = new Date(startDate);

    // Safety break
    let limit = 0;
    while (iterDate <= endDate && limit < 10000) {
      const dKey = iterDate.toISOString().split('T')[0];
      const dailyLoad = loadMap[dKey] || 0;

      // Handle initialization to avoid slow ramp up?
      if (limit === 0 && dailyLoad > 0) {
        currentATL = dailyLoad;
        currentCTL = dailyLoad;
      } else {
        currentATL = (dailyLoad * k_atl) + (currentATL * (1 - k_atl));
        currentCTL = (dailyLoad * k_ctl) + (currentCTL * (1 - k_ctl));
      }

      const tsb = currentCTL - currentATL; // Form

      timeline.push({
        date: dKey,
        load: dailyLoad,
        fitness: Math.round(currentCTL), // CTL
        fatigue: Math.round(currentATL), // ATL
        form: Math.round(tsb)            // TSB
      });

      // Next Day
      iterDate.setDate(iterDate.getDate() + 1);
      limit++;
    }

    return timeline;
  };

  // --- PERFORMANCE LOGIC END ---

  const bulkAddWorkouts = (newWorkouts) => {
    setWorkouts(prev => {
      const updated = [...prev, ...newWorkouts];
      try {
        localStorage.setItem('workouts', JSON.stringify(updated));
      } catch (e) {
        console.error("Failed to bulk save workouts", e);
      }
      return updated;
    });
  };

  const updateWorkout = (id, updatedData) => {
    setWorkouts(prev => prev.map(w => w.id == id ? { ...w, ...updatedData } : w));
  };

  const deleteWorkout = (id) => {
    setWorkouts((prev) => prev.filter((w) => w.id !== id));
  };

  const clearWorkouts = (studentId = null) => {
    if (studentId) {
      setWorkouts((prev) => prev.filter((w) => w.studentId !== studentId));
    } else {
      setWorkouts([]);
      localStorage.removeItem('workouts');
    }
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
        reps: ex.reps, // Keep Reps
        load: ex.load, // Keep Load
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
          // Keep load and reps from source (ex)
          load: ex.load,
          reps: ex.reps,
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

    // Fix: Parse YYYY-MM-DD manually to create a Local Date at midnight
    // new Date('2025-01-05') creates UTC midnight, which shows as previous day 21:00 in UTC-3
    const [y, m, d] = startDate.split('-').map(Number);
    const startObj = new Date(y, m - 1, d); // Local Midnight

    if (isNaN(startObj.getTime())) {
      console.error("Invalid start date provided:", startDate);
      throw new Error("Data de início inválida.");
    }

    for (let w = 1; w <= weeks; w++) {
      // Calculate start of this week
      // Week 1 starts on startDate. Week 2 on startDate + 7 days, etc.
      const weekStart = new Date(startObj);
      weekStart.setDate(startObj.getDate() + (w - 1) * 7);

      baseWorkouts.forEach((base, index) => {
        // Determine targets: either explicit multiple days, explicit single day, or fallback
        let targetDays = [];

        if (base.scheduledDays && base.scheduledDays.length > 0) {
          targetDays = base.scheduledDays.map(d => parseInt(d));
        } else if (base.scheduledDay !== undefined && base.scheduledDay !== '' && base.scheduledDay !== null) {
          targetDays = [parseInt(base.scheduledDay)];
        }

        // Helper to create workout for a specific date
        const createWorkoutForDate = (dateObj) => {
          const exercises = base.exercises.map(ex => ({
            id: crypto.randomUUID(),
            name: ex.name,
            sets: ex.sets,
            reps: ex.reps || '',
            load: ex.load || '',
            rpe: '',  // Empty
            rir: '',  // Empty
            vtt: 0,
            suggestProgression: false,
            supersetId: ex.supersetId // Preserve Superset Link
          }));

          newWorkouts.push({
            id: crypto.randomUUID(),
            studentId,
            date: dateObj.toISOString(),
            status: 'planned',
            category: base.name, // 'Treino A', 'Treino B'
            scheduledDay: dateObj.getDay(), // Persist actual day

            activity_type: programData.activityType || 'weightlifting',
            duration_minutes: base.duration_minutes,
            distance_km: base.distance_km,
            session_rpe: base.session_rpe,
            drills_description: base.drills_description,
            main_set_description: base.main_set_description,

            meta: {
              mesocycle: nextMesoNum,
              week: w,
              programName: name
            },
            exercises
          });
        };

        if (targetDays.length > 0) {
          // Loop through each target day and create a workout
          targetDays.forEach(targetDay => { // 0-6
            let workoutDate = new Date(weekStart);
            const currentDay = workoutDate.getDay();
            let diff = targetDay - currentDay;
            if (diff < 0) diff += 7; // Ensure future or today
            workoutDate.setDate(workoutDate.getDate() + diff);
            createWorkoutForDate(workoutDate);
          });
        } else {
          // Fallback: Simple spacing logic: 0, 2, 4... if no day selected
          let workoutDate = new Date(weekStart);
          const offset = (index * 2) % 7;
          workoutDate.setDate(weekStart.getDate() + offset);
          createWorkoutForDate(workoutDate);
        }
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

  const duplicateMesocycleToNext = (studentId, sourceMeso) => {
    // 1. Get Source Workouts
    const sourceWorkouts = workouts.filter(w =>
      w.studentId === studentId &&
      (w.meta?.mesocycle || 1) === sourceMeso
    );

    if (sourceWorkouts.length === 0) {
      alert("Nenhum treino encontrado neste mesociclo.");
      return;
    }

    // 2. New Meso Number
    const latestMeso = workouts.filter(w => w.studentId === studentId).length > 0
      ? Math.max(...workouts.filter(w => w.studentId === studentId).map(w => w.meta?.mesocycle || 0))
      : 0;
    const newMesoNum = latestMeso + 1;

    // 3. Clone Logic (Assuming 4 weeks duration for previous, simply add 4 weeks to date)
    // Or simpler: Just create "Plan" for next meso, keeping relative days same but 4 weeks later.
    const newWorkouts = sourceWorkouts.map(source => {
      const sourceDate = new Date(source.date);
      const newDate = new Date(sourceDate);
      newDate.setDate(sourceDate.getDate() + 28); // +4 Weeks

      // Clone Exercises (Reset data)
      const clonedExercises = source.exercises.map(ex => ({
        ...ex,
        id: crypto.randomUUID(),
        load: ex.load, // Keep Load
        reps: ex.reps, // Keep Reps
        rpe: '',
        rir: '',
        vtt: 0,
        suggestProgression: false
      }));

      return {
        ...source,
        id: crypto.randomUUID(),
        date: newDate.toISOString(),
        status: 'planned',
        meta: {
          ...source.meta,
          mesocycle: newMesoNum
        },
        exercises: clonedExercises
      };
    });

    setWorkouts(prev => [...newWorkouts, ...prev]);
    alert(`Mesociclo #${newMesoNum} criado com sucesso! (${newWorkouts.length} treinos duplicados).`);
    return newMesoNum;
  };

  return (
    <WorkoutContext.Provider value={{
      workouts,
      addWorkout,
      bulkAddWorkouts,
      deleteWorkout,
      updateWorkout,
      getWorkoutById,
      clearWorkouts,
      generateFullMesocycle,
      mirrorWeekToMonth,
      createMesocycle,
      getExerciseHistory,
      getRecentAverageVolume,
      getPMCData,
      importMesocycle,
      duplicateMesocycleToNext
    }}>
      {children}
    </WorkoutContext.Provider>
  );
};
