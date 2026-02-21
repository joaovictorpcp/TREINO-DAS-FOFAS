import React, { useMemo } from 'react';
import { useStudent } from '../context/StudentContext';
import { useWorkout } from '../context/WorkoutContext';
import { useNavigate } from 'react-router-dom';
import { UserCircle, Trash2, Plus } from 'lucide-react';

const StudentGateway = () => {
    const { students, setSelectedStudentId, deleteStudent } = useStudent();
    const { workouts, clearWorkouts } = useWorkout();
    const navigate = useNavigate();

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
            clearWorkouts(id);
        }
    };


    // Calculate basic stats for sorting or display
    const studentStats = useMemo(() => {
        const stats = {};
        (students || []).forEach(student => {
            const count = workouts.filter(w => w.studentId === student.id).length;
            stats[student.id] = count;
        });
        return stats;
    }, [students, workouts]);

    return (
        <div style={{
            minHeight: '100vh',
            background: 'var(--bg-primary)',
            padding: '2rem',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center'
        }}>
            <header style={{ marginBottom: '3rem', textAlign: 'center' }}>
                <h1 style={{
                    fontSize: '2.5rem',
                    color: 'var(--text-primary)',
                    fontWeight: '800',
                    letterSpacing: '-1px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '16px',
                    justifyContent: 'center',
                    marginBottom: '0.5rem'
                }}>
                    <img src="/logo-jv.png" alt="Logo" style={{ height: '90px', width: 'auto', objectFit: 'contain', mixBlendMode: 'screen', filter: 'brightness(0.6) contrast(1.5)' }} />
                    <div style={{ display: 'flex', flexDirection: 'column', lineHeight: '1', textAlign: 'left' }}>
                        <span style={{ fontFamily: '"Orbitron", sans-serif', fontSize: '2.5rem', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '0.05em' }}>
                            JOÃO VICTOR
                        </span>
                        <span style={{ fontFamily: '"Orbitron", sans-serif', fontSize: '1rem', fontWeight: 600, color: 'var(--accent-primary)', letterSpacing: '0.15em', textTransform: 'uppercase', marginTop: '4px' }}>
                            Personal Trainer
                        </span>
                    </div>
                </h1>
                <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem' }}>Módulo de Gerenciamento de Atletas</p>
            </header>

            <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '1rem',
                maxWidth: '900px',
                width: '100%'
            }}>
                {/* Header Row */}
                <div style={{
                    display: 'grid', gridTemplateColumns: '60px 2fr 1fr 1fr 40px', gap: '1rem',
                    padding: '0 1.5rem', marginBottom: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase'
                }}>
                    <span></span>
                    <span>Atleta</span>
                    <span style={{ textAlign: 'center' }}>Sessões</span>
                    <span style={{ textAlign: 'center' }}>Atividade</span>
                    <span></span>
                </div>

                {/* Add New Row */}
                <div
                    onClick={() => alert('Para adicionar atletas, peça para criarem uma conta no app.')}
                    className="glass-panel"
                    style={{
                        background: 'rgba(255, 255, 255, 0.03)',
                        borderRadius: '16px',
                        border: '1px dashed var(--border-subtle)',
                        padding: '1rem 1.5rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '12px',
                        cursor: 'pointer',
                        color: 'var(--text-secondary)',
                        transition: 'all 0.2s',
                        height: '72px'
                    }}
                    onMouseEnter={e => {
                        e.currentTarget.style.borderColor = 'var(--accent-primary)';
                        e.currentTarget.style.color = 'var(--text-primary)';
                        e.currentTarget.style.background = 'rgba(0, 230, 118, 0.05)';
                    }}
                    onMouseLeave={e => {
                        e.currentTarget.style.borderColor = 'var(--border-subtle)';
                        e.currentTarget.style.color = 'var(--text-secondary)';
                        e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)';
                    }}
                >
                    <Plus size={20} />
                    <span style={{ fontWeight: 600 }}>Nova Atleta</span>
                </div>

                {/* Empty State */}
                {(!students || students.length === 0) && (
                    <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>
                        Nenhuma atleta cadastrada. Peça para suas alunas criarem uma conta!
                    </div>
                )}

                {/* Student Rows */}
                {(students || []).map(student => {
                    const count = studentStats[student.id] || 0;

                    // Como ainda vamos desenvolver sessões e atividades reais futuramente, 
                    // deixamos os placeholders ou apenas valores vazios conforme solicitado.

                    return (
                        <div
                            key={student.id}
                            onClick={() => handleSelect(student.id)}
                            className="glass-panel"
                            style={{
                                padding: '1rem 1.5rem',
                                display: 'grid',
                                gridTemplateColumns: '60px 2fr 1fr 1fr 40px',
                                alignItems: 'center',
                                gap: '1rem',
                                cursor: 'pointer',
                                transition: 'all 0.2s',
                                border: '1px solid transparent' // reset for glass panel hover override if needed
                            }}
                            onMouseEnter={e => {
                                e.currentTarget.style.transform = 'scale(1.01)';
                                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)';
                                e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
                            }}
                            onMouseLeave={e => {
                                e.currentTarget.style.transform = 'scale(1)';
                                e.currentTarget.style.borderColor = 'transparent';
                                e.currentTarget.style.background = 'var(--bg-card)';
                            }}
                        >
                            {/* Avatar */}
                            <div style={{
                                width: '40px', height: '40px',
                                background: '#18181B', borderRadius: '50%',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                color: 'var(--text-secondary)',
                                border: '1px solid var(--border-subtle)'
                            }}>
                                <UserCircle size={24} />
                            </div>

                            {/* Name */}
                            <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '1rem' }}>
                                {student.name || student.full_name || 'Aluna sem nome'}
                            </div>

                            {/* Workouts Count (Placeholder for now) */}
                            <div style={{ textAlign: 'center' }}>
                                <span style={{
                                    background: '#18181B', padding: '4px 12px', borderRadius: '20px',
                                    fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-light)', border: '1px solid var(--border-subtle)'
                                }}>
                                    0
                                </span>
                            </div>

                            {/* Atividade (Placeholder) */}
                            <div style={{ textAlign: 'center', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                                -
                            </div>

                            {/* Delete */}
                            <button
                                onClick={(e) => handleDelete(e, student.id, student.name)}
                                title="Excluir"
                                style={{
                                    background: 'transparent',
                                    border: 'none',
                                    color: 'var(--text-muted)',
                                    cursor: 'pointer',
                                    padding: '8px',
                                    display: 'flex',
                                    justifyContent: 'center'
                                }}
                                onMouseEnter={e => e.currentTarget.style.color = 'var(--accent-danger)'}
                                onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
                            >
                                <Trash2 size={18} />
                            </button>
                        </div>
                    );
                })}
            </div>

            {/* The old Simple Modal for creation was removed as athletes now register themselves via the RegisterPage */}
        </div>
    );
};

export default StudentGateway;
