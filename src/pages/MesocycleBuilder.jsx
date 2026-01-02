import React, { useState } from 'react';
import { useWorkout } from '../context/WorkoutContext';
import { useStudent } from '../context/StudentContext';
import { useNavigate } from 'react-router-dom';
import { Plus, Trash2, Save, ArrowRight, ArrowLeft } from 'lucide-react';
import styles from './CreateWorkout.module.css'; // Reusing styles or create new

const MesocycleBuilder = () => {
    const { createMesocycle } = useWorkout();
    const { selectedStudentId, students } = useStudent();
    const navigate = useNavigate();

    const [step, setStep] = useState(1); // 1: Config, 2: Base Week
    const [config, setConfig] = useState({
        name: '',
        weeks: 4,
        startDate: new Date().toISOString().split('T')[0]
    });

    const [baseWorkouts, setBaseWorkouts] = useState([
        { id: 'A', name: 'Treino A', exercises: [] }
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
        setBaseWorkouts([...baseWorkouts, { id: newTabId, name: `Treino ${nextLetter}`, exercises: [] }]);
        setActiveTab(newTabId);
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
        if (!config.name || baseWorkouts.some(w => w.exercises.length === 0)) {
            alert('Preencha o nome do programa e adicione exercícios em todos os treinos.');
            return;
        }

        if (window.confirm(`Gerar ${config.weeks} semanas de treino para ${students.find(s => s.id === selectedStudentId)?.name}?`)) {
            const resultMeso = createMesocycle({
                ...config,
                studentId: selectedStudentId,
                baseWorkouts
            });
            alert(`Programa criado com sucesso! Mesociclo #${resultMeso}`);
            navigate('/dashboard');
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

    return (
        <div className="page-container animate-fade-in" style={{ maxWidth: '800px', margin: '0 auto' }}>
            <header style={{ marginBottom: '2rem' }}>
                <h1 style={{ fontSize: '1.8rem', fontWeight: 700, color: '#1e293b' }}>Novo Programa</h1>
                <p style={{ color: '#64748B' }}>Construtor de Mesociclo</p>

                {/* Progress Steps */}
                <div style={{ display: 'flex', gap: '10px', marginTop: '1rem' }}>
                    <div style={{
                        flex: 1, height: '4px', borderRadius: '2px',
                        background: step >= 1 ? 'var(--accent-primary)' : '#e2e8f0'
                    }} />
                    <div style={{
                        flex: 1, height: '4px', borderRadius: '2px',
                        background: step >= 2 ? 'var(--accent-primary)' : '#e2e8f0'
                    }} />
                </div>
            </header>

            <div className="glass-panel" style={{ padding: '2rem' }}>
                {step === 1 && (
                    <div className="animate-fade-in">
                        <h2 style={{ fontSize: '1.2rem', fontWeight: 600, marginBottom: '1.5rem' }}>Etapa 1: Criar</h2>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Nome do Mesociclo</label>
                                <input
                                    type="text"
                                    value={config.name}
                                    onChange={e => setConfig({ ...config, name: e.target.value })}
                                    placeholder="Ex: Força Pura, Hipertrofia Fase 1"
                                    style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                                />
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Tempo (Semanas)</label>
                                    <input
                                        type="number"
                                        value={config.weeks}
                                        onChange={e => setConfig({ ...config, weeks: parseInt(e.target.value) })}
                                        min="1" max="12"
                                        style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                                    />
                                </div>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Data</label>
                                    <input
                                        type="date"
                                        value={config.startDate}
                                        onChange={e => setConfig({ ...config, startDate: e.target.value })}
                                        onClick={(e) => {
                                            try {
                                                if (e.target.showPicker) e.target.showPicker();
                                            } catch (error) {
                                                // ignore - browser might not support it or blocking it
                                            }
                                        }}
                                        style={{
                                            width: '100%',
                                            padding: '12px',
                                            borderRadius: '8px',
                                            border: '1px solid #cbd5e1',
                                            cursor: 'pointer'
                                        }}
                                    />
                                </div>
                            </div>

                            <div style={{ marginTop: '1rem', display: 'flex', justifyContent: 'flex-end' }}>
                                <button
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
                    <div className="animate-fade-in">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                            <h2 style={{ fontSize: '1.2rem', fontWeight: 600 }}>Etapa 2: Semana Base</h2>
                            <button onClick={() => setStep(1)} style={{ background: 'none', border: 'none', color: '#64748B', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
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
                                        background: activeTab === w.id ? 'var(--accent-primary)' : '#e2e8f0',
                                        color: activeTab === w.id ? '#fff' : '#64748B',
                                        fontWeight: 600,
                                        cursor: 'pointer',
                                        whiteSpace: 'nowrap'
                                    }}
                                >
                                    {w.name} ({w.exercises.length})
                                </button>
                            ))}
                            <button
                                onClick={handleAddWorkoutTab}
                                style={{
                                    padding: '8px 12px',
                                    borderRadius: '20px',
                                    border: '1px dashed #94a3b8',
                                    background: 'transparent',
                                    color: '#64748B',
                                    cursor: 'pointer'
                                }}
                            >
                                + Adicionar
                            </button>
                        </div>

                        {/* Active Tab Content */}
                        <div style={{ background: '#f8fafc', borderRadius: '12px', padding: '1.5rem', marginBottom: '1.5rem' }}>
                            <h3 style={{ marginBottom: '1rem', color: '#334155' }}>Exercícios do {baseWorkouts.find(w => w.id === activeTab)?.name}</h3>

                            {/* Exercise List */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1.5rem' }}>
                                {baseWorkouts.find(w => w.id === activeTab)?.exercises.length === 0 && (
                                    <p style={{ color: '#94a3b8', fontStyle: 'italic' }}>Nenhum exercício adicionado ainda.</p>
                                )}
                                {baseWorkouts.find(w => w.id === activeTab)?.exercises.map((ex, index, arr) => {
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
                                                background: '#fff',
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
                                                        background: '#f0f9ff', color: 'var(--accent-primary)',
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
                                                                color: '#1e293b',
                                                                border: '1px solid transparent',
                                                                background: 'transparent',
                                                                padding: '4px',
                                                                borderRadius: '4px',
                                                                fontSize: '1rem',
                                                                width: '100%',
                                                                transition: 'all 0.2s'
                                                            }}
                                                            className="hover:border-slate-300 focus:border-blue-500 focus:bg-white"
                                                            placeholder="Nome do exercício"
                                                        />
                                                        {isLinked && <span style={{ fontSize: '0.7rem', color: 'var(--accent-primary)', border: '1px solid var(--accent-primary)', padding: '0 4px', borderRadius: '4px', whiteSpace: 'nowrap' }}>Conjugado</span>}
                                                    </div>
                                                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                            <span style={{ fontSize: '0.85rem', color: '#64748B' }}>Séries:</span>
                                                            <input
                                                                type="text"
                                                                value={ex.sets}
                                                                onChange={(e) => handleExerciseChange(activeTab, ex.id, 'sets', e.target.value)}
                                                                style={{ width: '40px', padding: '2px 4px', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
                                                            />
                                                        </div>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                            <span style={{ fontSize: '0.85rem', color: '#64748B' }}>Reps:</span>
                                                            <input
                                                                type="text"
                                                                value={ex.reps}
                                                                onChange={(e) => handleExerciseChange(activeTab, ex.id, 'reps', e.target.value)}
                                                                style={{ width: '60px', padding: '2px 4px', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
                                                            />
                                                        </div>
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
                                    );
                                })}
                            </div>

                            {/* Add Exercise Form */}
                            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr auto', gap: '10px', alignItems: 'end' }}>
                                <div>
                                    <label style={{ fontSize: '0.8rem', color: '#64748B' }}>Exercício</label>
                                    <input
                                        type="text"
                                        value={newExercise.name}
                                        onChange={e => setNewExercise({ ...newExercise, name: e.target.value })}
                                        placeholder="Nome"
                                        style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                                    />
                                </div>
                                <div>
                                    <label style={{ fontSize: '0.8rem', color: '#64748B' }}>Séries</label>
                                    <input
                                        type="text"
                                        value={newExercise.sets}
                                        onChange={e => setNewExercise({ ...newExercise, sets: e.target.value })}
                                        style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                                    />
                                </div>
                                <div>
                                    <label style={{ fontSize: '0.8rem', color: '#64748B' }}>Reps</label>
                                    <input
                                        type="text"
                                        value={newExercise.reps}
                                        onChange={e => setNewExercise({ ...newExercise, reps: e.target.value })}
                                        style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                                    />
                                </div>
                                <button
                                    onClick={handleAddExercise}
                                    style={{
                                        background: '#3b82f6', color: '#fff', border: 'none',
                                        padding: '8px', borderRadius: '6px', cursor: 'pointer',
                                        height: '38px', width: '38px', display: 'flex', alignItems: 'center', justifyContent: 'center'
                                    }}
                                >
                                    <Plus size={20} />
                                </button>
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '2rem' }}>
                            <button
                                onClick={handleGenerate}
                                className="btn-primary"
                                style={{
                                    background: 'var(--success)',
                                    color: '#052e16', // Dark green text for contrast
                                    filter: 'none',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                    fontSize: '1.1rem',
                                    padding: '12px 24px',
                                    fontWeight: 'bold',
                                    boxShadow: '0 4px 6px -1px rgba(34, 197, 94, 0.4)',
                                    border: '2px solid #22c55e',
                                    transform: 'scale(1.05)'
                                }}
                            >
                                <Save size={20} /> FINALIZAR PROGRAMA
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default MesocycleBuilder;
