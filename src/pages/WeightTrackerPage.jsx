import React, { useState, useMemo } from 'react';
import { useStudent } from '../context/StudentContext';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Scale, TrendingUp, TrendingDown, Minus, Calendar, PlusCircle, Trash2, Edit2, X, Activity, Ruler, UserCheck, AlertCircle } from 'lucide-react';
import BodyMetricsPDFExport from '../components/BodyMetrics/BodyMetricsPDFExport';

import styles from './WeightTrackerPage.module.css';

const WeightTrackerPage = () => {
    const { selectedStudentId, students, bodyMetrics, addBodyMetric, deleteBodyMetric, updateBodyMetric, updateStudent } = useStudent();
    const [weightInput, setWeightInput] = useState('');
    const [dateInput, setDateInput] = useState(new Date().toISOString().split('T')[0]);

    // Pollock 7 Skinfolds State
    const [skinfolds, setSkinfolds] = useState({
        chest: '',           // Peitoral
        axilla: '',          // Axilar Média
        triceps: '',         // Tríceps
        subscapular: '',     // Subescapular
        abdomen: '',         // Abdominal
        suprailiac: '',      // Supra-ilíaca
        thigh: ''            // Coxa
    });

    // Perimetry (Circumferences) State
    const [circumferences, setCircumferences] = useState({
        neck: '',
        shoulder: '',
        chest: '',
        armRight: '',
        armLeft: '',
        forearmRight: '',
        forearmLeft: '',
        waist: '',
        abdomen: '',
        hips: '',
        thighRight: '',
        thighLeft: '',
        calfRight: '',
        calfLeft: ''
    });

    const [isSaving, setIsSaving] = useState(false);

    const [editingId, setEditingId] = useState(null);

    const [activeChart, setActiveChart] = useState('weight'); // 'weight', 'bodyFat', 'perimetry'
    const [selectedPerimetry, setSelectedPerimetry] = useState('waist'); // Default metric for perimetry chart

    // Modal de Edição de Dados Biométricos do Atleta
    const [isBioModalOpen, setIsBioModalOpen] = useState(false);
    const [editGender, setEditGender] = useState('female');
    const [editBirthDate, setEditBirthDate] = useState('');
    const [isSavingBio, setIsSavingBio] = useState(false);

    const currentStudent = students.find(s => s.id === selectedStudentId);

    // Get stats for this student
    const studentMetrics = useMemo(() => {
        if (!selectedStudentId) return [];
        return bodyMetrics
            .filter(m => m.studentId === selectedStudentId)
            .sort((a, b) => new Date(a.date) - new Date(b.date));
    }, [bodyMetrics, selectedStudentId]);

    const latestMetric = studentMetrics.length > 0 ? studentMetrics[studentMetrics.length - 1] : null;

    // Calculate Change
    // Calculate Change
    // const totalChange = latestMetric && startMetric
    //     ? (latestMetric.weight - startMetric.weight).toFixed(1)
    //     : '0.0';

    // --- POLLOCK 7 CALCULATION (Jackson & Pollock 7 Dobras + Siri) ---
    const calculateBodyDensityAndFat = (folds, age, gender) => {
        const requiredKeys = ['chest', 'axilla', 'triceps', 'subscapular', 'abdomen', 'suprailiac', 'thigh'];
        
        // Verifica se todas as 7 dobras foram preenchidas com valores válidos (> 0)
        const filledFolds = requiredKeys.filter(k => folds[k] !== '' && !isNaN(parseFloat(folds[k])));
        if (filledFolds.length < 7) {
            return {
                density: 0,
                fat: null,
                sum7: 0,
                isComplete: false,
                missingCount: 7 - filledFolds.length
            };
        }

        const sum7 = requiredKeys.reduce((acc, k) => acc + (parseFloat(folds[k]) || 0), 0);
        if (sum7 <= 0) return { density: 0, fat: null, sum7: 0, isComplete: false };

        const validAge = (age !== null && age !== undefined && !isNaN(age) && age > 0) ? Number(age) : 25;
        let density = 0;

        if (gender === 'female') {
            // Jackson, Pollock & Ward (1980) - Mulheres 7 Dobras
            density = 1.0970 - (0.00046971 * sum7) + (0.00000056 * Math.pow(sum7, 2)) - (0.00012828 * validAge);
        } else {
            // Jackson & Pollock (1978) - Homens 7 Dobras
            density = 1.1120 - (0.00043499 * sum7) + (0.00000055 * Math.pow(sum7, 2)) - (0.00028826 * validAge);
        }

        // Equação de Siri (1961) - Padrão Ouro Internacional
        let fatPercentage = (495 / density) - 450;
        fatPercentage = Math.max(3, Math.min(65, fatPercentage));

        return {
            density: parseFloat(density.toFixed(5)),
            fat: parseFloat(fatPercentage.toFixed(2)),
            sum7: parseFloat(sum7.toFixed(1)),
            isComplete: true
        };
    };

    // Calculate age helper
    const getAge = (birthDateString) => {
        if (!birthDateString) return null;
        const today = new Date();
        const birthDate = new Date(birthDateString);
        if (isNaN(birthDate.getTime())) return null;
        let age = today.getFullYear() - birthDate.getFullYear();
        const m = today.getMonth() - birthDate.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
            age--;
        }
        return age >= 0 ? age : null;
    };



    // Helper to format date string (YYYY-MM-DD) to DD/MM/YYYY without timezone conversion
    const formatDateUser = (dateString) => {
        if (!dateString) return '-';
        const [year, month, day] = dateString.split('-');
        return `${day}/${month}/${year}`;
    };

    const handleAddWeight = async (e) => {
        e.preventDefault();
        if (!weightInput || !selectedStudentId) return;

        setIsSaving(true);
        // Auto Calculate Body Fat if skinfolds are present
        const hasSkinfolds = Object.values(skinfolds).some(v => v !== '');
        let calculatedFat = null;

        if (hasSkinfolds) {
            const studentBirthDate = currentStudent?.birthDate || currentStudent?.birth_date;
            const age = getAge(studentBirthDate);
            const gender = currentStudent?.gender || 'female';
            const result = calculateBodyDensityAndFat(skinfolds, age, gender);
            if (result.isComplete && result.fat !== null && !isNaN(result.fat) && result.fat > 0 && result.fat < 100) {
                calculatedFat = result.fat;
            }
        }

        let success = false;
        if (editingId) {
            success = await updateBodyMetric(editingId, weightInput, dateInput, skinfolds, calculatedFat, circumferences);
        } else {
            success = await addBodyMetric(selectedStudentId, weightInput, dateInput, skinfolds, calculatedFat, circumferences);
        }

        setIsSaving(false);

        if (success) {
            // Reset Form
            setEditingId(null);
            setWeightInput('');
            setDateInput(new Date().toISOString().split('T')[0]);
            setSkinfolds({ chest: '', axilla: '', triceps: '', subscapular: '', abdomen: '', suprailiac: '', thigh: '' });
            setCircumferences({ neck: '', shoulder: '', chest: '', armRight: '', armLeft: '', forearmRight: '', forearmLeft: '', waist: '', abdomen: '', hips: '', thighRight: '', thighLeft: '', calfRight: '', calfLeft: '' });
        } else {
            alert('Não foi possível salvar os registros. Verifique a conexão ou fale com o suporte.');
        }
    };

    // Abre o modal de edição de biometria do aluno selecionado
    const handleOpenBioModal = () => {
        if (!currentStudent) return;
        setEditGender(currentStudent.gender || 'female');
        setEditBirthDate(currentStudent.birthDate || currentStudent.birth_date || '');
        setIsBioModalOpen(true);
    };

    // Salva as alterações de gênero e data de nascimento do atleta
    const handleSaveBio = async (e) => {
        e.preventDefault();
        if (!selectedStudentId) return;
        setIsSavingBio(true);

        const newAge = getAge(editBirthDate);
        const newGender = editGender;

        // Recalcular o % de gordura de todas as avaliações que já possuem as 7 dobras
        const currentMetrics = currentStudent?.profile_data?.metrics || [];
        const updatedMetrics = currentMetrics.map(m => {
            if (m.skinfolds && Object.values(m.skinfolds).some(v => v !== '')) {
                const res = calculateBodyDensityAndFat(m.skinfolds, newAge, newGender);
                if (res.isComplete && res.fat !== null) {
                    return { ...m, bodyFat: res.fat };
                }
            }
            return m;
        });

        const ok = await updateStudent(selectedStudentId, {
            gender: newGender,
            birthDate: editBirthDate,
            birth_date: editBirthDate,
            metrics: updatedMetrics
        });

        setIsSavingBio(false);
        if (ok) {
            setIsBioModalOpen(false);
        } else {
            alert('Erro ao atualizar perfil do aluno. Tente novamente.');
        }
    };

    // Cálculo em tempo real para exibir na tela enquanto preenche as 7 dobras
    const liveCalc = useMemo(() => {
        const studentBirthDate = currentStudent?.birthDate || currentStudent?.birth_date;
        const age = getAge(studentBirthDate);
        const gender = currentStudent?.gender || 'female';
        return calculateBodyDensityAndFat(skinfolds, age, gender);
    }, [skinfolds, currentStudent]);

    const startEdit = (metric) => {
        setEditingId(metric.id);
        setWeightInput(metric.weight);
        setDateInput(metric.date);

        if (metric.skinfolds) {
            setSkinfolds(metric.skinfolds);
        } else {
            setSkinfolds({ chest: '', axilla: '', triceps: '', subscapular: '', abdomen: '', suprailiac: '', thigh: '' });
        }

        if (metric.circumferences) {
            setCircumferences(metric.circumferences);
        } else {
            setCircumferences({ neck: '', shoulder: '', chest: '', armRight: '', armLeft: '', forearmRight: '', forearmLeft: '', waist: '', abdomen: '', hips: '', thighRight: '', thighLeft: '', calfRight: '', calfLeft: '' });
        }
    };

    const cancelEdit = () => {
        setEditingId(null);
        setWeightInput('');
        setDateInput(new Date().toISOString().split('T')[0]);
        setSkinfolds({ chest: '', axilla: '', triceps: '', subscapular: '', abdomen: '', suprailiac: '', thigh: '' });
        setCircumferences({ neck: '', shoulder: '', chest: '', armRight: '', armLeft: '', forearmRight: '', forearmLeft: '', waist: '', abdomen: '', hips: '', thighRight: '', thighLeft: '', calfRight: '', calfLeft: '' });
    };

    const updateSkinfold = (field, value) => {
        setSkinfolds(prev => ({ ...prev, [field]: value }));
    };

    const updateCircumference = (field, value) => {
        setCircumferences(prev => ({ ...prev, [field]: value }));
    };

    if (!selectedStudentId) {
        return (
            <div className="page-container" style={{ textAlign: 'center', marginTop: '3rem', color: '#64748B' }}>
                <p>Selecione uma aluna para gerenciar o peso.</p>
            </div>
        );
    }

    // Dynamic Chart Data
    const chartData = studentMetrics.map(m => {
        let displayValue = 0;
        if (activeChart === 'weight') displayValue = m.weight;
        else if (activeChart === 'bodyFat') displayValue = m.bodyFat || 0;
        else if (activeChart === 'perimetry' && m.circumferences) {
            displayValue = parseFloat(m.circumferences[selectedPerimetry]) || 0;
        }
        return {
            ...m,
            displayValue
        };
    });

    const perimetryLabels = {
        neck: 'Pescoço', shoulder: 'Ombro', chest: 'Tórax',
        armRight: 'Braço Dir.', armLeft: 'Braço Esq.',
        forearmRight: 'Antebraço Dir.', forearmLeft: 'Antebraço Esq.',
        waist: 'Cintura', abdomen: 'Abdômen', hips: 'Quadril',
        thighRight: 'Coxa Dir.', thighLeft: 'Coxa Esq.',
        calfRight: 'Panturrilha Dir.', calfLeft: 'Panturrilha Esq.'
    };

    return (
        <div className={`page-container animate-fade-in ${styles.container}`}>
            <header style={{ marginBottom: '2rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
                    <h1 style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <Scale color="var(--accent-primary)" /> Medidas Corporais
                    </h1>
                    <BodyMetricsPDFExport metrics={studentMetrics} student={currentStudent} />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '0.4rem', flexWrap: 'wrap' }}>
                    <p style={{ color: 'var(--text-secondary)', margin: 0 }}>
                        Atleta: <strong>{currentStudent?.name}</strong> •
                        Idade: {getAge(currentStudent?.birthDate || currentStudent?.birth_date) !== null ? `${getAge(currentStudent?.birthDate || currentStudent?.birth_date)} anos` : 'Não informada'} •
                        Sexo: {currentStudent?.gender === 'female' ? 'Feminino' : currentStudent?.gender === 'male' ? 'Masculino' : 'Não informado'}
                    </p>
                    <button
                        type="button"
                        onClick={handleOpenBioModal}
                        style={{
                            background: 'rgba(74, 222, 128, 0.1)',
                            border: '1px solid rgba(74, 222, 128, 0.3)',
                            color: 'var(--accent-primary)',
                            borderRadius: '8px',
                            padding: '3px 10px',
                            fontSize: '0.78rem',
                            fontWeight: 600,
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            transition: 'all 0.2s ease'
                        }}
                        title="Alterar Sexo Biológico ou Idade do Atleta"
                    >
                        <UserCheck size={13} /> Editar Dados do Atleta
                    </button>
                </div>
            </header>

            {/* Stats Cards */}
            <div className={styles.statsGrid}>
                <div className="stat-card">
                    <div className="stat-label">Peso Atual</div>
                    <div className="stat-value">{latestMetric ? `${latestMetric.weight} kg` : '-'}</div>
                </div>
                <div className="stat-card">
                    <div className="stat-label">% Gordura (Atual)</div>
                    <div className="stat-value" style={{ color: 'var(--accent-primary)' }}>
                        {latestMetric?.bodyFat ? `${latestMetric.bodyFat}%` : '-'}
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-label">Cintura (Atual)</div>
                    <div className="stat-value" style={{ color: 'var(--text-muted)' }}>
                        {latestMetric?.circumferences?.waist ? `${latestMetric.circumferences.waist} cm` : '-'}
                    </div>
                </div>
            </div>

            <div className={styles.mainLayout}>

                {/* Left Column: Chart & History */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>

                    {/* Chart */}
                    <div className="glass-panel" style={{ height: '380px', padding: '1rem' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '1rem' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <h3 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)' }}>Analise Gráfica</h3>
                                </div>
                                <div style={{
                                    display: 'flex',
                                    justifyContent: 'space-evenly', /* Equal spacing as requested */
                                    alignItems: 'center',
                                    width: '100%',
                                    gap: '4px', /* Reduced gap to allow spacing to dominate */
                                    background: 'var(--bg-secondary)',
                                    padding: '4px',
                                    borderRadius: '12px',
                                    overflowX: 'auto',
                                    whiteSpace: 'nowrap',
                                    scrollbarWidth: 'none',
                                    msOverflowStyle: 'none',
                                    WebkitOverflowScrolling: 'touch'
                                }}>
                                    <style>{`
                                        /* Hide scrollbar for Chrome, Safari and Opera */
                                        .chart-selector::-webkit-scrollbar {
                                            display: none;
                                        }
                                    `}</style>
                                    <button onClick={() => setActiveChart('weight')} className={activeChart === 'weight' ? 'btn btn-sm btn-primary' : 'btn btn-sm'} style={{ flexShrink: 0, fontSize: '0.8rem', padding: '4px 12px', ...(activeChart !== 'weight' ? { background: 'transparent', color: 'var(--text-secondary)', boxShadow: 'none' } : {}) }}>Peso</button>
                                    <button onClick={() => setActiveChart('bodyFat')} className={activeChart === 'bodyFat' ? 'btn btn-sm btn-primary' : 'btn btn-sm'} style={{ flexShrink: 0, fontSize: '0.8rem', padding: '4px 12px', ...(activeChart !== 'bodyFat' ? { background: 'transparent', color: 'var(--text-secondary)', boxShadow: 'none' } : {}) }}>Gordura %</button>
                                    <button onClick={() => setActiveChart('perimetry')} className={activeChart === 'perimetry' ? 'btn btn-sm btn-primary' : 'btn btn-sm'} style={{ flexShrink: 0, fontSize: '0.8rem', padding: '4px 12px', ...(activeChart !== 'perimetry' ? { background: 'transparent', color: 'var(--text-secondary)', boxShadow: 'none' } : {}) }}>Perimetria</button>
                                </div>
                            </div>

                            {activeChart === 'perimetry' && (
                                <select
                                    value={selectedPerimetry}
                                    onChange={(e) => setSelectedPerimetry(e.target.value)}
                                    className="input text-sm p-2 bg-transparent border-gray-700"
                                    style={{ width: '200px', alignSelf: 'flex-end', background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
                                >
                                    {Object.entries(perimetryLabels).map(([key, label]) => (
                                        <option key={key} value={key}>{label}</option>
                                    ))}
                                </select>
                            )}
                        </div>

                        {studentMetrics.length > 1 ? (
                            <ResponsiveContainer width="100%" height="75%">
                                <LineChart data={chartData}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-subtle)" />
                                    <XAxis
                                        dataKey="date"
                                        tickFormatter={(str) => formatDateUser(str).slice(0, 5)} // Show DD/MM
                                        tick={{ fontSize: 12, fill: 'var(--text-muted)' }}
                                        stroke="none"
                                    />
                                    <YAxis
                                        domain={['auto', 'auto']}
                                        hide={false}
                                        tick={{ fontSize: 12, fill: 'var(--text-muted)' }}
                                        stroke="none"
                                        width={30}
                                    />
                                    <Tooltip
                                        contentStyle={{ borderRadius: '8px', border: '1px solid var(--border-subtle)', background: '#09090b', color: '#fff' }}
                                        labelFormatter={(label) => formatDateUser(label)}
                                    />
                                    <Line
                                        type="monotone"
                                        dataKey="displayValue"
                                        name={activeChart === 'perimetry' ? perimetryLabels[selectedPerimetry] : (activeChart === 'weight' ? "Peso" : "% Gordura")}
                                        stroke="var(--accent-primary)"
                                        strokeWidth={3}
                                        dot={{ fill: 'var(--accent-primary)', strokeWidth: 2, r: 4, stroke: '#fff' }}
                                        activeDot={{ r: 6 }}
                                    />
                                </LineChart>
                            </ResponsiveContainer>
                        ) : (
                            <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
                                Adicione mais registros para visualizar a evolução.
                            </div>
                        )}
                    </div>

                    {/* History List */}
                    <div className="glass-panel">
                        <h3 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)', padding: '1.5rem', borderBottom: '1px solid var(--border-subtle)' }}>Histórico Detalhado</h3>
                        <div style={{ maxHeight: '500px', overflowY: 'auto' }}>
                            {studentMetrics.length === 0 && (
                                <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>Nenhum registro ainda.</div>
                            )}
                            {[...studentMetrics].reverse().map((metric) => (
                                <div key={metric.id} style={{
                                    padding: '1rem 1.5rem', borderBottom: '1px solid var(--border-subtle)',
                                    display: 'flex', flexDirection: 'column', gap: '8px'
                                }}>
                                    <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '1rem' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                            <div style={{
                                                width: '32px', height: '32px', borderRadius: '8px',
                                                background: 'var(--bg-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                color: 'var(--text-secondary)'
                                            }}>
                                                <Calendar size={16} />
                                            </div>
                                            <div>
                                                <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                                                    {formatDateUser(metric.date)}
                                                </div>
                                                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                                                    {metric.bodyFat ? `Gordura: ${metric.bodyFat}%` : 'Sem dobras'}
                                                </div>
                                            </div>
                                        </div>

                                        <div style={{ display: 'flex', alignItems: 'center', gap: '2rem', marginLeft: 'auto' }}>
                                            <div style={{ fontWeight: 700, fontSize: '1.1rem', color: 'var(--text-primary)' }}>
                                                {metric.weight} kg
                                            </div>
                                            <div style={{ display: 'flex', gap: '8px' }}>
                                                <button onClick={() => startEdit(metric)} style={{ color: 'var(--text-muted)', cursor: 'pointer', background: 'none', border: 'none' }}><Edit2 size={16} /></button>
                                                <button onClick={() => deleteBodyMetric(metric.id)} style={{ color: 'var(--text-muted)', cursor: 'pointer', background: 'none', border: 'none' }}><Trash2 size={16} /></button>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Skinfolds Summary (Mini) */}
                                    {metric.skinfolds && Object.values(metric.skinfolds).some(v => v) && (
                                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginLeft: '48px', display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                            <span style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>Dobras:</span>
                                            {metric.skinfolds.chest && <span className="bg-zinc-800 px-2 py-1 rounded text-zinc-300">Peito: {metric.skinfolds.chest}</span>}
                                            {metric.skinfolds.abdomen && <span className="bg-zinc-800 px-2 py-1 rounded text-zinc-300">Abd: {metric.skinfolds.abdomen}</span>}
                                            {metric.skinfolds.thigh && <span className="bg-zinc-800 px-2 py-1 rounded text-zinc-300">Coxa: {metric.skinfolds.thigh}</span>}
                                        </div>
                                    )}

                                    {/* Perimetry Summary (Mini) */}
                                    {metric.circumferences && Object.values(metric.circumferences).some(v => v) && (
                                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginLeft: '48px', display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                            <span style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>Perimetria:</span>
                                            {metric.circumferences.armRight && <span className="bg-zinc-800 px-2 py-1 rounded text-zinc-300">Braço D: {metric.circumferences.armRight}</span>}
                                            {metric.circumferences.armLeft && <span className="bg-zinc-800 px-2 py-1 rounded text-zinc-300">Braço E: {metric.circumferences.armLeft}</span>}
                                            {metric.circumferences.waist && <span className="bg-zinc-800 px-2 py-1 rounded text-zinc-300">Cintura: {metric.circumferences.waist}</span>}
                                            {metric.circumferences.thighRight && <span className="bg-zinc-800 px-2 py-1 rounded text-zinc-300">Coxa D: {metric.circumferences.thighRight}</span>}
                                            {metric.circumferences.thighLeft && <span className="bg-zinc-800 px-2 py-1 rounded text-zinc-300">Coxa E: {metric.circumferences.thighLeft}</span>}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                </div>

                {/* RIGHT COLUMN: FORM */}
                <div className="glass-panel" style={{ padding: '2rem', position: 'sticky', top: '2rem', height: 'fit-content' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                        <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                            {editingId ? 'Editar Medidas' : 'Novo Registro'}
                        </h3>
                        {editingId && (
                            <button onClick={cancelEdit} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.85rem' }}>
                                <X size={16} /> Cancelar
                            </button>
                        )}
                    </div>
                    <form onSubmit={handleAddWeight}>
                        <div style={{ marginBottom: '1rem' }}>
                            <label className="label">Data</label>
                            <input type="date" className="input" style={{ width: '100%' }} value={dateInput} onChange={e => setDateInput(e.target.value)} required />
                        </div>

                        <div style={{ marginBottom: '1.5rem' }}>
                            <label className="label">Peso (kg)</label>
                            <input type="number" step="0.1" placeholder="0.00" className="input" style={{ width: '100%', fontSize: '1.2rem', fontWeight: 600 }} value={weightInput} onChange={e => setWeightInput(e.target.value)} required />
                        </div>

                        {/* SKINFOLDS SECTION - UNIFIED */}
                        <div style={{ margin: '1.5rem 0 1rem 0' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                                <Activity size={16} /> Dobras Cutâneas (Pollock 7)
                            </div>

                            <div className="animate-fade-in" style={{
                                display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px',
                            }}>
                                {['chest', 'axilla', 'triceps', 'subscapular', 'abdomen', 'suprailiac', 'thigh'].map(field => (
                                    <div key={field} style={field === 'thigh' ? { gridColumn: 'span 2' } : {}}>
                                        <label className="text-xs text-gray-400 font-medium capitalize">{field === 'chest' ? 'Peitoral' : field === 'axilla' ? 'Axilar Média' : field === 'subscapular' ? 'Subescapular' : field === 'suprailiac' ? 'Supra-ilíaca' : field === 'thigh' ? 'Coxa' : field === 'abdomen' ? 'Abdominal' : 'Tríceps'}</label>
                                        <input type="number" step="0.1" className="input w-full p-2 text-sm" value={skinfolds[field]} onChange={(e) => updateSkinfold(field, e.target.value)} placeholder="mm" />
                                    </div>
                                ))}
                            </div>

                            {/* FEEDBACK DO CÁLCULO POLLOCK 7 EM TEMPO REAL */}
                            {Object.values(skinfolds).some(v => v !== '') && (
                                <div style={{
                                    marginTop: '12px',
                                    padding: '10px 12px',
                                    borderRadius: '8px',
                                    background: liveCalc.isComplete ? 'rgba(74, 222, 128, 0.08)' : 'rgba(234, 179, 8, 0.08)',
                                    border: `1px solid ${liveCalc.isComplete ? 'rgba(74, 222, 128, 0.25)' : 'rgba(234, 179, 8, 0.25)'}`,
                                    fontSize: '0.82rem'
                                }}>
                                    {liveCalc.isComplete ? (
                                        <div>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                                                <span style={{ color: 'var(--text-secondary)' }}>Soma das 7 dobras:</span>
                                                <strong style={{ color: 'var(--text-primary)' }}>{liveCalc.sum7} mm</strong>
                                            </div>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <span style={{ color: 'var(--accent-primary)', fontWeight: 600 }}>% Gordura Calculado (Pollock 7):</span>
                                                <strong style={{ color: 'var(--accent-primary)', fontSize: '1rem' }}>{liveCalc.fat}%</strong>
                                            </div>
                                        </div>
                                    ) : (
                                        <div style={{ color: '#eab308', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                            <AlertCircle size={14} style={{ flexShrink: 0 }} />
                                            <span>Preencha todas as 7 dobras para o cálculo automático (faltam {liveCalc.missingCount}).</span>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* PERIMETRY SECTION - UNIFIED */}
                        <div style={{ margin: '1.5rem 0 1rem 0', borderTop: '1px solid var(--border-subtle)', paddingTop: '1.5rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                                <Ruler size={16} /> Perimetria (cm)
                            </div>

                            <div className="animate-fade-in" style={{
                                display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px',
                            }}>
                                {Object.entries(perimetryLabels).map(([key, label]) => (
                                    <div key={key}>
                                        <label className="text-xs text-gray-400 font-medium">{label}</label>
                                        <input
                                            type="number"
                                            step="0.1"
                                            className="input w-full p-2 text-sm"
                                            value={circumferences[key]}
                                            onChange={(e) => updateCircumference(key, e.target.value)}
                                            placeholder="cm"
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>

                        <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }} disabled={isSaving}>
                            {isSaving ? (
                                'Salvando...'
                            ) : (
                                <>
                                    {editingId ? <Edit2 size={20} /> : <PlusCircle size={20} />}
                                    {editingId ? 'Atualizar Dados' : 'Salvar Registro'}
                                </>
                            )}
                        </button>
                    </form>
                </div>

            </div>

            {/* MODAL PARA O TREINADOR EDITAR GÊNERO E DATA DE NASCIMENTO DO ATLETA */}
            {isBioModalOpen && (
                <div style={{
                    position: 'fixed',
                    inset: 0,
                    backgroundColor: 'rgba(0, 0, 0, 0.75)',
                    backdropFilter: 'blur(4px)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 1000,
                    padding: '1rem'
                }}>
                    <div className="glass-panel animate-fade-in" style={{
                        maxWidth: '420px',
                        width: '100%',
                        padding: '1.75rem',
                        border: '1px solid var(--border-subtle)'
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                            <h3 style={{ margin: 0, fontSize: '1.2rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <UserCheck size={20} color="var(--accent-primary)" />
                                Dados do Atleta
                            </h3>
                            <button
                                type="button"
                                onClick={() => setIsBioModalOpen(false)}
                                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1.25rem', lineHeight: 1.4 }}>
                            Esses dados são essenciais para calcular a densidade e o % de gordura pelo protocolo Pollock 7 dobras com exatidão.
                        </p>

                        <form onSubmit={handleSaveBio} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <div style={{ textAlign: 'left' }}>
                                <label className="label">Sexo Biológico</label>
                                <select
                                    className="input"
                                    value={editGender}
                                    onChange={(e) => setEditGender(e.target.value)}
                                    style={{ width: '100%' }}
                                    required
                                >
                                    <option value="female">Feminino</option>
                                    <option value="male">Masculino</option>
                                </select>
                            </div>

                            <div style={{ textAlign: 'left' }}>
                                <label className="label">Data de Nascimento</label>
                                <input
                                    type="date"
                                    className="input"
                                    value={editBirthDate}
                                    onChange={(e) => setEditBirthDate(e.target.value)}
                                    style={{ width: '100%' }}
                                    required
                                />
                                {editBirthDate && (
                                    <span style={{ fontSize: '0.78rem', color: 'var(--accent-primary)', marginTop: '4px', display: 'block' }}>
                                        Idade calculada: {getAge(editBirthDate)} anos
                                    </span>
                                )}
                            </div>

                            <div style={{ display: 'flex', gap: '10px', marginTop: '0.75rem' }}>
                                <button
                                    type="button"
                                    onClick={() => setIsBioModalOpen(false)}
                                    className="btn btn-secondary"
                                    style={{ flex: 1, justifyContent: 'center' }}
                                    disabled={isSavingBio}
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    className="btn btn-primary"
                                    style={{ flex: 1, justifyContent: 'center' }}
                                    disabled={isSavingBio}
                                >
                                    {isSavingBio ? 'Salvando...' : 'Salvar Dados'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default WeightTrackerPage;
