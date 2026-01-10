import React, { useState, useEffect } from 'react';
import { useStudent } from '../../context/StudentContext';
import { Ruler, Scale, Calendar, AlertCircle, Plus, TrendingUp, TrendingDown, Minus, Trash2 } from 'lucide-react';
import { LineChart, Line, ResponsiveContainer } from 'recharts';
import Modal from '../ui/Modal';

const BiometricCard = () => {
    const { students, selectedStudentId, updateStudent, addBodyMetric, getBodyMetrics, deleteBodyMetric } = useStudent();
    const student = students.find(s => s.id === selectedStudentId);

    const [height, setHeight] = useState('');
    const [birthDate, setBirthDate] = useState('');
    const [age, setAge] = useState(null);

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [newWeight, setNewWeight] = useState('');
    const [newDate, setNewDate] = useState(new Date().toISOString().split('T')[0]);

    // Reactive metrics derived from context
    // This ensures updates in context (from add/delete) reflect immediately without local state lag
    const metrics = React.useMemo(() => {
        return getBodyMetrics(selectedStudentId);
    }, [selectedStudentId, getBodyMetrics]);

    const calculateAge = (dob) => {
        if (!dob) {
            setAge(null);
            return;
        }
        const birthDateObj = new Date(dob);
        const difference = Date.now() - birthDateObj.getTime();
        const ageDate = new Date(difference);
        setAge(Math.abs(ageDate.getUTCFullYear() - 1970));
    };

    useEffect(() => {
        if (student) {
            // Only update if values differ to avoid loops/warnings
            const newHeight = student.height || '';
            const newDob = student.birthDate || student.birth_date || '';

            setHeight(h => h !== newHeight ? newHeight : h); // eslint-disable-line react-hooks/set-state-in-effect
            setBirthDate(d => d !== newDob ? newDob : d);

            if (newDob) calculateAge(newDob);
        }
    }, [student?.height, student?.birthDate, student?.birth_date]); // eslint-disable-line react-hooks/exhaustive-deps

    const handleUpdate = () => {
        if (!selectedStudentId) return;
        updateStudent(selectedStudentId, {
            height: parseFloat(height),
            birthDate: birthDate // Save as camelCase
        });
        calculateAge(birthDate);
    };

    const handleAddWeight = (e) => {
        e.preventDefault();
        if (!newWeight) return;
        addBodyMetric(selectedStudentId, newWeight, newDate);
        setNewWeight('');
        // Don't close modal immediately, user might want to see history
    };

    const handleDeleteWeight = (id) => {
        if (window.confirm('Tem certeza que deseja apagar este registro?')) {
            deleteBodyMetric(id);
        }
    };

    if (!student) return null;

    const currentWeight = metrics.length > 0 ? metrics[metrics.length - 1].weight : (student.weight || '-');
    const previousWeight = metrics.length > 1 ? metrics[metrics.length - 2].weight : null;
    const trend = previousWeight ? (currentWeight - previousWeight) : 0;

    // Prepare data for small chart (last 10 entries)
    const chartData = metrics.slice(-10).map(m => ({ value: m.weight }));

    const inputStyle = {
        border: '1px solid #cbd5e1',
        borderRadius: '8px',
        padding: '8px 12px',
        width: '100%',
        fontSize: '0.9rem',
        marginTop: '4px',
        color: '#334155'
    };

    const labelStyle = {
        fontSize: '0.8rem',
        fontWeight: 600,
        color: '#64748B',
        display: 'flex',
        alignItems: 'center',
        gap: '4px'
    };

    return (
        <>
            <div style={{
                background: '#fff',
                borderRadius: '16px',
                padding: '1.5rem',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
                marginBottom: '2rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '1rem'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#1e293b' }}>
                        Perfil do Aluno
                    </h2>
                    {age !== null && (
                        <span style={{
                            background: '#e0f2fe',
                            color: '#0284c7',
                            padding: '4px 12px',
                            borderRadius: '20px',
                            fontWeight: 600,
                            fontSize: '0.9rem'
                        }}>
                            {age} Anos
                        </span>
                    )}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem' }}>

                    {/* Weight Evolution Card */}
                    <div style={{
                        gridColumn: 'span 2',
                        background: '#f8fafc',
                        borderRadius: '12px',
                        padding: '1rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        border: '1px solid #e2e8f0'
                    }}>
                        <div>
                            <label style={labelStyle}>
                                <Scale size={14} /> Evolução de Peso
                            </label>
                            <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginTop: '4px' }}>
                                <span style={{ fontSize: '1.8rem', fontWeight: 700, color: '#0f172a' }}>
                                    {currentWeight} <span style={{ fontSize: '1rem', fontWeight: 500, color: '#64748B' }}>kg</span>
                                </span>
                                {trend !== 0 && (
                                    <span style={{ fontSize: '0.8rem', color: trend > 0 ? '#ef4444' : '#22c55e', display: 'flex', alignItems: 'center' }}>
                                        {trend > 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                                        {Math.abs(trend).toFixed(1)}kg
                                    </span>
                                )}
                            </div>
                            <button
                                onClick={() => setIsModalOpen(true)}
                                style={{
                                    marginTop: '8px',
                                    fontSize: '0.8rem',
                                    color: 'var(--accent-primary)',
                                    background: 'none',
                                    border: 'none',
                                    cursor: 'pointer',
                                    fontWeight: 600,
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '4px'
                                }}
                            >
                                + Registrar Pesagem
                            </button>
                        </div>

                        {/* Sparkline */}
                        {chartData.length > 1 && (
                            <div style={{ width: '100px', height: '50px' }}>
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={chartData}>
                                        <Line type="monotone" dataKey="value" stroke="var(--accent-primary)" strokeWidth={2} dot={false} />
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>
                        )}
                    </div>

                    {/* Height */}
                    <div>
                        <label style={labelStyle}>
                            <Ruler size={14} />
                            Altura (cm)
                        </label>
                        <input
                            type="number"
                            placeholder="Ex: 175"
                            value={height}
                            onChange={(e) => setHeight(e.target.value)}
                            onBlur={handleUpdate}
                            style={inputStyle}
                        />
                    </div>

                    {/* Birth Date */}
                    <div>
                        <label style={labelStyle}>
                            <Calendar size={14} />
                            Data de Nascimento
                        </label>
                        <input
                            type="date"
                            value={birthDate}
                            onChange={(e) => {
                                setBirthDate(e.target.value);
                                calculateAge(e.target.value);
                            }}
                            onBlur={handleUpdate}
                            style={inputStyle}
                        />
                    </div>
                </div>
            </div>

            {/* Weight Modal */}
            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Registrar Pesagem">
                <form onSubmit={handleAddWeight} style={{ marginBottom: '2rem' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: '10px', alignItems: 'end' }}>
                        <div>
                            <label style={{ display: 'block', marginBottom: '4px', fontSize: '0.8rem', color: '#64748B' }}>Data</label>
                            <input
                                type="date"
                                className="input"
                                value={newDate}
                                onChange={(e) => setNewDate(e.target.value)}
                                required
                            />
                        </div>
                        <div>
                            <label style={{ display: 'block', marginBottom: '4px', fontSize: '0.8rem', color: '#64748B' }}>Peso (kg)</label>
                            <input
                                type="number"
                                step="0.1"
                                className="input"
                                placeholder="0.0"
                                value={newWeight}
                                onChange={(e) => setNewWeight(e.target.value)}
                                required
                                autoFocus
                            />
                        </div>
                        <button type="submit" className="btn btn-primary" style={{ height: '42px' }}>
                            <Plus size={20} />
                        </button>
                    </div>
                </form>

                {/* History List */}
                <h4 style={{ fontSize: '0.9rem', color: '#64748B', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Histórico</h4>
                <div style={{ maxHeight: '200px', overflowY: 'auto', border: '1px solid #e2e8f0', borderRadius: '8px' }}>
                    {metrics.length === 0 ? (
                        <div style={{ padding: '1rem', textAlign: 'center', color: '#94a3b8', fontSize: '0.9rem' }}>Nenhum registro.</div>
                    ) : (
                        [...metrics].reverse().map((m) => (
                            <div key={m.id} style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                padding: '10px 15px',
                                borderBottom: '1px solid #f1f5f9',
                                background: '#fff'
                            }}>
                                <div>
                                    <div style={{ fontWeight: 600, color: '#334155' }}>{m.weight} kg</div>
                                    <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>{new Date(m.date).toLocaleDateString()}</div>
                                </div>
                                <button
                                    onClick={() => handleDeleteWeight(m.id)}
                                    style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '4px' }}
                                    title="Apagar"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        ))
                    )}
                </div>
            </Modal>
        </>
    );
};

export default BiometricCard;
