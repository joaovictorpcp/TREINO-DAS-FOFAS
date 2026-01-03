import React, { useState, useMemo } from 'react';
import { useStudent } from '../context/StudentContext';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Scale, TrendingUp, TrendingDown, Minus, Calendar, PlusCircle, Trash2, Edit2, X } from 'lucide-react';

import styles from './WeightTrackerPage.module.css';

const WeightTrackerPage = () => {
    const { selectedStudentId, students, bodyMetrics, addBodyMetric, deleteBodyMetric, updateBodyMetric } = useStudent();
    const [weightInput, setWeightInput] = useState('');
    const [dateInput, setDateInput] = useState(new Date().toISOString().split('T')[0]);
    const [editingId, setEditingId] = useState(null);

    const currentStudent = students.find(s => s.id === selectedStudentId);

    // Get stats for this student
    const studentMetrics = useMemo(() => {
        if (!selectedStudentId) return [];
        return bodyMetrics
            .filter(m => m.studentId === selectedStudentId)
            .sort((a, b) => new Date(a.date) - new Date(b.date));
    }, [bodyMetrics, selectedStudentId]);

    const latestMetric = studentMetrics.length > 0 ? studentMetrics[studentMetrics.length - 1] : null;
    const startMetric = studentMetrics.length > 0 ? studentMetrics[0] : null;

    // Calculate Change
    const totalChange = latestMetric && startMetric
        ? (latestMetric.weight - startMetric.weight).toFixed(1)
        : '0.0';

    const handleAddWeight = (e) => {
        e.preventDefault();
        if (!weightInput || !selectedStudentId) return;

        if (editingId) {
            updateBodyMetric(editingId, weightInput, dateInput);
            setEditingId(null);
            setWeightInput('');
            setDateInput(new Date().toISOString().split('T')[0]); // Reset date
        } else {
            addBodyMetric(selectedStudentId, weightInput, dateInput);
            setWeightInput('');
        }
    };

    const startEdit = (metric) => {
        setEditingId(metric.id);
        setWeightInput(metric.weight);
        setDateInput(metric.date);
    };

    const cancelEdit = () => {
        setEditingId(null);
        setWeightInput('');
        setDateInput(new Date().toISOString().split('T')[0]);
    };

    if (!selectedStudentId) {
        return (
            <div className="page-container" style={{ textAlign: 'center', marginTop: '3rem', color: '#64748B' }}>
                <p>Selecione uma aluna para gerenciar o peso.</p>
            </div>
        );
    }

    return (
        <div className={`page-container animate-fade-in ${styles.container}`}>
            <header style={{ marginBottom: '2rem' }}>
                <h1 style={{ fontSize: '1.8rem', fontWeight: 800, color: '#1e293b', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <Scale color="var(--accent-primary)" /> Controle de Peso
                </h1>
                <p style={{ color: '#64748B' }}>Acompanhe a evolução corporal de {currentStudent?.name}</p>
            </header>

            {/* Stats Cards */}
            <div className={styles.statsGrid}>
                <div className="stat-card">
                    <div className="stat-label">Peso Atual</div>
                    <div className="stat-value">{latestMetric ? `${latestMetric.weight} kg` : '-'}</div>
                </div>
                <div className="stat-card">
                    <div className="stat-label">Peso Inicial</div>
                    <div className="stat-value" style={{ color: '#64748B' }}>{startMetric ? `${startMetric.weight} kg` : '-'}</div>
                </div>
                <div className="stat-card">
                    <div className="stat-label">Evolução Total</div>
                    <div className="stat-value" style={{
                        color: parseFloat(totalChange) > 0 ? '#10B981' : (parseFloat(totalChange) < 0 ? '#EF4444' : '#64748B'),
                        display: 'flex', alignItems: 'center', gap: '8px'
                    }}>
                        {parseFloat(totalChange) > 0 ? <TrendingUp size={24} /> : (parseFloat(totalChange) < 0 ? <TrendingDown size={24} /> : <Minus size={24} />)}
                        {totalChange > 0 ? `+${totalChange}` : totalChange} kg
                    </div>
                </div>
            </div>

            <div className={styles.mainLayout}>

                {/* Left Column: Chart & History */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>

                    {/* Chart */}
                    <div className="glass-panel" style={{ height: '300px', padding: '1rem' }}>
                        <h3 style={{ fontSize: '1rem', fontWeight: 600, color: '#334155', marginBottom: '1rem' }}>Evolução</h3>
                        {studentMetrics.length > 1 ? (
                            <ResponsiveContainer width="100%" height="90%">
                                <LineChart data={studentMetrics}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                    <XAxis
                                        dataKey="date"
                                        tickFormatter={(str) => new Date(str).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
                                        tick={{ fontSize: 12, fill: '#64748B' }}
                                        stroke="none"
                                    />
                                    <YAxis
                                        domain={['dataMin - 2', 'dataMax + 2']}
                                        hide={false}
                                        tick={{ fontSize: 12, fill: '#64748B' }}
                                        stroke="none"
                                        width={30}
                                    />
                                    <Tooltip
                                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}
                                        labelFormatter={(label) => new Date(label).toLocaleDateString('pt-BR')}
                                    />
                                    <Line
                                        type="monotone"
                                        dataKey="weight"
                                        stroke="var(--accent-primary)"
                                        strokeWidth={3}
                                        dot={{ fill: 'var(--accent-primary)', strokeWidth: 2, r: 4, stroke: '#fff' }}
                                        activeDot={{ r: 6 }}
                                    />
                                </LineChart>
                            </ResponsiveContainer>
                        ) : (
                            <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8' }}>
                                É necessário pelo menos 2 registros para gerar o gráfico.
                            </div>
                        )}
                    </div>

                    {/* History List */}
                    <div className="glass-panel">
                        <h3 style={{ fontSize: '1rem', fontWeight: 600, color: '#334155', padding: '1.5rem', borderBottom: '1px solid #f1f5f9' }}>Histórico</h3>
                        <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                            {studentMetrics.length === 0 && (
                                <div style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8' }}>Nenhum registro ainda.</div>
                            )}
                            {[...studentMetrics].reverse().map((metric, index) => {
                                // Calculate diff with NEXT item (since we reversed, next is actually previous in time)
                                const prevMetric = studentMetrics[studentMetrics.length - 1 - index - 1]; // logic: total length - 1 - index give original index. then -1 for prev.
                                // Actually simpler:
                                // reversed array index i. Original index was (len - 1 - i). Previous was (len - 1 - i - 1).
                                // Let's just lookup by date logic or keep it simple.

                                let diff = 0;
                                if (index < studentMetrics.length - 1) {
                                    // There is a 'previous' record (next in this reversed list)
                                    // Wait, 'next' in reversed list is older.
                                    // So current metric - older metric = diff.
                                    const olderMetric = [...studentMetrics].reverse()[index + 1];
                                    diff = (metric.weight - olderMetric.weight).toFixed(1);
                                }

                                return (
                                    <div key={metric.id} style={{
                                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                        padding: '1rem 1.5rem', borderBottom: '1px solid #f8fafc'
                                    }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                            <div style={{
                                                width: '32px', height: '32px', borderRadius: '8px',
                                                background: '#F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                color: '#64748B'
                                            }}>
                                                <Calendar size={16} />
                                            </div>
                                            <div>
                                                <div style={{ fontWeight: 600, color: '#334155' }}>
                                                    {new Date(metric.date).toLocaleDateString('pt-BR')}
                                                </div>
                                                <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
                                                    {new Date(metric.date).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                                                </div>
                                            </div>
                                        </div>

                                        <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
                                            <div style={{ fontWeight: 700, fontSize: '1.1rem', color: '#1e293b' }}>
                                                {metric.weight} kg
                                            </div>

                                            {index < studentMetrics.length - 1 && (
                                                <div style={{
                                                    width: '60px', textAlign: 'right', fontSize: '0.9rem', fontWeight: 600,
                                                    color: diff > 0 ? '#10B981' : (diff < 0 ? '#EF4444' : '#94a3b8')
                                                }}>
                                                    {diff > 0 ? `+${diff}` : diff}
                                                </div>
                                            )}

                                            <div style={{ display: 'flex', gap: '8px' }}>
                                                <button
                                                    onClick={() => startEdit(metric)}
                                                    style={{ color: '#cbd5e1', cursor: 'pointer', background: 'none', border: 'none' }}
                                                    title="Editar medição"
                                                    onMouseEnter={e => e.currentTarget.style.color = 'var(--accent-primary)'}
                                                    onMouseLeave={e => e.currentTarget.style.color = '#cbd5e1'}
                                                >
                                                    <Edit2 size={16} />
                                                </button>
                                                <button
                                                    onClick={() => deleteBodyMetric(metric.id)}
                                                    style={{ color: '#cbd5e1', cursor: 'pointer', background: 'none', border: 'none' }}
                                                    title="Excluir medição"
                                                    onMouseEnter={e => e.currentTarget.style.color = '#ef4444'}
                                                    onMouseLeave={e => e.currentTarget.style.color = '#cbd5e1'}
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                </div>

                <div className="glass-panel" style={{ padding: '2rem', position: 'sticky', top: '2rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                        <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#1e293b' }}>
                            {editingId ? 'Editar Pesagem' : 'Novo Registro'}
                        </h3>
                        {editingId && (
                            <button onClick={cancelEdit} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748B', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.85rem' }}>
                                <X size={16} /> Cancelar
                            </button>
                        )}
                    </div>
                    <form onSubmit={handleAddWeight}>
                        <div style={{ marginBottom: '1.5rem' }}>
                            <label className="label">Data</label>
                            <input
                                type="date"
                                className="input"
                                style={{ width: '100%' }}
                                value={dateInput}
                                onChange={e => setDateInput(e.target.value)}
                                required
                            />
                        </div>

                        <div style={{ marginBottom: '1.5rem' }}>
                            <label className="label">Peso (kg)</label>
                            <input
                                type="number"
                                step="0.1"
                                placeholder="0.00"
                                className="input"
                                style={{ width: '100%', fontSize: '1.2rem', fontWeight: 600 }}
                                value={weightInput}
                                onChange={e => setWeightInput(e.target.value)}
                                required
                                autoFocus
                            />
                        </div>

                        <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }}>
                            {editingId ? <Edit2 size={20} /> : <PlusCircle size={20} />}
                            {editingId ? 'Atualizar' : 'Registrar'}
                        </button>
                    </form>

                    <div style={{ marginTop: '2rem', padding: '1rem', background: '#F8FAFC', borderRadius: '12px', fontSize: '0.9rem', color: '#64748B', lineHeight: 1.5 }}>
                        <p><strong>Dica:</strong> Para maior precisão, pese-se sempre no mesmo horário, preferencialmente pela manhã em jejum.</p>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default WeightTrackerPage;
