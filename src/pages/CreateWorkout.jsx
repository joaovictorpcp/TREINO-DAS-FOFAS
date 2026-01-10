import React, { useState, useEffect } from 'react';
import { useWorkout } from '../context/WorkoutContext';
import { useNavigate, useParams } from 'react-router-dom';
import { Plus, Trash2, Save, AlertTriangle, BookOpen, HelpCircle, Layers, Link as LinkIcon, Activity, Dumbbell, Bike, Footprints, Waves } from 'lucide-react';
import clsx from 'clsx';
import Tooltip from '../components/ui/Tooltip';
import Modal from '../components/ui/Modal';
import styles from './CreateWorkout.module.css';

import { useStudent } from '../context/StudentContext';

const TrainingLog = () => {
    const navigate = useNavigate();
    const { id } = useParams(); // Get ID from URL if editing
    const { addWorkout, updateWorkout, getWorkoutById, generateFullMesocycle } = useWorkout();
    const { selectedStudentId } = useStudent();

    // const [showSafetyToast, setShowSafetyToast] = useState(false);
    // const [isGuideOpen, setIsGuideOpen] = useState(false);

    // Edit Mode State
    const [isEditing, setIsEditing] = useState(false);

    // Cycle State
    const [mesocycle, setMesocycle] = useState(1);
    const [week, setWeek] = useState(1);
    const [autoGenerate, setAutoGenerate] = useState(false);
    const [workoutDate, setWorkoutDate] = useState(() => {
        const d = new Date();
        return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
    }); // Default to today Local YYYY-MM-DD
    const [category, setCategory] = useState('A'); // Default Category A
    const [observations, setObservations] = useState('');
    const [sessionRpe, setSessionRpe] = useState('');
    const [durationMinutes, setDurationMinutes] = useState('');

    const [exercises, setExercises] = useState([
        { id: Date.now(), name: '', sets: '', reps: '', load: '', rpe: '', rir: '', suggestProgression: false }
    ]);

    // Activity State
    const [activityType, setActivityType] = useState('weightlifting'); // 'weightlifting', 'running', 'cycling', 'swimming'

    // Cardio Specific Fields
    const [distance, setDistance] = useState('');
    const [avgHr, setAvgHr] = useState('');
    const [avgWatts, setAvgWatts] = useState('');
    const [avgPace, setAvgPace] = useState('');
    const [elevation, setElevation] = useState('');

    // Load Data if Editing
    useEffect(() => {
        if (id) {
            console.log('CreateWorkout - Loading ID:', id);
            const workoutToEdit = getWorkoutById(id);
            console.log('CreateWorkout - Found:', workoutToEdit);
            if (workoutToEdit) {
                setIsEditing(true);
                setMesocycle(workoutToEdit.meta?.mesocycle || 1);
                setWeek(workoutToEdit.meta?.week || 1);
                setExercises(workoutToEdit.exercises || []);
                if (workoutToEdit.date) {
                    const d = new Date(workoutToEdit.date);
                    const localDateStr = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
                    setWorkoutDate(localDateStr);
                }
                setCategory(workoutToEdit.category || 'A');
                setObservations(workoutToEdit.observations || '');
                setSessionRpe(workoutToEdit.session_rpe || '');
                setDurationMinutes(workoutToEdit.duration_minutes || '');

                // Load Activity Data
                setActivityType(workoutToEdit.activity_type || 'weightlifting');
                setDistance(workoutToEdit.distance_km || '');
                setAvgHr(workoutToEdit.average_heart_rate || '');
                setAvgWatts(workoutToEdit.average_watts || '');
                setAvgPace(workoutToEdit.average_pace || '');
                setElevation(workoutToEdit.elevation_gain || '');
            }
        }
    }, [id, getWorkoutById]);

    // --- Helpers & Handlers ---
    const calculateVTT = (sets, reps, load) => {
        const s = parseInt(sets) || 0;
        const r = parseInt(reps) || 0;
        const l = parseFloat(load) || 0;
        return s * r * l;
    };

    const isHighStress = (rpe, rir) => {
        const rpeVal = parseFloat(rpe) || 0;
        // If rir is empty string, treat as "safe"/high. If '0', it's high stress.
        const rirVal = rir === '' || rir === null ? 5 : parseFloat(rir);
        return rpeVal >= 9 || rirVal <= 1;
    };

    const updateExercise = (id, field, value) => {
        setExercises(prev => prev.map(ex => {
            if (ex.id === id) {
                return { ...ex, [field]: value };
            }
            return ex;
        }));
    };

    const addRow = () => {
        setExercises(prev => [
            ...prev,
            { id: Date.now(), name: '', sets: '', reps: '', load: '', rpe: '', rir: '', suggestProgression: false }
        ]);
    };

    const removeRow = (id) => {
        setExercises(prev => {
            if (prev.length <= 1) return prev; // Keep at least one maybe? Or allow empty. Let's allow empty but usually UI keeps one.
            return prev.filter(ex => ex.id !== id);
        });
    };

    const addSuperset = (index) => {
        setExercises(prev => {
            const newArr = [...prev];
            const parent = newArr[index];
            const ssid = parent.supersetId || crypto.randomUUID();

            // Link Parent
            newArr[index] = { ...parent, supersetId: ssid };

            // Create Child
            const child = {
                id: Date.now() + Math.random(),
                name: '',
                sets: parent.sets,
                reps: parent.reps,
                load: '',
                rpe: '',
                rir: '',
                suggestProgression: false,
                supersetId: ssid
            };

            newArr.splice(index + 1, 0, child);
            return newArr;
        });
    };

    const handleActivityChange = (type) => {
        setActivityType(type);
        if (type !== 'weightlifting' && activityType === 'weightlifting') {
            setExercises([{ id: Date.now(), name: '', sets: '', reps: '', load: '', rpe: '', rir: '', suggestProgression: false }]);
        }
    };

    // Helper to constructing Local Date correctly
    const getLocalISO = (dateStr) => {
        if (!dateStr) return new Date().toISOString();
        const [y, m, d] = dateStr.split('-').map(Number);
        const dateObj = new Date(y, m - 1, d); // Starts at 00:00 Local
        return dateObj.toISOString();
    };

    const handleSubmit = async () => {
        try {
            let normalizedLoad = 0;
            const dur = parseFloat(durationMinutes);
            const rpe = parseFloat(sessionRpe);

            if (activityType === 'weightlifting') {
                // Weightlifting Logic
                const validExercises = exercises.filter(ex => ex.name.trim() !== '');
                if (validExercises.length === 0) {
                    alert("Adicione pelo menos um exercício.");
                    return;
                }

                if (!isNaN(dur) && !isNaN(rpe)) {
                    normalizedLoad = dur * rpe;
                } else {
                    // Fallback Estimation
                    const totalSets = validExercises.reduce((acc, ex) => acc + (parseInt(ex.sets) || 0), 0);
                    const estDur = totalSets * 3;
                    let rpeSum = 0;
                    let rpeCount = 0;
                    validExercises.forEach(ex => {
                        const val = parseFloat(ex.rpe);
                        if (!isNaN(val) && val > 0) {
                            rpeSum += val;
                            rpeCount++;
                        }
                    });
                    const estRpe = rpeCount > 0 ? (rpeSum / rpeCount) : 6;
                    normalizedLoad = Math.round(estDur * estRpe);
                }

                const workoutData = {
                    id: isEditing ? id : undefined,
                    type: 'log',
                    activity_type: 'weightlifting',
                    date: getLocalISO(workoutDate),
                    status: 'completed',
                    category,
                    observations,
                    session_rpe: sessionRpe,
                    duration_minutes: durationMinutes,
                    normalized_load: normalizedLoad,
                    volume_load_kg: validExercises.reduce((acc, ex) => acc + (calculateVTT(ex.sets, ex.reps, ex.load)), 0),
                    meta: { mesocycle, week },
                    studentId: selectedStudentId ? selectedStudentId : null,
                    exercises: validExercises.map(ex => ({
                        ...ex,
                        vtt: calculateVTT(ex.sets, ex.reps, ex.load)
                    }))
                };
                saveAndRedirect(workoutData);

            } else {
                // Cardio Logic
                if (durationMinutes === '' || sessionRpe === '') {
                    alert("Duração e RPE são obrigatórios para atividades aeróbicas.");
                    return;
                }

                normalizedLoad = (parseFloat(durationMinutes) || 0) * (parseFloat(sessionRpe) || 0);

                const workoutData = {
                    id: isEditing ? id : undefined,
                    type: 'log',
                    activity_type: activityType,
                    date: getLocalISO(workoutDate),
                    status: 'completed',
                    category: category || activityType.charAt(0).toUpperCase() + activityType.slice(1),
                    observations,
                    session_rpe: sessionRpe,
                    duration_minutes: durationMinutes,
                    normalized_load: normalizedLoad,

                    // Cardio Specifics
                    distance_km: parseFloat(distance) || 0,
                    average_heart_rate: parseInt(avgHr) || 0,
                    average_watts: parseInt(avgWatts) || 0,
                    average_pace: avgPace,
                    elevation_gain: parseInt(elevation) || 0,

                    meta: { mesocycle, week },
                    studentId: selectedStudentId ? selectedStudentId : null,
                    exercises: []
                };

                console.log("Saving Cardio Workout:", workoutData);
                saveAndRedirect(workoutData);
            }
        } catch (error) {
            console.error("Error saving workout:", error);
            alert("Erro ao salvar treino: " + error.message);
        }
    };

    const saveAndRedirect = (data) => {
        if (isEditing && id) {
            updateWorkout(id, data);
        } else {
            addWorkout(data);
            if (autoGenerate && week === 1 && activityType === 'weightlifting') {
                generateFullMesocycle(data);
            }
        }
        navigate('/dashboard');
    };

    return (
        <div className={clsx("page-container animate-fade-in", isEditing && styles.editingMode)}>

            {/* MAIN ACTIVITY SELECTOR - TOP LEVEL (Controlled Visibility) */}
            {!isEditing && (
                <div style={{ marginBottom: '2rem' }}>
                    <h2 style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '12px' }}>
                        1. Escolha a Modalidade
                    </h2>
                    <div className="glass-panel" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', padding: '8px', border: '1px solid var(--border-subtle)' }}>
                        <button
                            type="button"
                            onClick={() => handleActivityChange('weightlifting')}
                            className={clsx(styles.typeBtn, activityType === 'weightlifting' && styles.activeType)}
                            style={{
                                height: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px',
                                borderRadius: '12px', border: activityType === 'weightlifting' ? '2px solid var(--accent-primary)' : '1px solid var(--border-subtle)',
                                background: activityType === 'weightlifting' ? 'rgba(74, 222, 128, 0.1)' : 'transparent'
                            }}
                        >
                            <Dumbbell size={24} color={activityType === 'weightlifting' ? 'var(--accent-primary)' : 'var(--text-muted)'} />
                            <span style={{ fontSize: '0.9rem', fontWeight: 600, color: activityType === 'weightlifting' ? 'var(--accent-primary)' : 'var(--text-secondary)' }}>Musculação</span>
                        </button>

                        <button
                            type="button"
                            onClick={() => handleActivityChange('running')}
                            className={clsx(styles.typeBtn, activityType === 'running' && styles.activeType)}
                            style={{
                                height: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px',
                                borderRadius: '12px', border: activityType === 'running' ? '2px solid var(--accent-primary)' : '1px solid var(--border-subtle)',
                                background: activityType === 'running' ? 'rgba(74, 222, 128, 0.1)' : 'transparent'
                            }}
                        >
                            <Footprints size={24} color={activityType === 'running' ? 'var(--accent-primary)' : 'var(--text-muted)'} />
                            <span style={{ fontSize: '0.9rem', fontWeight: 600, color: activityType === 'running' ? 'var(--accent-primary)' : 'var(--text-secondary)' }}>Corrida</span>
                        </button>

                        <button
                            type="button"
                            onClick={() => handleActivityChange('cycling')}
                            className={clsx(styles.typeBtn, activityType === 'cycling' && styles.activeType)}
                            style={{
                                height: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px',
                                borderRadius: '12px', border: activityType === 'cycling' ? '2px solid var(--accent-primary)' : '1px solid var(--border-subtle)',
                                background: activityType === 'cycling' ? 'rgba(74, 222, 128, 0.1)' : 'transparent'
                            }}
                        >
                            <Bike size={24} color={activityType === 'cycling' ? 'var(--accent-primary)' : 'var(--text-muted)'} />
                            <span style={{ fontSize: '0.9rem', fontWeight: 600, color: activityType === 'cycling' ? 'var(--accent-primary)' : 'var(--text-secondary)' }}>Ciclismo</span>
                        </button>

                        <button
                            type="button"
                            onClick={() => handleActivityChange('swimming')}
                            className={clsx(styles.typeBtn, activityType === 'swimming' && styles.activeType)}
                            style={{
                                height: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px',
                                borderRadius: '12px', border: activityType === 'swimming' ? '2px solid var(--accent-primary)' : '1px solid var(--border-subtle)',
                                background: activityType === 'swimming' ? 'rgba(74, 222, 128, 0.1)' : 'transparent'
                            }}
                        >
                            <Waves size={24} color={activityType === 'swimming' ? 'var(--accent-primary)' : 'var(--text-muted)'} />
                            <span style={{ fontSize: '0.9rem', fontWeight: 600, color: activityType === 'swimming' ? 'var(--accent-primary)' : 'var(--text-secondary)' }}>Natação</span>
                        </button>
                    </div>
                </div>
            )}

            {/* Editing Header Context */}
            {isEditing && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '1rem', background: 'var(--bg-secondary)', borderRadius: '12px', border: '1px solid var(--border-subtle)', marginBottom: '2rem' }}>
                    <div style={{
                        width: '40px', height: '40px', borderRadius: '50%', background: 'rgba(74, 222, 128, 0.1)', color: 'var(--accent-primary)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}>
                        {activityType === 'weightlifting' && <Dumbbell size={20} />}
                        {activityType === 'running' && <Footprints size={20} />}
                        {activityType === 'cycling' && <Bike size={20} />}
                        {activityType === 'swimming' && <Waves size={20} />}
                    </div>
                    <div>
                        <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Modalidade</span>
                        <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                            {activityType === 'weightlifting' ? 'Musculação' :
                                activityType === 'running' ? 'Corrida' :
                                    activityType === 'cycling' ? 'Ciclismo' : 'Natação'}
                        </div>
                    </div>
                </div>
            )}

            {/* Header with Details */}
            <header className={styles.header} style={{ flexWrap: 'wrap', gap: '1rem', marginTop: '0' }}>
                <div style={{ flex: 1, minWidth: '200px' }}>
                    <h1 className={styles.title} style={{ fontSize: '1.5rem', color: 'var(--text-primary)' }}>{isEditing ? 'Editar Detalhes' : 'Detalhes do Treino'}</h1>
                    <p className={styles.subtitle} style={{ color: 'var(--text-secondary)' }}>
                        Data, Ciclo e Categoria
                    </p>
                </div>

                <div className={styles.headerControls}>
                    {/* Date Picker */}
                    <div className={styles.controlGroup}>
                        <label className={styles.label} style={{ color: 'var(--text-secondary)' }}>Data</label>
                        <input
                            type="date"
                            className="input"
                            value={workoutDate}
                            onChange={(e) => setWorkoutDate(e.target.value)}
                            style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)', border: '1px solid var(--border-subtle)' }}
                        />
                    </div>

                    {/* Category Selector (Only relevant for weightlifting organization usually, but kept for all) */}
                    <div className={styles.controlGroup}>
                        <label className={styles.label} style={{ color: 'var(--text-secondary)' }}>Ref/Tipo</label>
                        <div className={styles.typeSelector}>
                            {['A', 'B', 'C'].map((cat) => (
                                <button
                                    key={cat}
                                    type="button"
                                    onClick={() => setCategory(cat)}
                                    className={clsx(styles.typeBtn, category === cat && styles.activeType)}
                                    style={{
                                        background: category === cat ? 'var(--accent-primary)' : 'var(--bg-secondary)',
                                        color: category === cat ? '#000' : 'var(--text-secondary)',
                                        border: '1px solid var(--border-subtle)'
                                    }}
                                >
                                    {cat}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Cycle Selectors */}
                    <div className={styles.controlGroup}>
                        <label className={styles.label} style={{ color: 'var(--text-secondary)' }}>Meso</label>
                        <select
                            className="input"
                            value={mesocycle}
                            onChange={(e) => setMesocycle(Number(e.target.value))}
                            disabled={isEditing}
                            style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)', border: '1px solid var(--border-subtle)' }}
                        >
                            {[1, 2, 3, 4, 5, 6].map(n => <option key={n} value={n}>{n}</option>)}
                        </select>
                    </div>

                    <div className={styles.controlGroup}>
                        <label className={styles.label} style={{ color: 'var(--text-secondary)' }}>Semana</label>
                        <select
                            className="input"
                            value={week}
                            onChange={(e) => setWeek(Number(e.target.value))}
                            disabled={isEditing}
                            style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)', border: '1px solid var(--border-subtle)' }}
                        >
                            {[1, 2, 3, 4].map(n => <option key={n} value={n}>{n}</option>)}
                        </select>
                    </div>
                </div>
            </header >

            {activityType === 'weightlifting' ? (
                <>
                    {/* Auto Generation Option (Only for Week 1 New Workouts) */}
                    {
                        !isEditing && week === 1 && (
                            <div className="glass-panel" style={{ marginBottom: '20px', padding: '15px', display: 'flex', alignItems: 'center', gap: '10px', border: '1px solid var(--accent-primary)' }}>
                                <input
                                    type="checkbox"
                                    id="autoGen"
                                    checked={autoGenerate}
                                    onChange={(e) => setAutoGenerate(e.target.checked)}
                                    style={{ width: '18px', height: '18px', accentColor: 'var(--accent-primary)' }}
                                />
                                <label htmlFor="autoGen" style={{ fontWeight: 500, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-primary)' }}>
                                    <Layers size={18} color="var(--accent-primary)" />
                                    Gerar automaticamente as próximas 3 semanas? (Replica os exercícios)
                                </label>
                            </div>
                        )
                    }

                    {/* Weightlifting Table */}
                    <div className={`glass-panel ${styles.tableContainer}`} style={{ overflow: 'hidden' }}>
                        {/* ... Table Header ... */}
                        <div className={`${styles.gridRow} ${styles.desktopHeader}`} style={{ background: 'rgba(20, 20, 20, 0.8)', fontWeight: '600', color: 'var(--text-secondary)', borderBottom: '1px solid var(--border-subtle)' }}>
                            <div className={styles.colName} style={{ paddingLeft: '1rem' }}>Exercício</div>
                            <div className={styles.colNum}>Séries</div>
                            <div className={styles.colNum}>Reps</div>
                            <div className={styles.colNum}>Carga (kg)</div>
                            <div className={styles.colNum}>RPE</div>
                            <div className={styles.colNum}>RIR</div>
                            <div className={styles.colVtt}>
                                <div className={styles.headerWithHelp} style={{ justifyContent: 'flex-end', color: 'var(--text-muted)' }}>
                                    Total
                                </div>
                            </div>
                            <div className={styles.colAction}></div>
                        </div>

                        {/* Rows */}
                        <div className={styles.rowsContainer}>
                            {exercises.map((ex, index) => {
                                const vtt = calculateVTT(ex.sets, ex.reps, ex.load);
                                const highStress = isHighStress(ex.rpe, ex.rir);
                                const isSuperset = !!ex.supersetId;
                                const prevIsSame = index > 0 && exercises[index - 1].supersetId === ex.supersetId;
                                const nextIsSame = index < exercises.length - 1 && exercises[index + 1].supersetId === ex.supersetId;
                                const isStart = isSuperset && !prevIsSame;
                                const isEnd = isSuperset && !nextIsSame;
                                const isLinked = isSuperset && (prevIsSame || nextIsSame);

                                return (
                                    <div
                                        key={ex.id}
                                        className={clsx(styles.gridRow, highStress && styles.highStressRow)}
                                        style={{
                                            animation: `fadeIn 0.3s ease forwards`,
                                            animationDelay: `${index * 50}ms`,
                                            marginLeft: isLinked ? '12px' : '0',
                                            borderLeft: isLinked ? '4px solid var(--accent-primary)' : 'none',
                                            borderRadius: isLinked ? (isStart ? '8px 8px 0 0' : (isEnd ? '0 0 8px 8px' : '0')) : '0',
                                            marginBottom: isLinked && !isEnd ? '0' : '1px',
                                            background: 'var(--bg-secondary)',
                                            borderBottom: '1px solid var(--border-subtle)'
                                        }}
                                    >
                                        <div className={styles.colName}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%' }}>
                                                {isLinked && (
                                                    <div title="Conjugado" style={{ color: 'var(--accent-primary)' }}>
                                                        <LinkIcon size={14} />
                                                    </div>
                                                )}
                                                <div style={{ flex: 1 }}>
                                                    <span className={styles.mobileLabel} style={{ color: 'var(--text-muted)' }}>Exercício</span>
                                                    <input
                                                        type="text"
                                                        className="input"
                                                        placeholder={isLinked ? (isStart ? "Exercício 1 (Conjugado)" : "Exercício + (Conjugado)") : "Nome do exercício..."}
                                                        value={ex.name}
                                                        onChange={(e) => updateExercise(ex.id, 'name', e.target.value)}
                                                        style={{ fontWeight: '500', width: '100%', background: 'transparent', border: 'none', color: 'var(--text-primary)' }}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                        <div className={styles.colNum}>
                                            <span className={styles.mobileLabel} style={{ color: 'var(--text-muted)' }}>Séries</span>
                                            <input type="number" className="input" placeholder="0" value={ex.sets} onChange={(e) => updateExercise(ex.id, 'sets', e.target.value)} style={{ background: 'var(--bg-primary)', color: 'var(--text-primary)', border: '1px solid var(--border-subtle)' }} />
                                        </div>
                                        <div className={styles.colNum}>
                                            <span className={styles.mobileLabel} style={{ color: 'var(--text-muted)' }}>Reps</span>
                                            <input type="text" inputMode="numeric" className="input" placeholder="ex: 8-12" value={ex.reps} onChange={(e) => updateExercise(ex.id, 'reps', e.target.value)} style={{ background: 'var(--bg-primary)', color: 'var(--text-primary)', border: '1px solid var(--border-subtle)' }} />
                                        </div>
                                        <div className={styles.colNum}>
                                            <span className={styles.mobileLabel} style={{ color: 'var(--text-muted)' }}>Carga</span>
                                            <input type="number" className={clsx("input", ex.suggestProgression && styles.suggestedLoad)} placeholder="kg" value={ex.load} onChange={(e) => updateExercise(ex.id, 'load', e.target.value)} style={{ background: 'var(--bg-primary)', color: 'var(--text-primary)', border: '1px solid var(--border-subtle)' }} />
                                        </div>
                                        <div className={styles.colNum}>
                                            <span className={styles.mobileLabel} style={{ color: 'var(--text-muted)' }}>RPE</span>
                                            <input type="number" min="1" max="10" className="input" placeholder="-" value={ex.rpe} onChange={(e) => updateExercise(ex.id, 'rpe', e.target.value)} style={{ background: 'var(--bg-primary)', color: 'var(--text-primary)', border: '1px solid var(--border-subtle)', borderColor: ex.rpe > 9 ? '#fca5a5' : 'var(--border-subtle)' }} />
                                        </div>
                                        <div className={styles.colNum}>
                                            <span className={styles.mobileLabel} style={{ color: 'var(--text-muted)' }}>RIR</span>
                                            <input type="number" min="0" className="input" placeholder="-" value={ex.rir} onChange={(e) => updateExercise(ex.id, 'rir', e.target.value)} style={{ background: 'var(--bg-primary)', color: 'var(--text-primary)', border: '1px solid var(--border-subtle)' }} />
                                        </div>
                                        <div className={styles.colVtt}>
                                            <span className={styles.mobileLabel} style={{ color: 'var(--text-muted)' }}>Volume Total</span>
                                            <span style={{ fontWeight: '700', color: 'var(--text-muted)' }}>{vtt > 0 ? vtt.toLocaleString() : '-'}</span>
                                        </div>
                                        <div className={styles.colAction}>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                                <button onClick={() => removeRow(ex.id)} className={styles.iconBtn} title="Remover" style={{ color: 'var(--text-muted)' }}><Trash2 size={18} /></button>
                                                <button onClick={() => addSuperset(index)} className={styles.iconBtn} style={{ color: 'var(--accent-primary)', borderColor: 'rgba(74, 222, 128, 0.3)' }} title="Conjulgar"><Plus size={18} /></button>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                        {/* Footer Actions */}
                        <div className={styles.footerActions} style={{ padding: '1rem', borderTop: '1px solid var(--border-subtle)' }}>
                            <button onClick={addRow} className={`btn`} style={{ width: '100%', border: '2px dashed var(--border-subtle)', color: 'var(--text-secondary)', padding: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', borderRadius: '12px', fontWeight: '600', background: 'transparent' }}>
                                <Plus size={20} /> Adicionar Novo Exercício
                            </button>
                        </div>
                    </div>
                </>
            ) : (
                // CARDIO FORM
                <div className="glass-panel" style={{ padding: '2rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '2rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '1rem' }}>
                        {activityType === 'running' && <Footprints size={32} color="var(--accent-primary)" />}
                        {activityType === 'cycling' && <Bike size={32} color="var(--accent-primary)" />}
                        {activityType === 'swimming' && <Waves size={32} color="var(--accent-primary)" />}
                        <div>
                            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
                                Detalhes do Treino de {activityType === 'running' ? 'Corrida' : activityType === 'cycling' ? 'Ciclismo' : 'Natação'}
                            </h2>
                            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Preencha os dados da sessão</p>
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '2rem' }}>
                        {/* Essential Fields */}
                        <div>
                            <label className="label" style={{ color: 'var(--text-secondary)' }}>Duração Total (minutos) *</label>
                            <input type="number" className="input" placeholder="ex: 45" value={durationMinutes} onChange={e => setDurationMinutes(e.target.value)} style={{ fontSize: '1.1rem', background: 'var(--bg-secondary)', color: 'var(--text-primary)', border: '1px solid var(--border-subtle)' }} />
                        </div>

                        <div>
                            <label className="label" style={{ color: 'var(--text-secondary)' }}>
                                RPE da Sessão (0-10) *
                                <Tooltip text="Percepção de Esforço Média"><HelpCircle size={14} style={{ marginLeft: '6px' }} /></Tooltip>
                            </label>
                            <input type="number" min="0" max="10" className="input" placeholder="ex: 7" value={sessionRpe} onChange={e => setSessionRpe(e.target.value)} style={{ fontSize: '1.1rem', background: 'var(--bg-secondary)', color: 'var(--text-primary)', border: '1px solid var(--border-subtle)' }} />
                        </div>

                        <div>
                            <label className="label" style={{ color: 'var(--text-secondary)' }}>Distância ({activityType === 'swimming' ? 'metros' : 'km'})</label>
                            <input type="number" className="input" placeholder={activityType === 'swimming' ? "ex: 1500" : "ex: 5.5"} value={distance} onChange={e => setDistance(e.target.value)} style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)', border: '1px solid var(--border-subtle)' }} />
                        </div>

                        <div>
                            <label className="label" style={{ color: 'var(--text-secondary)' }}>Freq. Cardíaca Média (bpm)</label>
                            <input type="number" className="input" placeholder="ex: 145" value={avgHr} onChange={e => setAvgHr(e.target.value)} style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)', border: '1px solid var(--border-subtle)' }} />
                        </div>

                        {/* Sport Specifics */}
                        {activityType === 'cycling' && (
                            <div>
                                <label className="label" style={{ color: 'var(--text-secondary)' }}>Potência Média (Watts)</label>
                                <input type="number" className="input" placeholder="ex: 200" value={avgWatts} onChange={e => setAvgWatts(e.target.value)} style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)', border: '1px solid var(--border-subtle)' }} />
                            </div>
                        )}

                        {(activityType === 'running' || activityType === 'swimming') && (
                            <div>
                                <label className="label" style={{ color: 'var(--text-secondary)' }}>Pace Médio {activityType === 'swimming' ? '(min/100m)' : '(min/km)'}</label>
                                <input type="text" className="input" placeholder="ex: 5:30" value={avgPace} onChange={e => setAvgPace(e.target.value)} style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)', border: '1px solid var(--border-subtle)' }} />
                            </div>
                        )}

                        <div>
                            <label className="label" style={{ color: 'var(--text-secondary)' }}>Ganho de Elevação (m)</label>
                            <input type="number" className="input" placeholder="ex: 120" value={elevation} onChange={e => setElevation(e.target.value)} style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)', border: '1px solid var(--border-subtle)' }} />
                        </div>
                    </div>
                </div>
            )}

            {/* Common Data (Observations & Save) */}
            <div className="glass-panel" style={{ marginTop: '2rem', padding: '1.5rem' }}>
                {activityType === 'weightlifting' && (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '2rem', marginBottom: '1.5rem', paddingBottom: '1.5rem', borderBottom: '1px solid var(--border-subtle)' }}>
                        <div>
                            <label className="label" style={{ color: 'var(--text-secondary)' }}>Duração (minutos)</label>
                            <input type="number" className="input" placeholder="ex: 45" value={durationMinutes} onChange={e => setDurationMinutes(e.target.value)} style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)', border: '1px solid var(--border-subtle)' }} />
                        </div>
                        <div>
                            <label className="label" style={{ color: 'var(--text-secondary)' }}>RPE da Sessão (0-10)</label>
                            <input type="number" min="0" max="10" className="input" placeholder="ex: 7" value={sessionRpe} onChange={e => setSessionRpe(e.target.value)} style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)', border: '1px solid var(--border-subtle)' }} />
                        </div>
                    </div>
                )}

                <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <Activity size={20} color="var(--accent-primary)" /> Observações
                </h3>
                <textarea
                    className="input"
                    value={observations}
                    onChange={(e) => setObservations(e.target.value)}
                    placeholder="Como foi o treino? Dor? Recorde? Clima?"
                    rows={4}
                    style={{ width: '100%', resize: 'vertical', minHeight: '100px', background: 'var(--bg-secondary)', color: 'var(--text-primary)', border: '1px solid var(--border-subtle)' }}
                />
            </div>

            <div className={styles.pageActions}>
                <button onClick={handleSubmit} className="btn-primary" style={{ minWidth: '200px', fontSize: '1.1rem' }}>
                    <Save size={20} style={{ marginRight: '8px' }} /> {isEditing ? 'Atualizar Treino' : 'Salvar Treino'}
                </button>
            </div>
        </div>
    );
};


export default TrainingLog;
