import React, { useState, useMemo } from 'react';
import { useStudent } from '../context/StudentContext';
import { useWorkout } from '../context/WorkoutContext';
import { useNavigate } from 'react-router-dom';
import { Plus, UserCircle, Trash2, Dumbbell } from 'lucide-react';

const StudentGateway = () => {
    const { students, setSelectedStudentId, addStudent, deleteStudent } = useStudent();
    const { workouts } = useWorkout();
    const navigate = useNavigate();
    const [isCreating, setIsCreating] = useState(false);
    const [newName, setNewName] = useState('');

    // Clear selection on mount (when returning to Home)
    React.useEffect(() => {
        setSelectedStudentId(null);
    }, [setSelectedStudentId]);

    const handleSelect = (id) => {
        setSelectedStudentId(id);
        navigate('/dashboard');
    };

    const handleDelete = (e, id, name) => {
        e.stopPropagation();
        if (window.confirm(`Tem certeza que deseja remover ${name}? Todo o histórico será perdido.`)) {
            deleteStudent(id);
        }
    };

    const handleCreate = (e) => {
        e.preventDefault();
        if (!newName.trim()) return;
        addStudent(newName, "Aluna");
        setNewName('');
        setIsCreating(false);
    };

    // Calculate basic stats for sorting or display
    const studentStats = useMemo(() => {
        const stats = {};
        students.forEach(student => {
            const count = workouts.filter(w => w.studentId === student.id).length;
            stats[student.id] = count;
        });
        return stats;
    }, [students, workouts]);

    return (
        <div style={{
            minHeight: '100vh',
            background: '#F8FAFC',
            padding: '2rem',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center'
        }}>
            <header style={{ marginBottom: '3rem', textAlign: 'center' }}>
                <h1 style={{
                    fontSize: '2rem',
                    color: '#1e293b',
                    fontWeight: '800',
                    letterSpacing: '-0.5px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    justifyContent: 'center'
                }}>
                    <div style={{ background: '#0f172a', color: '#fff', padding: '8px', borderRadius: '12px' }}>
                        <Dumbbell size={24} />
                    </div>
                    Treino das Fofas
                </h1>
                <p style={{ color: '#64748B', marginTop: '8px' }}>Selecione uma aluna para acessar o painel</p>
            </header>

            <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '1rem',
                maxWidth: '800px',
                width: '100%'
            }}>
                {/* Header Row */}
                <div style={{
                    display: 'grid', gridTemplateColumns: '60px 2fr 1fr 1fr 40px', gap: '1rem',
                    padding: '0 1.5rem', marginBottom: '0.5rem', color: '#94a3b8', fontSize: '0.85rem', fontWeight: 600
                }}>
                    <span></span>
                    <span>ALUNA</span>
                    <span style={{ textAlign: 'center' }}>TREINOS</span>
                    <span style={{ textAlign: 'center' }}>ÚLTIMO</span>
                    <span></span>
                </div>

                {/* Add New Row */}
                <div
                    onClick={() => setIsCreating(true)}
                    style={{
                        background: '#fff',
                        borderRadius: '12px',
                        border: '2px dashed #cbd5e1',
                        padding: '1rem 1.5rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '12px',
                        cursor: 'pointer',
                        color: '#64748B',
                        transition: 'all 0.2s',
                        height: '72px'
                    }}
                    onMouseEnter={e => {
                        e.currentTarget.style.borderColor = 'var(--accent-primary)';
                        e.currentTarget.style.color = 'var(--accent-primary)';
                        e.currentTarget.style.background = '#f0f9ff';
                    }}
                    onMouseLeave={e => {
                        e.currentTarget.style.borderColor = '#cbd5e1';
                        e.currentTarget.style.color = '#64748B';
                        e.currentTarget.style.background = '#fff';
                    }}
                >
                    <Plus size={20} />
                    <span style={{ fontWeight: 600 }}>Nova Aluna</span>
                </div>

                {/* Student Rows */}
                {students.map(student => {
                    const count = studentStats[student.id] || 0;
                    // Find last workout separately if needed, or re-enable that logic
                    // For now, let's just use the count as the main stat requested
                    const studentWorkouts = workouts.filter(w => w.studentId === student.id);
                    let lastDate = '-';
                    if (studentWorkouts.length > 0) {
                        const maxDate = Math.max(...studentWorkouts.map(w => new Date(w.date).getTime()));
                        lastDate = new Date(maxDate).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
                    }

                    return (
                        <div
                            key={student.id}
                            onClick={() => handleSelect(student.id)}
                            style={{
                                background: '#fff',
                                borderRadius: '16px',
                                padding: '1rem 1.5rem',
                                display: 'grid',
                                gridTemplateColumns: '60px 2fr 1fr 1fr 40px',
                                alignItems: 'center',
                                gap: '1rem',
                                boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                                cursor: 'pointer',
                                transition: 'transform 0.2s',
                                border: '1px solid #f1f5f9'
                            }}
                            onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.01)'}
                            onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                        >
                            {/* Avatar */}
                            <div style={{
                                width: '40px', height: '40px',
                                background: '#f1f5f9', borderRadius: '50%',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                color: '#64748B'
                            }}>
                                <UserCircle size={24} />
                            </div>

                            {/* Name */}
                            <div style={{ fontWeight: 600, color: '#334155', fontSize: '1rem' }}>
                                {student.name}
                            </div>

                            {/* Workouts Count */}
                            <div style={{ textAlign: 'center' }}>
                                <span style={{
                                    background: '#f1f5f9', padding: '4px 12px', borderRadius: '20px',
                                    fontSize: '0.85rem', fontWeight: 700, color: '#475569'
                                }}>
                                    {count}
                                </span>
                            </div>

                            {/* Last Active */}
                            <div style={{ textAlign: 'center', fontSize: '0.85rem', color: '#94a3b8' }}>
                                {lastDate}
                            </div>

                            {/* Delete */}
                            <button
                                onClick={(e) => handleDelete(e, student.id, student.name)}
                                title="Excluir"
                                style={{
                                    background: 'transparent',
                                    border: 'none',
                                    color: '#cbd5e1',
                                    cursor: 'pointer',
                                    padding: '8px',
                                    display: 'flex',
                                    justifyContent: 'center'
                                }}
                                onMouseEnter={e => e.currentTarget.style.color = '#ef4444'}
                                onMouseLeave={e => e.currentTarget.style.color = '#cbd5e1'}
                            >
                                <Trash2 size={18} />
                            </button>
                        </div>
                    );
                })}
            </div>

            {/* Simple Modal */}
            {isCreating && (
                <div style={{
                    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    zIndex: 100
                }} onClick={() => setIsCreating(false)}>
                    <div style={{
                        background: '#fff', padding: '2rem', borderRadius: '16px', width: '320px',
                        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)'
                    }} onClick={e => e.stopPropagation()}>
                        <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1.5rem' }}>Adicionar Aluna</h2>
                        <form onSubmit={handleCreate}>
                            <input
                                autoFocus
                                type="text"
                                placeholder="Nome da aluna"
                                className="input"
                                style={{ width: '100%', marginBottom: '1rem' }}
                                value={newName}
                                onChange={e => setNewName(e.target.value)}
                            />
                            <div style={{ display: 'flex', gap: '8px' }}>
                                <button type="button" onClick={() => setIsCreating(false)} className="btn" style={{ flex: 1, color: '#64748B' }}>
                                    Cancelar
                                </button>
                                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>
                                    Criar
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default StudentGateway;
