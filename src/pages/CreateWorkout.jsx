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
            console.log('CreateWorkout - Loading ID:', id);
            const workoutToEdit = getWorkoutById(id);
            console.log('CreateWorkout - Found:', workoutToEdit);
            if (workoutToEdit) {
                setIsEditing(true);
                setMesocycle(workoutToEdit.meta?.mesocycle || 1);
                setWeek(workoutToEdit.meta?.week || 1);
                console.log('CreateWorkout - Setting Exercises:', workoutToEdit.exercises);
                setExercises(workoutToEdit.exercises || []);
                if (workoutToEdit.date) {
                    setWorkoutDate(new Date(workoutToEdit.date).toISOString().split('T')[0]);
                }
                setCategory(workoutToEdit.category || 'A');
                setObservations(workoutToEdit.observations || '');
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

    const handleSubmit = () => {
        const validExercises = exercises.filter(ex => ex.name.trim() !== '');
        if (validExercises.length === 0) return;

        console.log('CreateWorkout - Submitting Exercises:', validExercises);

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
            navigate('/dashboard'); // Go back to calendar
        } else {
            addWorkout(workoutData);

            // Auto Generate Weeks 2-4 if requested and new
            if (autoGenerate && week === 1) {
                // We need to pass the FULL workout object including the ID we just generated? 
                // Actually addWorkout is void here but the Context updates. 
                // We can pass the workoutData directly to generate.
                generateFullMesocycle(workoutData);
            }
            navigate('/dashboard');
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

                <div className={styles.headerControls}>
                    {/* Date Picker */}
                    <div className={styles.controlGroup}>
                        <label>Data</label>
                        <input
                            type="date"
                            className="input"
                            value={workoutDate}
                            onChange={(e) => setWorkoutDate(e.target.value)}
                        />
                    </div>

                    {/* Category Selector */}
                    <div className={styles.controlGroup}>
                        <label>Tipo</label>
                        <div className={styles.typeSelector}>
                            {['A', 'B', 'C'].map((cat) => (
                                <button
                                    key={cat}
                                    type="button"
                                    onClick={() => setCategory(cat)}
                                    className={clsx(styles.typeBtn, category === cat && styles.activeType)}
                                >
                                    {cat}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Cycle Selectors - Read Only if Editing */}
                    <div className={styles.controlGroup}>
                        <label>Meso</label>
                        <select
                            className="input"
                            value={mesocycle}
                            onChange={(e) => setMesocycle(Number(e.target.value))}
                            disabled={isEditing}
                        >
                            {[1, 2, 3, 4, 5, 6].map(n => <option key={n} value={n}>{n}</option>)}
                        </select>
                    </div>

                    <div className={styles.controlGroup}>
                        <label>Semana</label>
                        <select
                            className="input"
                            value={week}
                            onChange={(e) => setWeek(Number(e.target.value))}
                            disabled={isEditing}
                        >
                            {[1, 2, 3, 4].map(n => <option key={n} value={n}>{n}</option>)}
                        </select>
                    </div>

                    <button
                        className="btn btn-secondary"
                        onClick={() => setIsGuideOpen(true)}
                        title="Guia"
                        style={{ height: '42px', marginTop: 'auto', padding: '0 12px' }}
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
                                        type="text"
                                        inputMode="numeric"
                                        className="input"
                                        placeholder="ex: 8-12"
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
