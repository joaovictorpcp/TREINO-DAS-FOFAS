import React, { useState, useEffect } from 'react';
import { useWorkout } from '../context/WorkoutContext';
import { useNavigate, useParams } from 'react-router-dom';
import { Plus, Trash2, Save, AlertTriangle, BookOpen, HelpCircle, Layers } from 'lucide-react';
import clsx from 'clsx';
import Tooltip from '../components/ui/Tooltip';
import Modal from '../components/ui/Modal';
import styles from './CreateWorkout.module.css';

const TrainingLog = () => {
    const navigate = useNavigate();
    const { id } = useParams(); // Get ID from URL if editing
    const { addWorkout, updateWorkout, getWorkoutById, generateFullMesocycle, getExerciseHistory, getRecentAverageVolume } = useWorkout();

    const [showSafetyToast, setShowSafetyToast] = useState(false);
    const [isGuideOpen, setIsGuideOpen] = useState(false);

    // Edit Mode State
    const [isEditing, setIsEditing] = useState(false);

    // Cycle State
    const [mesocycle, setMesocycle] = useState(1);
    const [week, setWeek] = useState(1);
    const [autoGenerate, setAutoGenerate] = useState(false);

    const [exercises, setExercises] = useState([
        { id: Date.now(), name: '', sets: '', reps: '', load: '', rpe: '', rir: '', suggestProgression: false }
    ]);

    // Load Data if Editing
    useEffect(() => {
        if (id) {
            const workoutToEdit = getWorkoutById(id);
            if (workoutToEdit) {
                setIsEditing(true);
                setMesocycle(workoutToEdit.meta?.mesocycle || 1);
                setWeek(workoutToEdit.meta?.week || 1);
                setExercises(workoutToEdit.exercises || []);
            }
        }
    }, [id, getWorkoutById]);

    // Check for progression suggestion when name changes
    const checkProgression = (name) => {
        if (!name) return false;
        const history = getExerciseHistory(name);
        if (history.length >= 2) {
            const last1 = parseFloat(history[0].rpe);
            const last2 = parseFloat(history[1].rpe);
            return (last1 <= 7 && last2 <= 7);
        }
        return false;
    };

    const updateExercise = (id, field, value) => {
        setExercises(prev => prev.map(ex => {
            if (ex.id === id) {
                const updated = { ...ex, [field]: value };
                // If name changes, re-check progression
                if (field === 'name') {
                    updated.suggestProgression = checkProgression(value);
                }
                return updated;
            }
            return ex;
        }));
    };

    // Safety Check Effect
    useEffect(() => {
        const currentTotalVTT = exercises.reduce((acc, ex) => {
            return acc + calculateVTT(ex.sets, ex.reps, ex.load);
        }, 0);

        const avgVol = getRecentAverageVolume(3);

        // Only trigger if avgVol exists (not first workout) and spike is > 20%
        if (avgVol > 0 && currentTotalVTT > avgVol * 1.2) {
            setShowSafetyToast(true);
        } else {
            setShowSafetyToast(false);
        }
    }, [exercises]);

    const addRow = () => {
        setExercises([...exercises, { id: Date.now(), name: '', sets: '', reps: '', load: '', rpe: '', rir: '' }]);
    };

    const removeRow = (id) => {
        setExercises(prev => prev.filter(ex => ex.id !== id));
    };

    const calculateVTT = (sets, reps, load) => {
        const s = parseFloat(sets) || 0;
        const r = parseFloat(reps) || 0;
        const l = parseFloat(load) || 0;
        return s * r * l;
    };

    const isHighStress = (rpe, rir) => {
        return parseFloat(rpe) === 10 && parseFloat(rir) === 0;
    };

    const handleSubmit = () => {
        const validExercises = exercises.filter(ex => ex.name.trim() !== '');
        if (validExercises.length === 0) return;

        const workoutData = {
            type: 'log',
            date: new Date().toISOString(),
            status: 'completed', // Mark as done on save
            meta: { mesocycle, week },
            exercises: validExercises.map(ex => ({
                ...ex,
                vtt: calculateVTT(ex.sets, ex.reps, ex.load)
            }))
        };

        if (isEditing && id) {
            updateWorkout(id, workoutData);
            navigate('/workouts'); // Go back to list
        } else {
            addWorkout(workoutData);

            // Auto Generate Weeks 2-4 if requested and new
            if (autoGenerate && week === 1) {
                // We need to pass the FULL workout object including the ID we just generated? 
                // Actually addWorkout is void here but the Context updates. 
                // We can pass the workoutData directly to generate.
                generateFullMesocycle(workoutData);
            }
            navigate('/workouts');
        }
    };

    return (
        <div className="page-container animate-fade-in">
            {/* Header with Title and Cycle Controls */}
            <header className={styles.header}>
                <div style={{ flex: 1 }}>
                    <h1 className={styles.title}>{isEditing ? 'Preencher Treino' : 'Novo Ciclo'}</h1>
                    <p className={styles.subtitle}>
                        {isEditing ? `Mesociclo ${mesocycle} • Semana ${week}` : 'Crie a base da semana 1'}
                    </p>
                </div>

                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                    {/* Cycle Selectors - Read Only if Editing */}
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Mesociclo</label>
                        <select
                            className="input"
                            value={mesocycle}
                            onChange={(e) => setMesocycle(Number(e.target.value))}
                            style={{ width: '80px' }}
                            disabled={isEditing}
                        >
                            {[1, 2, 3, 4, 5, 6].map(n => <option key={n} value={n}>{n}</option>)}
                        </select>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Semana</label>
                        <select
                            className="input"
                            value={week}
                            onChange={(e) => setWeek(Number(e.target.value))}
                            style={{ width: '80px' }}
                            disabled={isEditing}
                        >
                            {[1, 2, 3, 4].map(n => <option key={n} value={n}>{n}</option>)}
                        </select>
                    </div>

                    <button
                        className="btn btn-secondary"
                        style={{ background: '#fff', border: '1px solid var(--border-subtle)', height: '42px', marginTop: 'auto' }}
                        onClick={() => setIsGuideOpen(true)}
                    >
                        <BookOpen size={18} />
                    </button>
                </div>
            </header>

            {/* Auto Generation Option (Only for Week 1 New Workouts) */}
            {!isEditing && week === 1 && (
                <div className="glass-panel" style={{ marginBottom: '20px', padding: '15px', display: 'flex', alignItems: 'center', gap: '10px', border: '1px solid var(--accent-primary)' }}>
                    <input
                        type="checkbox"
                        id="autoGen"
                        checked={autoGenerate}
                        onChange={(e) => setAutoGenerate(e.target.checked)}
                        style={{ width: '18px', height: '18px' }}
                    />
                    <label htmlFor="autoGen" style={{ fontWeight: 500, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Layers size={18} color="var(--accent-primary)" />
                        Gerar automaticamente as próximas 3 semanas? (Replica os exercícios)
                    </label>
                </div>
            )}

            {/* Guide Modal */}
            <Modal isOpen={isGuideOpen} onClose={() => setIsGuideOpen(false)} title="Como usar o Diário">
                <div style={{ color: '#475569', lineHeight: '1.6' }}>
                    <p>Bem-vindo ao sistema de monitoramento profissional.</p>

                    <h3 style={{ color: '#1e293b', marginTop: '20px' }}>1. Automação</h3>
                    <p>Ao criar a <strong>Semana 1</strong>, marque a caixa "Gerar 3 semanas" para criar a estrutura do mês todo automaticamente.</p>

                    <h3 style={{ color: '#1e293b', marginTop: '20px' }}>2. Preenchimento</h3>
                    <p>Acesse a aba <strong>"Treinos"</strong> para ver as semanas pendentes. Clique em uma para preencher os dados do dia.</p>

                    {/* ... other instructions keep existing ... */}
                    <h3 style={{ color: '#1e293b', marginTop: '20px' }}>3. Escalas Inteligentes</h3>
                    <ul style={{ paddingLeft: '20px' }}>
                        <li><strong>RPE (1-10):</strong> Nível de Esforço. 10 é máximo. Hipertrofia ideal: 7-9.</li>
                        <li><strong>RIR:</strong> Repetições na Reserva. Quantas você "aguentaria" fazer a mais.</li>
                    </ul>
                </div>
            </Modal>

            {/* Safety Toast */}
            {showSafetyToast && (
                <div className={styles.toast}>
                    <AlertTriangle size={24} />
                    <div>
                        <div>Atenção: Aumento brusco de volume.</div>
                        <div style={{ fontSize: '0.85em', fontWeight: '400' }}>Risco de lesão elevado (&gt;20% vs média).</div>
                    </div>
                </div>
            )}

            <div className={`glass-panel ${styles.tableContainer}`}>
                {/* Table Header */}
                <div className={styles.gridRow} style={{ background: 'var(--accent-header)', fontWeight: '600', color: 'var(--text-primary)' }}>
                    <div className={styles.colName}>Exercício</div>
                    <div className={styles.colNum}>Séries</div>
                    <div className={styles.colNum}>Reps</div>
                    <div className={styles.colNum}>Carga (kg)</div>

                    <div className={styles.colNum}>
                        <div className={styles.headerWithHelp}>
                            RPE
                            <Tooltip text="Percepção Subjetiva de Esforço (1-10). 10 = Máximo. 7-9 = Ideal para Hipertrofia.">
                                <HelpCircle size={14} className={styles.helpIcon} />
                            </Tooltip>
                        </div>
                    </div>

                    <div className={styles.colNum}>
                        <div className={styles.headerWithHelp}>
                            RIR
                            <Tooltip text="Repetições na Reserva. Quantas reps você faria antes da falha. 0 = Falha.">
                                <HelpCircle size={14} className={styles.helpIcon} />
                            </Tooltip>
                        </div>
                    </div>

                    <div className={styles.colVtt}>
                        <div className={styles.headerWithHelp} style={{ justifyContent: 'flex-end' }}>
                            Vol. Total
                            <Tooltip text="Volume de Carga (Séries x Reps x Peso). Indica o trabalho total realizado.">
                                <HelpCircle size={14} className={styles.helpIcon} />
                            </Tooltip>
                        </div>
                    </div>

                    <div className={styles.colAction}></div>
                </div>

                {/* Rows */}
                <div className={styles.rowsContainer}>
                    {exercises.map((ex) => {
                        const vtt = calculateVTT(ex.sets, ex.reps, ex.load);
                        const highStress = isHighStress(ex.rpe, ex.rir);

                        return (
                            <div
                                key={ex.id}
                                className={clsx(styles.gridRow, highStress && styles.highStressRow)}
                            >
                                <div className={styles.colName}>
                                    <input
                                        type="text"
                                        className="input"
                                        placeholder="Nome do exercício"
                                        value={ex.name}
                                        onChange={(e) => updateExercise(ex.id, 'name', e.target.value)}
                                    />
                                </div>
                                <div className={styles.colNum}>
                                    <input
                                        type="number" className="input" placeholder="0"
                                        value={ex.sets} onChange={(e) => updateExercise(ex.id, 'sets', e.target.value)}
                                    />
                                </div>
                                <div className={styles.colNum}>
                                    <input
                                        type="number" className="input" placeholder="0"
                                        value={ex.reps} onChange={(e) => updateExercise(ex.id, 'reps', e.target.value)}
                                    />
                                </div>
                                <div className={styles.colNum}>
                                    <input
                                        type="number" className={clsx("input", ex.suggestProgression && styles.suggestedLoad)}
                                        placeholder="0"
                                        title={ex.suggestProgression ? "Sugestão: Aumentar Carga (RPE baixo nos últimos treinos)" : ""}
                                        value={ex.load} onChange={(e) => updateExercise(ex.id, 'load', e.target.value)}
                                    />
                                </div>
                                <div className={styles.colNum}>
                                    <input
                                        type="number" min="1" max="10" className="input" placeholder="-"
                                        value={ex.rpe} onChange={(e) => updateExercise(ex.id, 'rpe', e.target.value)}
                                    />
                                </div>
                                <div className={styles.colNum}>
                                    <input
                                        type="number" min="0" className="input" placeholder="-"
                                        value={ex.rir} onChange={(e) => updateExercise(ex.id, 'rir', e.target.value)}
                                    />
                                </div>
                                <div className={styles.colVtt}>
                                    {vtt > 0 ? vtt.toLocaleString() : '-'}
                                </div>
                                <div className={styles.colAction}>
                                    <button onClick={() => removeRow(ex.id)} className={styles.iconBtn}>
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>

                <div className={styles.footerActions}>
                    <button onClick={addRow} className={`btn btn-secondary ${styles.addBtn}`}>
                        <Plus size={18} /> Adicionar Exercício
                    </button>
                </div>
            </div>

            {/* Legend Bar */}
            <div className={styles.legendBar}>
                <div className={styles.legendItem}>
                    <div className={styles.colorBox} style={{ background: '#FFF', border: '1px solid #E2E8F0' }}></div>
                    <span>Zona Segura</span>
                </div>
                <div className={styles.legendItem}>
                    <div className={styles.colorBox} style={{ background: '#FFF', borderColor: '#98FF98', borderWidth: '2px' }}></div>
                    <span>Sugestão de Progressão</span>
                </div>
                <div className={styles.legendItem}>
                    <div className={styles.colorBox} style={{ background: '#FFB7B2' }}></div>
                    <span>Alerta de Falha/Risco</span>
                </div>
            </div>

            <div className={styles.pageActions}>
                <button onClick={handleSubmit} className="btn btn-primary" style={{ minWidth: '200px', fontSize: '1.1rem' }}>
                    <Save size={20} style={{ marginRight: '8px' }} /> {isEditing ? 'Atualizar Treino' : 'Salvar Ciclo'}
                </button>
            </div>
        </div>
    );
};

export default TrainingLog;
