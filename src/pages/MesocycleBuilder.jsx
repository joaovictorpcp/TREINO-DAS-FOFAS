import React, { useState } from 'react';
import { useWorkout } from '../context/WorkoutContext';
import { useStudent } from '../context/StudentContext';
import { useNavigate } from 'react-router-dom';
import { Plus, Trash2, Save, ArrowRight, ArrowLeft, Dumbbell, Footprints, Bike, Waves, Clock, Activity, MapPin, AlignLeft, Link } from 'lucide-react';
import styles from './MesocycleBuilder.module.css';

// ── Cores por letra de bloco (A, B, C, D...) ──
const BLOCK_COLORS = {
    A: '#CCFF00', // accent-primary (verde neon)
    B: '#00B0FF', // azul elétrico
    C: '#FFC400', // amarelo
    D: '#FF3D00', // vermelho neon
    E: '#E040FB', // roxo
    F: '#00E5FF', // ciano
};

/**
 * Retorna a cor correspondente à letra do bloco.
 * Se a letra não estiver mapeada, retorna accent-primary por padrão.
 */
const getBlockColor = (blockLabel) => {
    if (!blockLabel) return BLOCK_COLORS.A;
    const letter = blockLabel.charAt(0).toUpperCase();
    return BLOCK_COLORS[letter] || BLOCK_COLORS.A;
};

