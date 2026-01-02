import React, { useState, useEffect } from 'react';
import { useWorkout } from '../context/WorkoutContext';
import { useNavigate, useParams } from 'react-router-dom';
import { Plus, Trash2, Save, AlertTriangle, BookOpen, HelpCircle, Layers, Link as LinkIcon } from 'lucide-react';
import clsx from 'clsx';
import Tooltip from '../components/ui/Tooltip';
import Modal from '../components/ui/Modal';
import styles from './CreateWorkout.module.css';

import { useStudent } from '../context/StudentContext';

const TrainingLog = () => {
    const navigate = useNavigate();
    const { id } = useParams(); // Get ID from URL if editing
    const { addWorkout, updateWorkout, getWorkoutById, generateFullMesocycle, getExerciseHistory, getRecentAverageVolume } = useWorkout();
    const { selectedStudentId } = useStudent();

    const [showSafetyToast, setShowSafetyToast] = useState(false);
    const [isGuideOpen, setIsGuideOpen] = useState(false);

    // Edit Mode State
    const [isEditing, setIsEditing] = useState(false);

    // Cycle State
    const [mesocycle, setMesocycle] = useState(1);
    const [week, setWeek] = useState(1);
    const [autoGenerate, setAutoGenerate] = useState(false);
    const [workoutDate, setWorkoutDate] = useState(new Date().toISOString().split('T')[0]); // Default to today YYYY-MM-DD
    const [category, setCategory] = useState('A'); // Default Category A
    const [observations, setObservations] = useState('');

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
                if (workoutToEdit.date) {
                    setWorkoutDate(new Date(workoutToEdit.date).toISOString().split('T')[0]);
                }
                setCategory(workoutToEdit.category || 'A');
                setObservations(workoutToEdit.observations || '');
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

    const addSuperset = (index) => {
        const parent = exercises[index];
        // Generate a new superset ID if one doesn't exist
        const ssid = parent.supersetId || crypto.randomUUID();

        // Update parent if it didn't have one
        const updatedParent = { ...parent, supersetId: ssid };

        const newExercise = {
            id: Date.now() + Math.random(),
            name: '',
            sets: parent.sets, // Copy sets usually
            reps: '',
            load: '',
            rpe: '',
            rir: '',
            supersetId: ssid // Link it
        };

        const newExercises = [...exercises];
        newExercises[index] = updatedParent;
        newExercises.splice(index + 1, 0, newExercise); // Insert after
        setExercises(newExercises);
    };

    const removeRow = (id) => {
        setExercises(prev => {
            const newList = prev.filter(ex => ex.id !== id);
            // Cleanup: check if any superset groups are now orphans (only 1 item left)
            // Optional: Remove supersetId if only 1 remains?
            // Actually, keep it simple. If 1 remains, it's just a normal exercise to the user.
            // But we might want to clean up the ID for visual reasons if we treat single supersetId items purely as normal.
            return newList;
        });
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
            date: new Date(workoutDate).toISOString(),
            status: 'completed', // Mark as done on save
            category, // Save Category
            observations, // Save Observations
            meta: { mesocycle, week },
            studentId: selectedStudentId ? selectedStudentId : null,
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
                    {/* Date Picker */}
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Data</label>
                        <input
                            type="date"
                            className="input"
                            value={workoutDate}
                            onChange={(e) => setWorkoutDate(e.target.value)}
                            style={{ width: '130px' }}
                        />
                    </div>



                    {/* Category Selector */}
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Tipo</label>
                        <div style={{ display: 'flex', gap: '4px', background: '#f1f5f9', padding: '2px', borderRadius: '8px' }}>
                            {['A', 'B', 'C'].map((cat) => (
                                <button
                                    key={cat}
                                    type="button"
                                    onClick={() => setCategory(cat)}
                                    style={{
                                        border: 'none',
                                        padding: '6px 12px',
                                        borderRadius: '6px',
                                        fontSize: '0.8rem',
                                        fontWeight: 700,
                                        cursor: 'pointer',
                                        background: category === cat ? '#fff' : 'transparent',
                                        boxShadow: category === cat ? '0 1px 2px rgba(0,0,0,0.1)' : 'none',
                                        color: category === cat
                                            ? (cat === 'A' ? '#3b82f6' : cat === 'B' ? '#22c55e' : '#f97316')
                                            : '#94a3b8',
                                        transition: 'all 0.2s'
                                    }}
                                >
                                    {cat}
                                </button>
                            ))}
                        </div>
                    </div>

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
            </header >

            {/* Auto Generation Option (Only for Week 1 New Workouts) */}
            {
                !isEditing && week === 1 && (
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
                )
            }

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
            {
                showSafetyToast && (
                    <div className={styles.toast}>
                        <AlertTriangle size={24} />
                        <div>
                            <div>Atenção: Aumento brusco de volume.</div>
                            <div style={{ fontSize: '0.85em', fontWeight: '400' }}>Risco de lesão elevado (&gt;20% vs média).</div>
                        </div>
                    </div>
                )
            }

            <div className={`glass-panel ${styles.tableContainer}`}>
                {/* Table Header - Desktop Only */}
                <div className={`${styles.gridRow} ${styles.desktopHeader}`} style={{ background: 'var(--accent-header)', fontWeight: '600', color: 'var(--text-primary)', borderRadius: '12px 12px 0 0' }}>
                    <div className={styles.colName} style={{ paddingLeft: '1rem' }}>Exercício</div>
                    <div className={styles.colNum}>Séries</div>
                    <div className={styles.colNum}>Reps</div>
                    <div className={styles.colNum}>Carga (kg)</div>

                    <div className={styles.colNum}>
                        <div className={styles.headerWithHelp}>
                            RPE
                            <Tooltip text="Percepção Subjetiva de Esforço (1-10)">
                                <HelpCircle size={14} className={styles.helpIcon} />
                            </Tooltip>
                        </div>
                    </div>

                    <div className={styles.colNum}>
                        <div className={styles.headerWithHelp}>
                            RIR
                            <Tooltip text="Repetições na Reserva">
                                <HelpCircle size={14} className={styles.helpIcon} />
                            </Tooltip>
                        </div>
                    </div>

                    <div className={styles.colVtt}>
                        <div className={styles.headerWithHelp} style={{ justifyContent: 'flex-end' }}>
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

                        // Check if part of a superset group
                        const isSuperset = !!ex.supersetId;
                        const prevIsSame = index > 0 && exercises[index - 1].supersetId === ex.supersetId;
                        const nextIsSame = index < exercises.length - 1 && exercises[index + 1].supersetId === ex.supersetId;

                        // Determine visual structure
                        const isStart = isSuperset && !prevIsSame;
                        const isEnd = isSuperset && !nextIsSame;
                        const isMiddle = isSuperset && prevIsSame && nextIsSame;
                        const isLinked = isSuperset && (prevIsSame || nextIsSame); // Has at least one neighbor

                        return (
                            <div
                                key={ex.id}
                                className={clsx(styles.gridRow, highStress && styles.highStressRow)}
                                style={{
                                    animation: `fadeIn 0.3s ease forwards`,
                                    animationDelay: `${index * 50}ms`,
                                    // Visual indent if linked
                                    marginLeft: isLinked ? '12px' : '0',
                                    borderLeft: isLinked ? '4px solid var(--accent-primary)' : 'none',
                                    borderRadius: isLinked ? (isStart ? '8px 8px 0 0' : (isEnd ? '0 0 8px 8px' : '0')) : '12px',
                                    marginBottom: isLinked && !isEnd ? '0' : '12px' // Merge gap
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
                                            <span className={styles.mobileLabel}>Exercício</span>
                                            <input
                                                type="text"
                                                className="input"
                                                placeholder={isLinked ? (isStart ? "Exercício 1 (Conjugado)" : "Exercício + (Conjugado)") : "Nome do exercício..."}
                                                value={ex.name}
                                                onChange={(e) => updateExercise(ex.id, 'name', e.target.value)}
                                                style={{ fontWeight: '500', width: '100%' }}
                                            />
                                        </div>
                                    </div>
                                </div>
                                <div className={styles.colNum}>
                                    <span className={styles.mobileLabel}>Séries</span>
                                    <input
                                        type="number" className="input" placeholder="0"
                                        value={ex.sets} onChange={(e) => updateExercise(ex.id, 'sets', e.target.value)}
                                    />
                                </div>
                                <div className={styles.colNum}>
                                    <span className={styles.mobileLabel}>Reps</span>
                                    <input
                                        type="number" className="input" placeholder="0"
                                        value={ex.reps} onChange={(e) => updateExercise(ex.id, 'reps', e.target.value)}
                                    />
                                </div>
                                <div className={styles.colNum}>
                                    <span className={styles.mobileLabel}>Carga</span>
                                    <input
                                        type="number" className={clsx("input", ex.suggestProgression && styles.suggestedLoad)}
                                        placeholder="kg"
                                        title={ex.suggestProgression ? "Sugestão: Aumentar Carga" : ""}
                                        value={ex.load} onChange={(e) => updateExercise(ex.id, 'load', e.target.value)}
                                    />
                                </div>
                                <div className={styles.colNum}>
                                    <span className={styles.mobileLabel}>RPE</span>
                                    <input
                                        type="number" min="1" max="10" className="input" placeholder="-"
                                        value={ex.rpe} onChange={(e) => updateExercise(ex.id, 'rpe', e.target.value)}
                                        style={{ borderColor: ex.rpe > 9 ? '#fca5a5' : '' }}
                                    />
                                </div>
                                <div className={styles.colNum}>
                                    <span className={styles.mobileLabel}>RIR</span>
                                    <input
                                        type="number" min="0" className="input" placeholder="-"
                                        value={ex.rir} onChange={(e) => updateExercise(ex.id, 'rir', e.target.value)}
                                    />
                                </div>
                                <div className={styles.colVtt}>
                                    <span className={styles.mobileLabel}>Volume Total</span>
                                    <span style={{ fontWeight: '700', color: '#64748B' }}>
                                        {vtt > 0 ? vtt.toLocaleString() : '-'}
                                    </span>
                                </div>
                                <div className={styles.colAction}>
                                    {/* Action Buttons */}
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                        <button onClick={() => removeRow(ex.id)} className={styles.iconBtn} title="Remover">
                                            <Trash2 size={18} />
                                        </button>
                                        <button
                                            onClick={() => addSuperset(index)}
                                            className={styles.iconBtn}
                                            style={{ color: 'var(--accent-primary)', borderColor: 'var(--accent-primary)' }}
                                            title="Conjulgar (Adicionar Bi-set)"
                                        >
                                            <Plus size={18} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>

                <div className={styles.footerActions}>
                    <button onClick={addRow} className={`btn`} style={{
                        width: '100%',
                        border: '2px dashed #94a3b8',
                        color: '#64748B',
                        padding: '12px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px',
                        borderRadius: '12px',
                        transition: 'all 0.2s',
                        fontWeight: '600'
                    }}
                        onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--accent-primary)'; e.currentTarget.style.color = 'var(--accent-primary)'; e.currentTarget.style.background = '#f0f9ff'; }}
                        onMouseLeave={e => { e.currentTarget.style.borderColor = '#94a3b8'; e.currentTarget.style.color = '#64748B'; e.currentTarget.style.background = 'transparent'; }}
                    >
                        <Plus size={20} /> Adicionar Novo Exercício
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

            {/* Observations Section */}
            <div className="glass-panel" style={{ marginTop: '2rem', padding: '1.5rem' }}>
                <label style={{ display: 'block', fontWeight: 600, color: '#334155', marginBottom: '0.5rem' }}>
                    Observações do Treino
                </label>
                <textarea
                    className="input"
                    value={observations}
                    onChange={(e) => setObservations(e.target.value)}
                    placeholder="Como foi o treino? Alguma dor, recorde ou ajuste de carga?"
                    rows={4}
                    style={{ width: '100%', resize: 'vertical', minHeight: '100px' }}
                />
            </div>

            <div className={styles.pageActions}>
                <button onClick={handleSubmit} className="btn btn-primary" style={{ minWidth: '200px', fontSize: '1.1rem' }}>
                    <Save size={20} style={{ marginRight: '8px' }} /> {isEditing ? 'Atualizar Treino' : 'Salvar Ciclo'}
                </button>
            </div>
        </div >
    );
};

export default TrainingLog;
