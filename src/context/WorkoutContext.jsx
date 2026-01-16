import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../services/supabase';
import { useAuth } from './AuthContext';

/* eslint-disable react-refresh/only-export-components */

const WorkoutContext = createContext();

export const useWorkout = () => {
  const context = useContext(WorkoutContext);
  if (!context) {
    throw new Error('useWorkout must be used within a WorkoutProvider');
  }
  return context;
};

export const WorkoutProvider = ({ children }) => {
  const { session } = useAuth();
  const [workouts, setWorkouts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (session?.user) {
      fetchWorkouts();
    } else {
      setWorkouts([]);
    }
  }, [session]);

  const fetchWorkouts = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from('workouts')
        .select('*')
        .order('date', { ascending: false }); // Latest first

      if (error) {
        console.error('[WorkoutContext] Supabase Error:', error);
        throw error;
      };

      // Map DB columns to App state (student_id -> studentId)
      const mapped = (data || []).map(w => ({
        ...w,
        studentId: w.student_id // critical for filtering
      }));
      setWorkouts(mapped);
    } catch (error) {
      console.error('Error fetching workouts:', error);
      setError(error.message || 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const addWorkout = async (workout) => {
    if (!session?.user) return;

    // Ensure we have a studentId!
    if (!workout.studentId) {
      console.error("Cannot add workout without studentId");
      return;
    }

    const newWorkout = {
      user_id: session.user.id,
      student_id: workout.studentId, // Map to column name
      date: workout.date || new Date().toISOString(),
      status: workout.status || 'planned',
      exercises: workout.exercises || [],
      meta: workout.meta || {},

      ...workout, // catch-all

      // Overwrite/Sanitize numerics
      duration_minutes: workout.duration_minutes === "" ? null : workout.duration_minutes,
      distance_km: workout.distance_km === "" ? null : workout.distance_km,
      session_rpe: workout.session_rpe === "" ? null : workout.session_rpe,
      volume_load_kg: workout.volume_load_kg === "" ? null : workout.volume_load_kg,
      normalized_load: workout.normalized_load === "" ? null : workout.normalized_load,
    };

    // Remove client-side only fields that might conflict or aren't columns
    delete newWorkout.id; // DB generates ID usually, but we can pass it if we want. Schema uses gen_random_uuid()
    delete newWorkout.studentId; // Mapped to student_id

    try {
      const { data, error } = await supabase
        .from('workouts')
        .insert([newWorkout])
        .select()
        .single();

      if (error) throw error;
      setWorkouts(prev => [{ ...data, studentId: data.student_id }, ...prev]);
    } catch (error) {
      console.error('Error adding workout:', error);
    }
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

  // --- PERFORMANCE LOGIC END ---

  const bulkAddWorkouts = async (newWorkouts) => {
    if (!session?.user || newWorkouts.length === 0) return;

    const formattedWorkouts = newWorkouts.map(w => ({
      user_id: session.user.id,
      student_id: w.studentId,
      date: w.date,
      status: w.status,
      exercises: w.exercises,
      meta: w.meta,
      // Add other fields if necessary
    }));

    try {
      const { data, error } = await supabase
        .from('workouts')
        .insert(formattedWorkouts)
        .select();

      if (error) throw error;
      setWorkouts(prev => [...data, ...prev]);
      return data;
    } catch (error) {
      console.error('Error bulk adding workouts:', error);
    }
  };

  const updateWorkout = async (id, updatedData) => {
    try {
      // Map studentId to student_id if present
      const dbData = { ...updatedData };

      // Sanitize standard numeric fields (convert "" to null)
      ['duration_minutes', 'distance_km', 'session_rpe', 'volume_load_kg', 'normalized_load'].forEach(field => {
        if (dbData[field] === "") dbData[field] = null;
      });

      if (dbData.studentId) {
        dbData.student_id = dbData.studentId;
        delete dbData.studentId;
      }

      // Auto-fill student_id from existing state if missing (Common in partial updates like Drag & Drop)
      if (!dbData.student_id) {
        const existing = workouts.find(w => w.id === id);
        if (existing) {
          dbData.student_id = existing.studentId || existing.student_id;
          // We might also want to fill other non-nullable fields if this is strictly an upsert that acts like insert
          // But for now, student_id is the one causing the specific error.
        }
      }

      // CRITICAL FIX: Ensure student_id is NEVER null for upserts that might act as inserts
      if (!dbData.student_id) {
        console.error("Attempting to save workout without student_id! This will cause RLS issues or missing data.");
        // Try to recover from context if available? 
        // Since we are inside generic context, we might not have 'selectedStudentId' easily accessible without importing 'useStudent' inside 'useWorkout'?
        // Actually, 'WorkoutProvider' does NOT consume 'StudentContext'. 
        // So we must rely on the caller passing it.
        throw new Error("Erro Crítico: ID do Aluno não fornecido ao salvar treino. (student_id missing)");
      }

      // Ensure ID is part of the payload for upsert
      dbData.id = id;

      // Remove any undefined/null fields if they might cause issues, 
      // but upsert usually handles them. 
      // Ideally we ensure user_id is present if it's an insert? 
      // But for update existing logic, it might not fail if RLS forces it?
      // Actually, for upsert to work as INSERT, we MUST provide user_id if it's not default.
      if (!dbData.user_id && session?.user?.id) {
        dbData.user_id = session.user.id;
      }

      // Use UPSERT instead of UPDATE
      const { data, error } = await supabase
        .from('workouts')
        .upsert(dbData) // Upsert handles both insert and update based on PK (id)
        .select()
        .single();

      if (error) throw error;

      // FIX: Ensure studentId is properly mapped back for local state!
      // We also need to handle the case where we are 'adding' via this function now (if ID didn't exist)
      // So we check if it exists in state to update, or add it.
      setWorkouts(prev => {
        const exists = prev.find(w => w.id === id);
        if (exists) {
          return prev.map(w => w.id === id ? { ...data, studentId: data.student_id } : w);
        } else {
          return [{ ...data, studentId: data.student_id }, ...prev];
        }
      });
    } catch (error) {
      console.error('Error updating/upserting workout:', error);
      alert('Erro ao salvar (Upsert): ' + (error.message || JSON.stringify(error)));
    }
  };

  const deleteWorkout = async (id) => {
    try {
      const { error } = await supabase
        .from('workouts')
        .delete()
        .eq('id', id);

      if (error) throw error;
      setWorkouts(prev => prev.filter(w => w.id !== id));
    } catch (error) {
      console.error('Error deleting workout:', error);
    }
  };

  const clearWorkouts = async (studentId = null) => {
    try {
      let query = supabase.from('workouts').delete();

      if (studentId) {
        query = query.eq('student_id', studentId);
      } else {
        // Safety: without studentId, this deletes ALL workouts for the user (due to RLS)
        // Maybe this is intended for "Clear All Data" button
        query = query.neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all
      }

      const { error } = await query;
      if (error) throw error;

      if (studentId) {
        setWorkouts(prev => prev.filter(w => w.studentId !== studentId)); // studentId is cleaner in frontend
        // Note: DB returns student_id, but we need to check how we stored it in state.
        // fetch returns object with keys as column names (student_id).
        // So we should filter by student_id or map it.
        // Let's assume state has snake_case keys now? Yes, data from fetch has snake_case.
        setWorkouts(prev => prev.filter(w => w.student_id !== studentId));
      } else {
        setWorkouts([]);
      }
    } catch (error) {
      console.error('Error clearing workouts:', error);
    }
  };

  const bulkDeleteWorkouts = async (ids) => {
    if (!ids || ids.length === 0) return;
    try {
      const { error } = await supabase
        .from('workouts')
        .delete()
        .in('id', ids);

      if (error) throw error;
      setWorkouts(prev => prev.filter(w => !ids.includes(w.id)));
    } catch (error) {
      console.error('Error bulk deleting:', error);
      alert('Erro ao excluir treinos em massa.');
    }
  };

  const bulkDuplicateWorkouts = async (ids, targetDateStr = null) => {
    if (!ids || ids.length === 0) return;
    try {
      const selectedWorkouts = workouts.filter(w => ids.includes(w.id));
      const newWorkouts = selectedWorkouts.map(w => {
        let newDate;
        if (targetDateStr) {
          // Fix: Parse YYYY-MM-DD manually to create a Local Date at midnight
          const [y, m, d] = targetDateStr.split('-').map(Number);
          newDate = new Date(y, m - 1, d);
        } else {
          newDate = new Date(w.date);
        }

        // If creating on same day, ensure unique ID (Supabase does this)
        // Clean ID and timestamps
        const { id, created_at, ...rest } = w;

        return {
          ...rest,
          // If we have local studentId, map to student_id for DB
          student_id: w.studentId || w.student_id,
          date: newDate.toISOString(),
          status: 'planned', // Reset status for duplicate? Usually yes.
          exercises: w.exercises.map(ex => ({
            ...ex,
            id: crypto.randomUUID(),
            // Reset performance data for duplication?
            // "Na aba treinos, tenho o calendario e a aba LISTA. No formato lista, que eu possa selecionar os treinos para duplicar e ou apagar."
            // Usually duplication is for Planning.
            rpe: '',
            rir: '',
            vtt: 0,
            suggestProgression: false
          }))
        };
      });

      const { data, error } = await supabase
        .from('workouts')
        .insert(newWorkouts)
        .select();

      if (error) throw error;

      const mappedData = data.map(w => ({
        ...w,
        studentId: w.student_id
      }));

      setWorkouts(prev => [...mappedData, ...prev]);
      return mappedData;
    } catch (error) {
      console.error('Error bulk duplicating:', error);
      alert('Erro ao duplicar treinos.');
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

  const generateFullMesocycle = async (baseWorkout) => {
    // 1. Check Auth
    if (!session?.user) return;

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
        // id: crypto.randomUUID(), // Let DB generate
        user_id: session.user.id,
        student_id: baseWorkout.studentId, // Ensure we use correct ID
        date: nextDate.toISOString(),
        status: 'planned',
        meta: {
          mesocycle: meso,
          week: nextWeek
        },
        exercises: clonedExercises
      });
    }

    // 2. Insert to DB
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('workouts')
        .insert(newWorkouts)
        .select();

      if (error) throw error;

      // 3. Update State
      const mappedData = data.map(w => ({
        ...w,
        studentId: w.student_id
      }));

      setWorkouts(prev => [...mappedData, ...prev]);
    } catch (err) {
      console.error("Error auto-generating mesocycle:", err);
    } finally {
      setLoading(false);
    }
  };

  const mirrorWeekToMonth = async (studentId, mesocycle) => {
    if (!session?.user) return;

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
          // id: crypto.randomUUID(), // Let DB generate
          user_id: session.user.id,
          student_id: baseWorkout.studentId,
          date: nextDate.toISOString(),
          status: 'planned',
          // category removed from root

          meta: {
            mesocycle: mesocycle,
            week: w,
            category: baseWorkout.meta?.category || baseWorkout.category // Fallback or read from meta
          },
          exercises: clonedExercises
        });
      });
    }

    // 3. Insert to DB
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('workouts')
        .insert(newWorkouts)
        .select();

      if (error) throw error;

      // 4. Update State
      const mappedData = data.map(w => ({
        ...w,
        studentId: w.student_id
      }));

      setWorkouts(prev => [...mappedData, ...prev]);
      alert(`Sucesso! Espelho realizado. ${mappedData.length} novos treinos criados e salvos no banco.`);
    } catch (err) {
      console.error("Error mirroring mesocycle:", err);
      alert("Erro ao espelhar mesociclo: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const createMesocycle = async (programData) => {
    const { name, weeks, baseWorkouts, studentId, startDate } = programData;
    const newWorkouts = [];

    // Ensure we have a valid session user
    if (!session?.user) {
      alert("Erro: Você precisa estar logado para criar um mesociclo.");
      return;
    }

    // const mesoId = crypto.randomUUID(); // Unique ID for this specific mesocycle run (optional)
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
            // Let database generate ID? No, we need it for state maybe. 
            // Currently schema allows gen_random_uuid().
            // But we can generate it here.
            // id: crypto.randomUUID(), // Removed to let Supabase generate (or keep if desired, but let's be consistent)
            // UPDATE: User requested "id" field in upsert/insert. 
            // It's safer to generate UUID here only if we need to reference it immediately, 
            // but bulk insert returns the Created objects with IDs anyway.
            // Let's generate it to be explicit.
            // id: crypto.randomUUID(), // Let's try omitting it and using the returned data.

            // user_id and student_id are top level
            user_id: session.user.id,
            student_id: studentId,
            date: dateObj.toISOString(),
            status: 'planned',

            activity_type: programData.activityType || 'weightlifting',
            duration_minutes: base.duration_minutes === "" ? null : base.duration_minutes,
            distance_km: base.distance_km === "" ? null : base.distance_km,
            session_rpe: base.session_rpe === "" ? null : base.session_rpe,
            drills_description: base.drills_description,
            main_set_description: base.main_set_description,

            meta: {
              mesocycle: nextMesoNum,
              week: w,
              programName: name,
              category: base.name, // Moved to meta
              scheduledDay: dateObj.getDay() // Moved to meta
            },
            exercises: exercises
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

    // --- BULK INSERT TO DB ---
    try {
      setLoading(true);
      console.log(`[createMesocycle] Bulk inserting ${newWorkouts.length} workouts...`);
      const { data, error } = await supabase
        .from('workouts')
        .insert(newWorkouts)
        .select();

      if (error) throw error;

      // Update Local State with the REAL data from DB (includes IDs)
      // Map data to match local state structure (student_id -> studentId)
      const mappedData = data.map(w => ({
        ...w,
        studentId: w.student_id
      }));

      setWorkouts(prev => [...mappedData, ...prev]);
      console.log(`[createMesocycle] Success! Added ${mappedData.length} workouts.`);

      return nextMesoNum;
    } catch (err) {
      console.error("Error batch inserting mesocycle:", err);
      alert("Erro ao criar o mesociclo no banco de dados: " + err.message);
      throw err; // Propagate to component to stop loading spinners if any
    } finally {
      setLoading(false);
    }
  };

  const importMesocycle = async (fromStudentId, toStudentId, mesocycleNumber, keepData = false) => {
    if (!session?.user) return;

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
        load: ex.load, // Always keep load (Plan)
        reps: ex.reps, // Always keep reps (Plan)
        rpe: keepData ? ex.rpe : '',
        rir: keepData ? ex.rir : '',
        vtt: keepData ? (ex.vtt || 0) : 0,
        suggestProgression: false
      }));

      return {
        // id: crypto.randomUUID(), // Let DB generate
        user_id: session.user.id,
        student_id: toStudentId,
        date: newDate.toISOString(),
        // If we want it to count for graph, status might need to be 'completed' if source was completed?
        status: keepData ? source.status : 'planned',

        // Attributes
        activity_type: source.activity_type || 'weightlifting',
        duration_minutes: keepData ? source.duration_minutes : null,
        distance_km: keepData ? source.distance_km : null,
        session_rpe: keepData ? source.session_rpe : null,
        normalized_load: keepData ? source.normalized_load : null,
        drills_description: source.drills_description || null,
        main_set_description: source.main_set_description || null,

        // category removed

        meta: {
          ...source.meta,
          mesocycle: newMesoNum,
          category: source.meta?.category || source.category
        },
        exercises: clonedExercises
      };
    });

    // 5. Insert to DB
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('workouts')
        .insert(newWorkouts)
        .select();

      if (error) throw error;

      // 6. Update State
      const mappedData = data.map(w => ({
        ...w,
        studentId: w.student_id
      }));

      setWorkouts(prev => [...mappedData, ...prev]);
      return mappedData.length;
    } catch (err) {
      console.error("Error importing mesocycle:", err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const duplicateMesocycleToNext = async (studentId, sourceMeso) => {
    if (!session?.user) return;

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
        // id: crypto.randomUUID(), // Let DB generate
        user_id: session.user.id,
        student_id: studentId,
        date: newDate.toISOString(),
        status: 'planned',

        // category removed

        meta: {
          ...source.meta,
          mesocycle: newMesoNum,
          category: source.meta?.category || source.category
        },
        exercises: clonedExercises
      };
    });

    // 4. Insert to DB
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('workouts')
        .insert(newWorkouts)
        .select();

      if (error) throw error;

      // 5. Update State
      const mappedData = data.map(w => ({
        ...w,
        studentId: w.student_id
      }));

      setWorkouts(prev => [...mappedData, ...prev]);
      alert(`Mesociclo #${newMesoNum} criado com sucesso! (${mappedData.length} treinos duplicados).`);
      return newMesoNum;
    } catch (err) {
      console.error("Error duplicating mesocycle:", err);
      alert("Erro ao duplicar mesociclo: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <WorkoutContext.Provider value={{
      workouts,
      loading,
      error,
      addWorkout,
      bulkAddWorkouts,
      deleteWorkout,
      updateWorkout,
      getWorkoutById,
      clearWorkouts,
      calculateVolumeLoad, // Exposed now
      generateFullMesocycle,
      mirrorWeekToMonth,
      createMesocycle,
      getExerciseHistory,
      getRecentAverageVolume,
      getPMCData,
      getPMCData,
      importMesocycle,
      duplicateMesocycleToNext,
      bulkDeleteWorkouts,
      bulkDuplicateWorkouts
    }}>
      {children}
    </WorkoutContext.Provider>
  );
};