const MesocycleBuilder = () => {
    const { createMesocycle } = useWorkout();
    const { selectedStudentId } = useStudent();
    const navigate = useNavigate();

    const [step, setStep] = useState(1); // 1: Config, 2: Base Week

    // ── Configuração do mesociclo ──
    const [config, setConfig] = useState({
        name: '',
        weeks: 4,
        startDate: new Date().toISOString().split('T')[0],
        activityType: 'weightlifting' // Default
    });

    // ── Treinos base com campo subtitle ──
    const [baseWorkouts, setBaseWorkouts] = useState([
        { id: 'A', name: 'Treino A', subtitle: '', exercises: [], duration: '', distance: '', rpe: '', drills: '', mainSet: '', scheduledDays: [] }
    ]);

    const [activeTab, setActiveTab] = useState('A');

    // ── Controle de bloco para auto-atribuição (A1, A2, B1...) ──
    const [blockTrackers, setBlockTrackers] = useState({
        // Rastreia por aba de treino: { 'A': { letter: 'A', number: 1 }, 'B': ... }
        'A': { letter: 'A', number: 1 }
    });

    // ── Estado do novo exercício (schema atualizado) ──
    const [newExercise, setNewExercise] = useState({
        name: '', sets: '3', reps: '8-12', rest: '60s', targetRpe: '7-8', block: ''
    });

    if (!selectedStudentId) {
        return <div className="p-8 text-center">Selecione um aluno primeiro.</div>;
    }

    // ── Obtém o tracker de bloco atual para a aba ativa ──
    const getCurrentTracker = () => {
        return blockTrackers[activeTab] || { letter: 'A', number: 1 };
    };

    // ── Avança para o próximo bloco (A→B→C...) ──
    const handleNewBlock = () => {
        setBlockTrackers(prev => {
            const current = prev[activeTab] || { letter: 'A', number: 1 };
            const nextLetter = String.fromCharCode(current.letter.charCodeAt(0) + 1);
            return { ...prev, [activeTab]: { letter: nextLetter, number: 1 } };
        });
    };

    // ── Adicionar aba de treino ──
    const handleAddWorkoutTab = () => {
        const nextLetter = String.fromCharCode(65 + baseWorkouts.length); // A, B, C...
        const newTabId = nextLetter;
        setBaseWorkouts([...baseWorkouts, {
            id: newTabId,
            name: `Treino ${nextLetter}`,
            subtitle: '',
            exercises: [],
            duration: '',
            distance: '',
            rpe: '',
            drills: '',
            mainSet: '',
            scheduledDays: []
        }]);
        // Inicializa o tracker de bloco para a nova aba
        setBlockTrackers(prev => ({ ...prev, [newTabId]: { letter: 'A', number: 1 } }));
        setActiveTab(newTabId);
    };

    // ── Alterar campo de treino base ──
    const handleBaseWorkoutChange = (workoutId, field, value) => {
        setBaseWorkouts(prev => prev.map(w => {
            if (w.id === workoutId) {
                return { ...w, [field]: value };
            }
            return w;
        }));
    };

    // ── Adicionar exercício com auto-block ──
    const handleAddExercise = () => {
        const tracker = getCurrentTracker();
        const autoBlock = `${tracker.letter}${tracker.number}`;

        setBaseWorkouts(prev => prev.map(w => {
            if (w.id === activeTab) {
                return {
                    ...w,
                    exercises: [...w.exercises, {
                        id: crypto.randomUUID(),
                        block: autoBlock,
                        name: '',
                        sets: '3',
                        reps: '8-12',
                        rest: '60s',
                        targetRpe: '7-8',
                    }]
                };
            }
            return w;
        }));

        // Incrementa o número do bloco
        setBlockTrackers(prev => ({
            ...prev,
            [activeTab]: { ...tracker, number: tracker.number + 1 }
        }));
    };

    // ── Remover exercício ──
    const handleRemoveExercise = (workoutId, exerciseId) => {
        setBaseWorkouts(prev => prev.map(w => {
            if (w.id === workoutId) {
                return { ...w, exercises: w.exercises.filter(e => e.id !== exerciseId) };
            }
            return w;
        }));
    };

    // ── Gerar mesociclo (validação e envio) ──
    const handleGenerate = () => {
        console.log("handleGenerate: Started");
        console.log("Config:", config);

        // Validação básica
        if (!config.name) {
            alert('Preencha o nome do programa.');
            return;
        }

        if (!config.startDate) {
            alert('Selecione uma data de início.');
            return;
        }

        // Validação específica por modalidade
        if (config.activityType === 'weightlifting') {
            if (baseWorkouts.some(w => w.exercises.length === 0)) {
                alert('Adicione exercícios em todos os treinos de musculação.');
                return;
            }
        } else {
            if (baseWorkouts.some(w => !w.duration && !w.distance)) {
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

    // ── Adicionar exercício conjugado (superset/bi-set) ──
    const handleAddSupersetExercise = (workoutId, insertAtIndex) => {
        setBaseWorkouts(prev => prev.map(w => {
            if (w.id === workoutId) {
                const parent = w.exercises[insertAtIndex];
                const ssid = parent.supersetId || crypto.randomUUID();

                // Atualiza o pai com o supersetId
                const updatedParent = { ...parent, supersetId: ssid };

                // Novo exercício encadeado — herda o bloco do pai
                const chainedExercise = {
                    id: crypto.randomUUID(),
                    block: parent.block || '',
                    name: '',
                    sets: parent.sets,
                    reps: parent.reps,
                    rest: parent.rest || '0s',
                    targetRpe: parent.targetRpe || '',
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

    // ── Alterar campo de exercício individual ──
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

    // Treino ativo no momento
    const currentWorkout = baseWorkouts.find(w => w.id === activeTab) || baseWorkouts[0];

    return (
        <div className={`page-container animate-fade-in ${styles.container}`}>
            <header className={styles.header}>
                <h1 className={styles.title} style={{ color: 'var(--text-primary)' }}>Novo Programa</h1>
                <p className={styles.subtitle} style={{ color: 'var(--text-secondary)' }}>Construtor de Mesociclo</p>

                {/* Barras de progresso */}
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
                {/* ════════════════════════════════════════
                    ETAPA 1: CONFIGURAÇÃO (SEM ALTERAÇÕES)
                   ════════════════════════════════════════ */}
                {step === 1 && (
                    <div className="animate-fade-in">
                        <h2 style={{ fontSize: '1.2rem', fontWeight: 600, marginBottom: '1.5rem', color: 'var(--text-primary)' }}>Etapa 1: Criar</h2>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

                            {/* SELETOR DE MODALIDADE */}
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

                {/* ════════════════════════════════════════
                    ETAPA 2: PLANEJAR BASE SEMANAL (REESCRITA)
                   ════════════════════════════════════════ */}
                {step === 2 && (
                    <div className="animate-slide-in">
                        {/* Cabeçalho da etapa */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                            <div className="flex items-center gap-4">
                                <h2 style={{ fontSize: '1.2rem', fontWeight: 600, color: 'var(--text-primary)' }}>Etapa 2: Planejar Base Semanal</h2>
                            </div>

                            <button type="button" onClick={() => setStep(1)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <ArrowLeft size={16} /> Voltar
                            </button>
                        </div>

                        {/* ── Abas de Treino ── */}
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

                        {/* ── Seletor de Dias da Semana ── */}
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
                                    const cw = baseWorkouts.find(w => w.id === activeTab);
                                    const isSelected = cw?.scheduledDays?.includes(day.id);

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

                        {/* ── Conteúdo do Treino Ativo ── */}
                        <div style={{ background: 'rgba(20, 20, 20, 0.4)', borderRadius: '12px', padding: '1.5rem', marginBottom: '1.5rem', border: '1px solid var(--border-subtle)' }}>

                            {/* Nome do treino */}
                            <div style={{ marginBottom: '1rem' }}>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Nome do Treino</label>
                                <input
                                    type="text"
                                    value={currentWorkout?.name || ''}
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

                            {/* Subtítulo do treino (NOVO) */}
                            <div style={{ marginBottom: '1.5rem' }}>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500, color: 'var(--text-muted)', fontSize: '0.85rem' }}>Subtítulo (Opcional)</label>
                                <input
                                    type="text"
                                    value={currentWorkout?.subtitle || ''}
                                    onChange={(e) => handleBaseWorkoutChange(activeTab, 'subtitle', e.target.value)}
                                    placeholder="Ex: Dominância de Quadril & Retração Escapular"
                                    className={styles.subtitleInput}
                                />
                            </div>

                            {/* ── Banner colorido do treino ── */}
                            <div
                                className={styles.trainingHeader}
                                style={{ borderLeft: `4px solid ${getBlockColor(activeTab)}` }}
                            >
                                <span className={styles.trainingHeaderTitle}>
                                    {currentWorkout?.name || `Treino ${activeTab}`}
                                    {currentWorkout?.subtitle && (
                                        <span className={styles.trainingHeaderSubtitle}>
                                            {' — '}{currentWorkout.subtitle}
                                        </span>
                                    )}
                                </span>
                            </div>

                            {/* ── CONTEÚDO CONDICIONAL POR MODALIDADE ── */}
                            {config.activityType === 'weightlifting' ? (
                                <>
                                    {/* ════════════════════════════════════
                                        TABELA PLANILHA — MUSCULAÇÃO
                                       ════════════════════════════════════ */}

                                    {currentWorkout.exercises.length === 0 ? (
                                        /* Estado vazio */
                                        <div className={styles.spreadsheetTable}>
                                            <div className={styles.emptyMessage}>
                                                Nenhum exercício adicionado ainda. Clique em "+ Adicionar Exercício" abaixo.
                                            </div>
                                        </div>
                                    ) : (
                                        /* Tabela com exercícios */
                                        <div className={styles.spreadsheetTable}>
                                            {/* Cabeçalho da tabela (desktop only, escondido no mobile via CSS) */}
                                            <div className={styles.spreadsheetHeader}>
                                                <span>Bloco</span>
                                                <span>Exercício</span>
                                                <span>Séries</span>
                                                <span>Repetições</span>
                                                <span>Descanso</span>
                                                <span>PSE Alvo</span>
                                                <span style={{ textAlign: 'center' }}>Ações</span>
                                            </div>

                                            {/* Linhas de exercícios */}
                                            {currentWorkout.exercises.map((ex, index, arr) => {
                                                // ── Lógica de superset (conjugado) ──
                                                const isSuperset = !!ex.supersetId;
                                                const prevIsSame = index > 0 && arr[index - 1].supersetId === ex.supersetId;
                                                const nextIsSame = index < arr.length - 1 && arr[index + 1].supersetId === ex.supersetId;
                                                const isLinked = isSuperset && (prevIsSame || nextIsSame);

                                                // Cor do bloco baseada na primeira letra
                                                const blockColor = getBlockColor(ex.block);

                                                return (
                                                    <div
                                                        key={ex.id}
                                                        className={`${styles.spreadsheetRow} ${isLinked ? styles.spreadsheetRowSuperset : ''}`}
                                                    >
                                                        {/* ── LAYOUT DESKTOP (via CSS Grid) ── */}

                                                        {/* Coluna: Bloco */}
                                                        <div>
                                                            <span
                                                                className={styles.blockBadge}
                                                                style={{
                                                                    color: blockColor,
                                                                    background: `${blockColor}15`,
                                                                    border: `1px solid ${blockColor}40`
                                                                }}
                                                            >
                                                                {ex.block || '—'}
                                                            </span>
                                                        </div>

                                                        {/* Coluna: Nome do exercício */}
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                            <input
                                                                type="text"
                                                                value={ex.name}
                                                                onChange={(e) => handleExerciseChange(activeTab, ex.id, 'name', e.target.value)}
                                                                className={styles.cellInputName}
                                                                placeholder="Nome do exercício"
                                                            />
                                                            {isLinked && <span className={styles.supersetBadge}>Conj.</span>}
                                                        </div>

                                                        {/* Coluna: Séries */}
                                                        <div>
                                                            <input
                                                                type="text"
                                                                value={ex.sets}
                                                                onChange={(e) => handleExerciseChange(activeTab, ex.id, 'sets', e.target.value)}
                                                                className={styles.cellInputSmall}
                                                                placeholder="3"
                                                            />
                                                        </div>

                                                        {/* Coluna: Repetições */}
                                                        <div>
                                                            <input
                                                                type="text"
                                                                value={ex.reps}
                                                                onChange={(e) => handleExerciseChange(activeTab, ex.id, 'reps', e.target.value)}
                                                                className={styles.cellInputSmall}
                                                                placeholder="8-12"
                                                            />
                                                        </div>

                                                        {/* Coluna: Descanso */}
                                                        <div>
                                                            <input
                                                                type="text"
                                                                value={ex.rest || ''}
                                                                onChange={(e) => handleExerciseChange(activeTab, ex.id, 'rest', e.target.value)}
                                                                className={styles.cellInputSmall}
                                                                placeholder="60s"
                                                            />
                                                        </div>

                                                        {/* Coluna: PSE Alvo */}
                                                        <div>
                                                            <input
                                                                type="text"
                                                                value={ex.targetRpe || ''}
                                                                onChange={(e) => handleExerciseChange(activeTab, ex.id, 'targetRpe', e.target.value)}
                                                                className={styles.cellInputSmall}
                                                                placeholder="7-8"
                                                            />
                                                        </div>

                                                        {/* Coluna: Ações */}
                                                        <div className={styles.actionCell}>
                                                            <button
                                                                onClick={() => handleAddSupersetExercise(activeTab, index)}
                                                                title="Adicionar exercício conjugado (Bi-set/Tri-set)"
                                                                className={styles.supersetBtn}
                                                            >
                                                                <Link size={14} />
                                                            </button>
                                                            <button
                                                                onClick={() => handleRemoveExercise(activeTab, ex.id)}
                                                                title="Remover exercício"
                                                                className={styles.actionBtn}
                                                            >
                                                                <Trash2 size={14} />
                                                            </button>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}

                                    {/* ── Barra de ações: Novo Bloco + Adicionar Exercício ── */}
                                    <div className={styles.tableActions}>
                                        <button
                                            onClick={handleNewBlock}
                                            className={styles.newBlockBtn}
                                            title="Iniciar novo bloco de exercícios"
                                        >
                                            <Plus size={14} />
                                            Novo Bloco ({String.fromCharCode(
                                                (getCurrentTracker().letter.charCodeAt(0)) + 1
                                            )})
                                        </button>
                                    </div>

                                    <button
                                        onClick={handleAddExercise}
                                        className={styles.addRowBtn}
                                    >
                                        <Plus size={16} />
                                        Adicionar Exercício ({getCurrentTracker().letter}{getCurrentTracker().number})
                                    </button>
                                </>
                            ) : (
                                /* ════════════════════════════════════
                                   FORMULÁRIO CARDIO (Corrida, Ciclismo, Natação)
                                   ════════════════════════════════════ */
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

                        {/* ── Botão Finalizar ── */}
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
