import React, { useState } from 'react';
import { useWorkout } from '../context/WorkoutContext';
import { useStudent } from '../context/StudentContext';
import { useNavigate } from 'react-router-dom';
import { Plus, Trash2, Save, ArrowRight, ArrowLeft, Dumbbell, Footprints, Bike, Waves, Clock, Activity, MapPin, AlignLeft } from 'lucide-react';
import styles from './MesocycleBuilder.module.css';

const MesocycleBuilder = () => {
    const { createMesocycle } = useWorkout();
    const { selectedStudentId } = useStudent();
    const navigate = useNavigate();

    const [step, setStep] = useState(1); // 1: Config, 2: Base Week



    const [config, setConfig] = useState({
        name: '',
        weeks: 4,
        startDate: new Date().toISOString().split('T')[0],
        activityType: 'weightlifting' // Default
    });

    const [baseWorkouts, setBaseWorkouts] = useState([
        { id: 'A', name: 'Treino A', exercises: [], duration: '', distance: '', rpe: '', drills: '', mainSet: '', scheduledDays: [] }
    ]);

    const [activeTab, setActiveTab] = useState('A');

    // Exercise Input State
    const [newExercise, setNewExercise] = useState({ name: '', sets: '3', reps: '8-12' });


    if (!selectedStudentId) {
        return <div className="p-8 text-center">Selecione um aluno primeiro.</div>;
    }

    const handleAddWorkoutTab = () => {
        const nextLetter = String.fromCharCode(65 + baseWorkouts.length); // A, B, C...
        const newTabId = nextLetter;
        setBaseWorkouts([...baseWorkouts, {
            id: newTabId,
            name: `Treino ${nextLetter}`,
            exercises: [],
            duration: '',
            distance: '',
            rpe: '',
            drills: '',
            mainSet: '',
            scheduledDays: []
        }]);
        setActiveTab(newTabId);
    };

    const handleBaseWorkoutChange = (workoutId, field, value) => {
        setBaseWorkouts(prev => prev.map(w => {
            if (w.id === workoutId) {
                return { ...w, [field]: value };
            }
            return w;
        }));
    };

    const handleAddExercise = () => {
        if (!newExercise.name) return;
        setBaseWorkouts(prev => prev.map(w => {
            if (w.id === activeTab) {
                return { ...w, exercises: [...w.exercises, { ...newExercise, id: crypto.randomUUID() }] };
            }
            return w;
        }));
        setNewExercise({ name: '', sets: '3', reps: '8-12' });
    };

    const handleRemoveExercise = (workoutId, exerciseId) => {
        setBaseWorkouts(prev => prev.map(w => {
            if (w.id === workoutId) {
                return { ...w, exercises: w.exercises.filter(e => e.id !== exerciseId) };
            }
            return w;
        }));
    };

    const handleGenerate = () => {
        console.log("handleGenerate: Started");
        console.log("Config:", config);

        // Basic Validation
        if (!config.name) {
            alert('Preencha o nome do programa.');
            return;
        }

        if (!config.startDate) {
            alert('Selecione uma data de início.');
            return;
        }

        // Specific Validation
        if (config.activityType === 'weightlifting') {
            if (baseWorkouts.some(w => w.exercises.length === 0)) {
                alert('Adicione exercícios em todos os treinos de musculação.');
                return;
            }
        } else {
            // For cardio, maybe warn if empty but allow? Or check duration?
            // Let's at least check if duration is provided for all
            if (baseWorkouts.some(w => !w.duration && !w.distance)) {
                // Converting to confirm since it might be intentional
                if (!confirm('Alguns treinos estão sem Duração ou Distância. Continuar mesmo assim?')) return;
            }
        }

        try {
            const formattedBaseWorkouts = baseWorkouts.map(w => ({
                ...w,
                duration_minutes: w.duration,
                distance_km: w.distance,
                session_rpe: w.rpe,
                drills_description: w.drills,
                main_set_description: w.mainSet
            }));

            const resultMeso = createMesocycle({
                ...config,
                studentId: selectedStudentId,
                baseWorkouts: formattedBaseWorkouts
            });
            console.log("createMesocycle returned:", resultMeso);
            alert(`Programa criado com sucesso! Mesociclo #${resultMeso}`);
            navigate('/workouts');
        } catch (error) {
            console.error("Error creating mesocycle:", error);
            alert("Erro ao criar programa. Verifique o console.");
        }
    };

    const handleAddSupersetExercise = (workoutId, insertAtIndex) => {
        setBaseWorkouts(prev => prev.map(w => {
            if (w.id === workoutId) {
                const parent = w.exercises[insertAtIndex];
                const ssid = parent.supersetId || crypto.randomUUID();

                // Update parent with ID
                const updatedParent = { ...parent, supersetId: ssid };

                // New empty exercise linked
                const chainedExercise = {
                    id: crypto.randomUUID(),
                    name: 'Novo Exercício',
                    sets: parent.sets,
                    reps: parent.reps,
                    supersetId: ssid
                };

                const newExercises = [...w.exercises];
                newExercises[insertAtIndex] = updatedParent;
                newExercises.splice(insertAtIndex + 1, 0, chainedExercise);

                return { ...w, exercises: newExercises };
            }
            return w;
        }));
    };

    const handleExerciseChange = (workoutId, exerciseId, field, value) => {
        setBaseWorkouts(prev => prev.map(w => {
            if (w.id === workoutId) {
                return {
                    ...w,
                    exercises: w.exercises.map(ex => {
                        if (ex.id === exerciseId) {
                            return { ...ex, [field]: value };
                        }
                        return ex;
                    })
                };
            }
            return w;
        }));
    };

    const currentWorkout = baseWorkouts.find(w => w.id === activeTab) || baseWorkouts[0];

    return (
        <div className={`page-container animate-fade-in ${styles.container}`}>
            <header className={styles.header}>
                <h1 className={styles.title} style={{ color: 'var(--text-primary)' }}>Novo Programa</h1>
                <p className={styles.subtitle} style={{ color: 'var(--text-secondary)' }}>Construtor de Mesociclo</p>

                {/* Progress Steps */}
                <div style={{ display: 'flex', gap: '10px', marginTop: '1rem' }}>
                    <div style={{
                        flex: 1, height: '4px', borderRadius: '2px',
                        background: step >= 1 ? 'var(--accent-primary)' : 'var(--bg-secondary)'
                    }} />
                    <div style={{
                        flex: 1, height: '4px', borderRadius: '2px',
                        background: step >= 2 ? 'var(--accent-primary)' : 'var(--bg-secondary)'
                    }} />
                </div>
            </header>

            <div className="glass-panel" style={{ padding: '2rem' }}>
                {step === 1 && (
                    <div className="animate-fade-in">
                        <h2 style={{ fontSize: '1.2rem', fontWeight: 600, marginBottom: '1.5rem', color: 'var(--text-primary)' }}>Etapa 1: Criar</h2>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

                            {/* ACTIVITY SELECTOR */}
                            <div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.8rem' }}>
                                    <label style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>Modalidade Principal</label>
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))', gap: '12px' }}>
                                    {[
                                        { id: 'weightlifting', label: 'Musculação', icon: <Dumbbell size={24} /> },
                                        { id: 'running', label: 'Corrida', icon: <Footprints size={24} /> },
                                        { id: 'cycling', label: 'Ciclismo', icon: <Bike size={24} /> },
                                        { id: 'swimming', label: 'Natação', icon: <Waves size={24} /> }

                                    ].map(type => (
                                        <button
                                            key={type.id}
                                            type="button"
                                            onClick={() => setConfig({ ...config, activityType: type.id })}
                                            style={{
                                                padding: '16px', borderRadius: '12px',
                                                border: config.activityType === type.id ? '2px solid var(--accent-primary)' : '1px solid var(--border-subtle)',
                                                background: config.activityType === type.id ? 'rgba(74, 222, 128, 0.1)' : 'var(--bg-secondary)',
                                                color: config.activityType === type.id ? 'var(--accent-primary)' : 'var(--text-secondary)',
                                                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px',
                                                cursor: 'pointer', transition: 'all 0.2s',
                                                fontWeight: 600, fontSize: '0.9rem'
                                            }}
                                        >
                                            {type.icon}
                                            {type.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500, color: 'var(--text-secondary)' }}>Nome do Mesociclo</label>
                                <input
                                    type="text"
                                    value={config.name}
                                    onChange={e => setConfig({ ...config, name: e.target.value })}
                                    placeholder="Ex: Força Pura, Hipertrofia Fase 1"
                                    className="input"
                                    style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-subtle)', background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
                                />
                            </div>

                            <div className={styles.configGrid}>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500, color: 'var(--text-secondary)' }}>Tempo (Semanas)</label>
                                    <input
                                        type="number"
                                        value={config.weeks}
                                        onChange={e => setConfig({ ...config, weeks: parseInt(e.target.value) })}
                                        min="1" max="12"
                                        className="input"
                                        style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-subtle)', background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
                                    />
                                </div>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500, color: 'var(--text-secondary)' }}>Data de Início</label>
                                    <input
                                        type="date"
                                        value={config.startDate}
                                        onChange={e => setConfig({ ...config, startDate: e.target.value })}
                                        className="input"
                                        style={{
                                            width: '100%',
                                            padding: '12px',
                                            borderRadius: '8px',
                                            border: '1px solid var(--border-subtle)',
                                            cursor: 'pointer',
                                            background: 'var(--bg-secondary)',
                                            color: 'var(--text-primary)'
                                        }}
                                    />
                                </div>
                            </div>

                            <div style={{ marginTop: '1rem', display: 'flex', justifyContent: 'flex-end' }}>
                                <button
                                    type="button"
                                    onClick={() => setStep(2)}
                                    className="btn-primary"
                                    style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
                                >
                                    Próximo <ArrowRight size={18} />
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {step === 2 && (
                    <div className="animate-slide-in">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                            <div className="flex items-center gap-4">
                                <h2 style={{ fontSize: '1.2rem', fontWeight: 600, color: 'var(--text-primary)' }}>Etapa 2: Planejar Base Semanal</h2>
                            </div>

                            <button type="button" onClick={() => setStep(1)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <ArrowLeft size={16} /> Voltar
                            </button>
                        </div>

                        {/* Tabs */}
                        <div style={{ display: 'flex', gap: '8px', marginBottom: '1.5rem', overflowX: 'auto', paddingBottom: '4px' }}>
                            {baseWorkouts.map(w => (
                                <button
                                    key={w.id}
                                    onClick={() => setActiveTab(w.id)}
                                    style={{
                                        padding: '8px 16px',
                                        borderRadius: '20px',
                                        border: 'none',
                                        background: activeTab === w.id ? 'var(--accent-primary)' : 'var(--bg-secondary)',
                                        color: activeTab === w.id ? '#000' : 'var(--text-secondary)',
                                        fontWeight: 600,
                                        cursor: 'pointer',
                                        whiteSpace: 'nowrap'
                                    }}
                                >
                                    {w.name} ({config.activityType === 'weightlifting' ? w.exercises.length : (w.duration ? w.duration + 'm' : '-')})
                                </button>
                            ))}
                            <button
                                onClick={handleAddWorkoutTab}
                                style={{
                                    padding: '8px 12px',
                                    borderRadius: '20px',
                                    border: '1px dashed var(--border-subtle)',
                                    background: 'transparent',
                                    color: 'var(--text-secondary)',
                                    cursor: 'pointer'
                                }}
                            >
                                + Adicionar
                            </button>
                        </div>

                        {/* Weekday Selector for Active Tab (Multi-Select) */}
                        <div style={{ marginBottom: '1rem', background: 'var(--bg-secondary)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
                            <label style={{ display: 'block', marginBottom: '10px', fontWeight: 600, color: 'var(--text-primary)' }}>Dias de Treino:</label>

                            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                {[
                                    { id: 1, label: 'Seg' },
                                    { id: 2, label: 'Ter' },
                                    { id: 3, label: 'Qua' },
                                    { id: 4, label: 'Qui' },
                                    { id: 5, label: 'Sex' },
                                    { id: 6, label: 'Sáb' },
                                    { id: 0, label: 'Dom' }
                                ].map(day => {
                                    const currentWorkout = baseWorkouts.find(w => w.id === activeTab);
                                    const isSelected = currentWorkout?.scheduledDays?.includes(day.id);

                                    return (
                                        <button
                                            key={day.id}
                                            onClick={() => {
                                                setBaseWorkouts(prev => prev.map(w => {
                                                    if (w.id === activeTab) {
                                                        const currentDays = w.scheduledDays || [];
                                                        const newDays = currentDays.includes(day.id)
                                                            ? currentDays.filter(d => d !== day.id)
                                                            : [...currentDays, day.id];
                                                        return { ...w, scheduledDays: newDays };
                                                    }
                                                    return w;
                                                }));
                                            }}
                                            style={{
                                                padding: '8px 16px',
                                                borderRadius: '8px',
                                                border: isSelected ? '1px solid var(--accent-primary)' : '1px solid var(--border-subtle)',
                                                background: isSelected ? 'rgba(74, 222, 128, 0.2)' : 'var(--bg-primary)',
                                                color: isSelected ? 'var(--accent-primary)' : 'var(--text-secondary)',
                                                fontWeight: isSelected ? 600 : 400,
                                                cursor: 'pointer',
                                                transition: 'all 0.2s',
                                                flex: 1
                                            }}
                                        >
                                            {day.label}
                                        </button>
                                    );
                                })}
                            </div>
                            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginTop: '8px' }}>
                                * Selecione os dias da semana em que este treino se repete.
                            </span>
                        </div>

                        {/* Active Tab Content */}
                        <div style={{ background: 'rgba(20, 20, 20, 0.4)', borderRadius: '12px', padding: '1.5rem', marginBottom: '1.5rem', border: '1px solid var(--border-subtle)' }}>
                            <div style={{ marginBottom: '1.5rem' }}>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Nome do Treino (Opcional)</label>
                                <input
                                    type="text"
                                    value={baseWorkouts.find(w => w.id === activeTab)?.name || ''}
                                    onChange={(e) => {
                                        setBaseWorkouts(prev => prev.map(w => {
                                            if (w.id === activeTab) {
                                                return { ...w, name: e.target.value };
                                            }
                                            return w;
                                        }));
                                    }}
                                    placeholder={`Ex: Treino ${activeTab}, Perna, Superiores...`}
                                    className="input"
                                    style={{
                                        width: '100%', padding: '10px', borderRadius: '6px',
                                        border: '1px solid var(--border-subtle)', fontSize: '1rem',
                                        background: 'var(--bg-secondary)', color: 'var(--text-primary)'
                                    }}
                                />
                            </div>

                            {/* CONDITIONAL CONTENT */}
                            {config.activityType === 'weightlifting' ? (
                                <>
                                    <h3 style={{ marginBottom: '1rem', color: 'var(--text-primary)' }}>Exercícios</h3>

                                    {/* Exercise List */}
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1.5rem' }}>
                                        {currentWorkout.exercises.length === 0 && (
                                            <p style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>Nenhum exercício adicionado ainda.</p>
                                        )}
                                        {currentWorkout.exercises.map((ex, index, arr) => {
                                            // Superset Grouping Logic
                                            const isSuperset = !!ex.supersetId;
                                            const prevIsSame = index > 0 && arr[index - 1].supersetId === ex.supersetId;
                                            const nextIsSame = index < arr.length - 1 && arr[index + 1].supersetId === ex.supersetId;
                                            const isLinked = isSuperset && (prevIsSame || nextIsSame);
                                            const isStart = isSuperset && !prevIsSame;
                                            const isEnd = isSuperset && !nextIsSame;

                                            return (
                                                <div
                                                    key={ex.id}
                                                    style={{
                                                        display: 'flex',
                                                        justifyContent: 'space-between',
                                                        alignItems: 'center',
                                                        background: 'var(--bg-secondary)',
                                                        padding: '10px',
                                                        borderRadius: isLinked ? (isStart ? '8px 8px 0 0' : (isEnd ? '0 0 8px 8px' : '0')) : '8px',
                                                        boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                                                        marginLeft: isLinked ? '12px' : '0',
                                                        borderLeft: isLinked ? '4px solid var(--accent-primary)' : 'none',
                                                        marginBottom: isLinked && !isEnd ? '0' : '8px'
                                                    }}
                                                >
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                        {/* Left-side Add Button for Superset */}
                                                        <button
                                                            onClick={() => handleAddSupersetExercise(activeTab, index)}
                                                            title="Adicionar exercício conjugado (Bi-set/Tri-set)"
                                                            style={{
                                                                width: '24px', height: '24px',
                                                                borderRadius: '4px', border: '1px dashed var(--accent-primary)',
                                                                background: 'rgba(74, 222, 128, 0.1)', color: 'var(--accent-primary)',
                                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                                cursor: 'pointer',
                                                                flexShrink: 0
                                                            }}
                                                        >
                                                            <Plus size={14} />
                                                        </button>

                                                        <div style={{ flex: 1 }}>
                                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                                                                <input
                                                                    type="text"
                                                                    value={ex.name}
                                                                    onChange={(e) => handleExerciseChange(activeTab, ex.id, 'name', e.target.value)}
                                                                    style={{
                                                                        fontWeight: 600,
                                                                        color: 'var(--text-primary)',
                                                                        border: '1px solid transparent',
                                                                        background: 'transparent',
                                                                        padding: '4px',
                                                                        borderRadius: '4px',
                                                                        fontSize: '1rem',
                                                                        width: '100%',
                                                                        transition: 'all 0.2s'
                                                                    }}
                                                                    className="hover:border-zinc-700 focus:border-green-500 focus:bg-zinc-800"
                                                                    placeholder="Nome do exercício"
                                                                />
                                                                {isLinked && <span style={{ fontSize: '0.7rem', color: 'var(--accent-primary)', border: '1px solid var(--accent-primary)', padding: '0 4px', borderRadius: '4px', whiteSpace: 'nowrap' }}>Conjugado</span>}
                                                            </div>
                                                            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                                                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                                    <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Séries:</span>
                                                                    <input
                                                                        type="text"
                                                                        value={ex.sets}
                                                                        onChange={(e) => handleExerciseChange(activeTab, ex.id, 'sets', e.target.value)}
                                                                        style={{ width: '40px', padding: '2px 4px', borderRadius: '4px', border: '1px solid var(--border-subtle)', background: 'var(--bg-primary)', color: 'var(--text-primary)', fontSize: '0.85rem' }}
                                                                    />
                                                                </div>
                                                                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                                    <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Reps:</span>
                                                                    <input
                                                                        type="text"
                                                                        value={ex.reps}
                                                                        onChange={(e) => handleExerciseChange(activeTab, ex.id, 'reps', e.target.value)}
                                                                        style={{ width: '60px', padding: '2px 4px', borderRadius: '4px', border: '1px solid var(--border-subtle)', background: 'var(--bg-primary)', color: 'var(--text-primary)', fontSize: '0.85rem' }}
                                                                    />
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <button
                                                            onClick={() => handleRemoveExercise(activeTab, ex.id)}
                                                            style={{ color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer' }}
                                                        >
                                                            <Trash2 size={16} />
                                                        </button>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>

                                    {/* Add Exercise Form */}
                                    <div className={styles.addExerciseForm} style={{ opacity: 1, pointerEvents: 'auto' }}>
                                        <div>
                                            <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Exercício</label>
                                            <div style={{ position: 'relative' }}>
                                                <input
                                                    type="text"
                                                    value={newExercise.name}
                                                    onChange={e => {
                                                        const val = e.target.value;
                                                        setNewExercise({ ...newExercise, name: val });
                                                    }}
                                                    placeholder="Nome do exercício"
                                                    className="input"
                                                    style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid var(--border-subtle)', background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
                                                />
                                            </div>
                                        </div>
                                        <div>
                                            <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Séries</label>
                                            <input
                                                type="text"
                                                value={newExercise.sets}
                                                onChange={e => setNewExercise({ ...newExercise, sets: e.target.value })}
                                                className="input"
                                                style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid var(--border-subtle)', background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
                                            />
                                        </div>
                                        <div>
                                            <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Reps</label>
                                            <input
                                                type="text"
                                                value={newExercise.reps}
                                                onChange={e => setNewExercise({ ...newExercise, reps: e.target.value })}
                                                className="input"
                                                style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid var(--border-subtle)', background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
                                            />
                                        </div>
                                        <button
                                            onClick={handleAddExercise}
                                            className="btn-primary"
                                            style={{ display: 'flex', alignItems: 'center', gap: '8px', height: '100%', justifyContent: 'center', marginTop: 'auto' }}
                                        >
                                            <Plus size={18} />
                                        </button>
                                    </div>
                                </>
                            ) : (
                                /* CARDIO FORM (Running, Cycling, Swimming) */
                                <div className="cardio-base-form animate-fade-in">
                                    <div style={{
                                        display: 'flex', alignItems: 'center', gap: '10px', padding: '10px',
                                        background: 'rgba(2, 132, 199, 0.1)', borderRadius: '8px', marginBottom: '1.5rem',
                                        border: '1px solid rgba(2, 132, 199, 0.2)'
                                    }}>
                                        <Activity size={20} color="var(--accent-primary)" />
                                        <span style={{ fontSize: '0.9rem', color: 'var(--accent-primary)' }}>
                                            Defina os parâmetros principais do treino de {
                                                config.activityType === 'running' ? 'Corrida' :
                                                    config.activityType === 'cycling' ? 'Ciclismo' : 'Natação'
                                            }.
                                        </span>
                                    </div>

                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                                        <div>
                                            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500, color: 'var(--text-secondary)' }}>
                                                <Clock size={16} style={{ display: 'inline', marginRight: '6px', verticalAlign: 'text-bottom' }} />
                                                Duração Plan. (min)
                                            </label>
                                            <input
                                                type="number"
                                                value={baseWorkouts.find(w => w.id === activeTab)?.duration || ''}
                                                onChange={(e) => handleBaseWorkoutChange(activeTab, 'duration', e.target.value)}
                                                placeholder="Ex: 45"
                                                className="input"
                                                style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid var(--border-subtle)', background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
                                            />
                                        </div>
                                        <div>
                                            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500, color: 'var(--text-secondary)' }}>
                                                <MapPin size={16} style={{ display: 'inline', marginRight: '6px', verticalAlign: 'text-bottom' }} />
                                                Distância ({config.activityType === 'swimming' ? 'm' : 'km'})
                                            </label>
                                            <input
                                                type="number"
                                                step="0.1"
                                                value={baseWorkouts.find(w => w.id === activeTab)?.distance || ''}
                                                onChange={(e) => handleBaseWorkoutChange(activeTab, 'distance', e.target.value)}
                                                placeholder={config.activityType === 'swimming' ? "Ex: 1500" : "Ex: 5.5"}
                                                className="input"
                                                style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid var(--border-subtle)', background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
                                            />
                                        </div>
                                    </div>

                                    <div style={{ marginBottom: '1rem' }}>
                                        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500, color: 'var(--text-secondary)' }}>
                                            RPE / Intensidade Alvo (0-10)
                                        </label>
                                        <input
                                            type="number"
                                            min="1" max="10"
                                            value={baseWorkouts.find(w => w.id === activeTab)?.rpe || ''}
                                            onChange={(e) => handleBaseWorkoutChange(activeTab, 'rpe', e.target.value)}
                                            placeholder="Ex: 7"
                                            className="input"
                                            style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid var(--border-subtle)', background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
                                        />
                                    </div>

                                    <div style={{ marginBottom: '1rem' }}>
                                        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500, color: 'var(--text-secondary)' }}>
                                            <AlignLeft size={16} style={{ display: 'inline', marginRight: '6px', verticalAlign: 'text-bottom' }} />
                                            Aquecimento / Educativos (Drills)
                                        </label>
                                        <textarea
                                            value={baseWorkouts.find(w => w.id === activeTab)?.drills || ''}
                                            onChange={(e) => handleBaseWorkoutChange(activeTab, 'drills', e.target.value)}
                                            placeholder="Descreva o aquecimento e exercícios técnicos..."
                                            rows={3}
                                            className="input"
                                            style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid var(--border-subtle)', resize: 'vertical', background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
                                        />
                                    </div>

                                    <div style={{ marginBottom: '1rem' }}>
                                        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500, color: 'var(--text-secondary)' }}>
                                            <Activity size={16} style={{ display: 'inline', marginRight: '6px', verticalAlign: 'text-bottom' }} />
                                            Parte Principal (Main Set)
                                        </label>
                                        <textarea
                                            value={baseWorkouts.find(w => w.id === activeTab)?.mainSet || ''}
                                            onChange={(e) => handleBaseWorkoutChange(activeTab, 'mainSet', e.target.value)}
                                            placeholder="Descreva a parte principal do treino (ex: 4x 1km @ 4:30/km)..."
                                            rows={5}
                                            className="input"
                                            style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid var(--border-subtle)', resize: 'vertical', background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
                                        />
                                    </div>
                                </div>
                            )}

                        </div>

                        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '2rem' }}>
                            <button
                                type="button"
                                onClick={handleGenerate}
                                className="btn-primary"
                                style={{
                                    padding: '12px 24px',
                                    borderRadius: '8px',
                                    fontSize: '1rem',
                                    display: 'flex', alignItems: 'center', gap: '8px',
                                    border: '2px solid var(--accent-primary)'
                                }}
                            >
                                <Save size={20} />
                                FINALIZAR PROGRAMA
                            </button>
                        </div>
                    </div>
                )}
            </div>

        </div>
    );
};

export default MesocycleBuilder;
