import React, { useState, useMemo } from 'react';
import { useStudent } from '../context/StudentContext';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Scale, TrendingUp, TrendingDown, Minus, Calendar, PlusCircle, Trash2, Edit2, X, Activity, Ruler } from 'lucide-react';

import styles from './WeightTrackerPage.module.css';

const WeightTrackerPage = () => {
    const { selectedStudentId, students, bodyMetrics, addBodyMetric, deleteBodyMetric, updateBodyMetric } = useStudent();
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

    const [editingId, setEditingId] = useState(null);

    const [activeChart, setActiveChart] = useState('weight'); // 'weight', 'bodyFat', 'perimetry'
    const [selectedPerimetry, setSelectedPerimetry] = useState('waist'); // Default metric for perimetry chart

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

    // --- POLLOCK 7 CALCULATION ---
    const calculateBodyDensityAndFat = (folds, age, gender) => {
        // Sum of 7 folds
        const sum7 =
            (parseFloat(folds.chest) || 0) +
            (parseFloat(folds.axilla) || 0) +
            (parseFloat(folds.triceps) || 0) +
            (parseFloat(folds.subscapular) || 0) +
            (parseFloat(folds.abdomen) || 0) +
            (parseFloat(folds.suprailiac) || 0) +
            (parseFloat(folds.thigh) || 0);

        if (sum7 === 0) return { density: 0, fat: 0 };

        let density = 0;

        if (gender === 'female') {
            // Jackson & Pollock (Women)
            density = 1.0970 - (0.00046971 * sum7) + (0.00000056 * (sum7 ** 2)) - (0.00012828 * age);
        } else {
            // Jackson & Pollock (Men)
            density = 1.11200000 - (0.00043499 * sum7) + (0.00000055 * (sum7 ** 2)) - (0.00028826 * age);
        }

        // Siri Equation
        const fatPercentage = (495 / density) - 450;

        return {
            density: density,
            fat: parseFloat(fatPercentage.toFixed(2))
        };
    };

    // Calculate age helper
    const getAge = (birthDateString) => {
        if (!birthDateString) return 25; // Default fallback
        const today = new Date();
        const birthDate = new Date(birthDateString);
        let age = today.getFullYear() - birthDate.getFullYear();
        const m = today.getMonth() - birthDate.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
            age--;
        }
        return age;
    };



    // Helper to format date string (YYYY-MM-DD) to DD/MM/YYYY without timezone conversion
    const formatDateUser = (dateString) => {
        if (!dateString) return '-';
        const [year, month, day] = dateString.split('-');
        return `${day}/${month}/${year}`;
    };

    const handleAddWeight = (e) => {
        e.preventDefault();
        if (!weightInput || !selectedStudentId) return;

        // Auto Calculate Body Fat if skinfolds are present
        const hasSkinfolds = Object.values(skinfolds).some(v => v !== '');
        let calculatedFat = null;

        if (hasSkinfolds) {
            const age = getAge(currentStudent?.birthDate);
            const gender = currentStudent?.gender || 'male';
            const { fat } = calculateBodyDensityAndFat(skinfolds, age, gender);
            if (!isNaN(fat) && fat > 0 && fat < 100) {
                calculatedFat = fat;
            }
        }

        if (editingId) {
            updateBodyMetric(editingId, weightInput, dateInput, skinfolds, calculatedFat, circumferences);
            setEditingId(null);
        } else {
            addBodyMetric(selectedStudentId, weightInput, dateInput, skinfolds, calculatedFat, circumferences);
        }

        // Reset Form
        setWeightInput('');
        setDateInput(new Date().toISOString().split('T')[0]);
        setSkinfolds({ chest: '', axilla: '', triceps: '', subscapular: '', abdomen: '', suprailiac: '', thigh: '' });
        setCircumferences({ neck: '', shoulder: '', chest: '', armRight: '', armLeft: '', forearmRight: '', forearmLeft: '', waist: '', abdomen: '', hips: '', thighRight: '', thighLeft: '', calfRight: '', calfLeft: '' });
    };

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
                <h1 style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <Scale color="var(--accent-primary)" /> Medidas Corporais
                </h1>
                <p style={{ color: 'var(--text-secondary)' }}>
                    Atleta: <strong>{currentStudent?.name}</strong> •
                    Idade: {getAge(currentStudent?.birthDate)} •
                    Sexo: {currentStudent?.gender === 'female' ? 'Feminino' : 'Masculino'}
                </p>
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

                        <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }}>
                            {editingId ? <Edit2 size={20} /> : <PlusCircle size={20} />}
                            {editingId ? 'Atualizar Dados' : 'Salvar Registro'}
                        </button>
                    </form>
                </div>

            </div>
        </div>
    );
};

export default WeightTrackerPage;
