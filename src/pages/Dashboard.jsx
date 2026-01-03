import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWorkout } from '../context/WorkoutContext';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend } from 'recharts';
import { Activity, TrendingUp, Calendar, Layers, Copy, Repeat, Trophy, Rocket } from 'lucide-react';
import styles from './Dashboard.module.css';

import { useStudent } from '../context/StudentContext';

import AttendanceCalendar from '../components/Student/AttendanceCalendar';

const Dashboard = () => {
    const context = useWorkout();
    const navigate = useNavigate();
    const workouts = Array.isArray(context.workouts) ? context.workouts : [];
    const { mirrorWeekToMonth } = context;
    const { selectedStudentId, students } = useStudent();

    console.log('Dashboard render - Workouts:', workouts);

    if (!workouts) {
        return <div className="p-4">Carregando dados...</div>;
    }

    const currentStudent = students.find(s => s.id === selectedStudentId);

    // Filter workouts by student
    const filteredWorkouts = useMemo(() => {
        if (!selectedStudentId) return workouts;
        return workouts.filter(w => w.studentId === selectedStudentId);
    }, [workouts, selectedStudentId]);

    // 1. Group Data by Mesocycle & Week
    const processedData = useMemo(() => {
        // Find latest mesocycle to show "Current Cycle"
        const latestMeso = filteredWorkouts.length > 0
            ? Math.max(...filteredWorkouts.map(w => w.meta?.mesocycle || 1))
            : 1;

        // Has Week 1 Data?
        const hasWeek1Data = filteredWorkouts.some(w =>
            (w.meta?.mesocycle || 1) === latestMeso && (w.meta?.week || 1) === 1
        );

        return { latestMeso, hasWeek1Data };
    }, [filteredWorkouts]);

    const [viewMode, setViewMode] = React.useState('weekly'); // 'weekly' | 'monthly'

    const { latestMeso, hasWeek1Data } = processedData;

    const handleMirror = () => {
        if (window.confirm(`Você está prestes a copiar os treinos da Semana 1 (Meso ${latestMeso}) para as semanas 2, 3 e 4. \n\nOs exercícios serão mantidos, mas cargas e RPE serão zerados para preenchimento futuro.\n\nDeseja continuar?`)) {
            mirrorWeekToMonth(selectedStudentId, latestMeso);
        }
    };

    // --- Next Workout Logic ---
    const { nextWorkout, upcomingWorkouts } = useMemo(() => {
        if (!selectedStudentId) return { nextWorkout: null, upcomingWorkouts: [] };

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Filter: Future workouts for this student
        const future = workouts
            .filter(w => w.studentId === selectedStudentId)
            .filter(w => {
                const wDate = new Date(w.date);
                wDate.setHours(0, 0, 0, 0);
                return wDate >= today;
            })
            .sort((a, b) => new Date(a.date) - new Date(b.date));

        return {
            nextWorkout: future[0] || null,
            upcomingWorkouts: future.slice(1, 6) // Show next 5
        };
    }, [workouts, selectedStudentId]);

    // --- GAMIFICATION: RANKING SYSTEM ---
    const rankingData = useMemo(() => {
        if (!workouts || !students) return null;

        // Count completed workouts per student
        const scores = {};
        workouts.forEach(w => {
            const s = (w.status || '').toLowerCase();
            if (s === 'completed' || s === 'done' || s === 'finished' || w.isCompleted) {
                scores[w.studentId] = (scores[w.studentId] || 0) + 1;
            }
        });

        // Convert to array and sort
        const rankedList = Object.entries(scores)
            .map(([sId, score]) => ({ studentId: sId, score }))
            .sort((a, b) => b.score - a.score);

        // Find current student rank
        const myRankIndex = rankedList.findIndex(x => x.studentId === selectedStudentId);
        const myScore = scores[selectedStudentId] || 0;

        return {
            rank: myRankIndex !== -1 ? myRankIndex + 1 : '-',
            totalStudents: students.length,
            score: myScore
        };
    }, [workouts, students, selectedStudentId]);

    // --- ANALYTICS: MONTHLY PLANNED vs DONE ---
    // (MOVED TO PERFORMANCE PAGE)


    return (
        <div className="page-container animate-fade-in" style={{ paddingBottom: '80px' }}>
            <header className={styles.header}>
                <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '2rem' }}>
                        <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <h1 className={styles.title}>
                                    {currentStudent ? `Painel de ${currentStudent.name}` : 'Painel Geral'}
                                </h1>
                                {/* RANKING BADGE */}
                                {rankingData && selectedStudentId && (
                                    <div style={{
                                        background: '#fef3c7', color: '#b45309',
                                        padding: '4px 12px', borderRadius: '20px',
                                        fontSize: '0.9rem', fontWeight: 700,
                                        display: 'flex', alignItems: 'center', gap: '6px',
                                        boxShadow: '0 2px 5px rgba(245, 158, 11, 0.2)'
                                    }}>
                                        <Trophy size={14} />
                                        #{rankingData.rank} Geral ({rankingData.score} treinos)
                                    </div>
                                )}
                            </div>

                            <div className={styles.subtitle} style={{ display: 'flex', gap: '16px', alignItems: 'center', marginTop: '8px' }}>
                                {currentStudent ? (
                                    <>
                                        <span>Altura: {currentStudent.height || '-'} cm</span>
                                        <span>•</span>
                                        <span>Idade: {currentStudent.birthDate ? Math.floor((new Date() - new Date(currentStudent.birthDate)) / 31557600000) : '-'} anos</span>
                                        <span>•</span>
                                        <span>Peso: {currentStudent.weight || '-'} kg</span>
                                    </>
                                ) : (
                                    <span>Selecione um aluno</span>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Actions Bar */}
                    {selectedStudentId && (
                        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap' }}>
                            <button
                                onClick={() => navigate('/mesocycle-builder')}
                                className="btn-primary"
                                style={{
                                    display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 20px',
                                    borderRadius: '8px', border: 'none', fontWeight: 600, cursor: 'pointer',
                                    fontSize: '0.95rem', boxShadow: '0 4px 6px -1px rgba(var(--accent-primary-rgb), 0.3)'
                                }}
                            >
                                <Repeat size={18} /> Novo Ciclo
                            </button>

                            <button
                                onClick={() => setViewMode(prev => prev === 'monthly' ? 'hero' : 'monthly')}
                                style={{
                                    display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 20px',
                                    borderRadius: '8px', border: '1px solid #e2e8f0', background: '#fff',
                                    color: '#64748B', fontWeight: 600, cursor: 'pointer', fontSize: '0.95rem'
                                }}
                            >
                                <Calendar size={18} /> {viewMode === 'monthly' ? 'Ver Próximos' : 'Ver Calendário'}
                            </button>
                        </div>
                    )}
                </div>
            </header>

            {/* Dashboard Content */}
            {selectedStudentId && (
                <section style={{ marginBottom: '2rem' }}>
                    {viewMode === 'monthly' ? (
                        <AttendanceCalendar
                            viewMode="heatmap"
                            onDayClick={(workoutId) => navigate(`/edit/${workoutId}`)}
                        />
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>

                            {/* TOP ROW: HERO ONLY */}
                            <div style={{ width: '100%' }}>

                                {/* HERO CARD (Compact Horizontal) */}
                                {nextWorkout ? (
                                    <div className={styles.heroCard}>
                                        <div style={{ flex: 1, zIndex: 2 }}>
                                            <div style={{
                                                fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.05em', color: '#94a3b8', textTransform: 'uppercase', marginBottom: '6px'
                                            }}>
                                                PRÓXIMO TREINO
                                            </div>
                                            <h2 style={{
                                                fontSize: '2rem', fontWeight: 800, color: '#0f172a', lineHeight: 1.1, margin: 0, letterSpacing: '-0.02em'
                                            }}>
                                                {nextWorkout.name || nextWorkout.category || 'Treino do Dia'}
                                            </h2>

                                            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginTop: '12px', color: '#64748B', fontSize: '0.9rem' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#f8fafc', padding: '4px 10px', borderRadius: '8px' }}>
                                                    <Trophy size={14} color="#64748b" />
                                                    <span style={{ fontWeight: 600 }}>
                                                        {nextWorkout.exercises && nextWorkout.exercises.some(e => (e.muscleGroup || '').includes('Legs')) ? 'Inferiores' : (nextWorkout.exercises && nextWorkout.exercises.some(e => (e.muscleGroup || '').includes('Chest')) ? 'Peitoral' : 'Geral')}
                                                    </span>
                                                </div>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#f8fafc', padding: '4px 10px', borderRadius: '8px' }}>
                                                    <span style={{ fontSize: '1em' }}>⏱</span>
                                                    <span style={{ fontWeight: 600 }}>~{Math.max(45, (nextWorkout.exercises?.length || 0) * 5)} min</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div style={{ zIndex: 2 }}>
                                            <button
                                                onClick={() => navigate(`/edit/${nextWorkout.id}`)}
                                                style={{
                                                    background: '#0f172a',
                                                    color: '#fff',
                                                    padding: '16px 32px',
                                                    borderRadius: '16px',
                                                    fontSize: '0.95rem',
                                                    fontWeight: 600,
                                                    border: 'none',
                                                    cursor: 'pointer',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '10px',
                                                    boxShadow: '0 10px 25px -5px rgba(15, 23, 42, 0.3)',
                                                    transition: 'all 0.2s'
                                                }}
                                                onMouseEnter={e => {
                                                    e.currentTarget.style.transform = 'translateY(-2px)';
                                                    e.currentTarget.style.boxShadow = '0 15px 30px -5px rgba(15, 23, 42, 0.4)';
                                                }}
                                                onMouseLeave={e => {
                                                    e.currentTarget.style.transform = 'translateY(0)';
                                                    e.currentTarget.style.boxShadow = '0 10px 25px -5px rgba(15, 23, 42, 0.3)';
                                                }}
                                            >
                                                <Rocket size={18} />
                                                INICIAR SESSÃO
                                            </button>
                                        </div>

                                        {/* Decorative BG */}
                                        <div style={{
                                            position: 'absolute', right: -20, top: -20,
                                            width: '150px', height: '150px',
                                            background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.05) 0%, rgba(59, 130, 246, 0) 70%)',
                                            borderRadius: '50%', pointerEvents: 'none'
                                        }} />
                                    </div>
                                ) : (
                                    <div style={{ padding: '4rem', textAlign: 'center', background: '#fff', borderRadius: '24px', border: '1px solid #f1f5f9' }}>
                                        <h3 style={{ fontSize: '1.2rem', fontWeight: 600, color: '#94a3b8' }}>Sem treinos futuros</h3>
                                    </div>
                                )}
                            </div>

                            {/* EXERCISES LIST - COMPACT ROWS (If Next Workout Exists) */}
                            {nextWorkout && nextWorkout.exercises?.length > 0 && (
                                <div style={{ marginBottom: '0rem' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                                        <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#334155' }}>Exercícios ({nextWorkout.exercises.length})</h3>
                                    </div>
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '12px' }}>
                                        {nextWorkout.exercises.map((ex, idx) => (
                                            <div key={idx} style={{
                                                display: 'flex', alignItems: 'center', gap: '16px',
                                                padding: '12px 16px',
                                                borderRadius: '12px',
                                                background: '#fff',
                                                border: '1px solid #f1f5f9',
                                                boxShadow: '0 1px 2px rgba(0,0,0,0.02)'
                                            }}>
                                                <div style={{
                                                    width: '28px', height: '28px', borderRadius: '8px',
                                                    background: '#f8fafc', color: '#94a3b8',
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                    fontSize: '0.8rem', fontWeight: 700
                                                }}>
                                                    {idx + 1}
                                                </div>
                                                <div style={{ flex: 1 }}>
                                                    <div style={{ fontSize: '0.9rem', fontWeight: 600, color: '#334155' }}>
                                                        {ex.name}
                                                    </div>
                                                </div>
                                                <div style={{ fontSize: '0.8rem', color: '#64748B', fontWeight: 500, background: '#f1f5f9', padding: '4px 8px', borderRadius: '6px' }}>
                                                    {ex.sets}x{ex.reps}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* UPCOMING TIMELINE - Horizontal Grid */}
                            {upcomingWorkouts.length > 0 && (
                                <div style={{ marginBottom: '2rem' }}>
                                    <div style={{
                                        display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1rem',
                                        paddingLeft: '0.25rem', opacity: 0.8
                                    }}>
                                        <Calendar size={14} color="#64748B" />
                                        <span style={{ textTransform: 'uppercase', fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.05em', color: '#64748B' }}>
                                            Próximos Dias
                                        </span>
                                    </div>

                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))', gap: '16px' }}>
                                        {upcomingWorkouts.slice(0, 5).map((w, idx) => (
                                            <div key={w.id}
                                                onClick={() => navigate(`/edit/${w.id}`)}
                                                style={{
                                                    background: '#fff',
                                                    borderRadius: '16px',
                                                    padding: '16px',
                                                    display: 'flex',
                                                    flexDirection: 'column',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    textAlign: 'center',
                                                    cursor: 'pointer',
                                                    border: '1px solid #f1f5f9',
                                                    transition: 'all 0.2s',
                                                    minHeight: '110px',
                                                    boxShadow: '0 2px 5px rgba(0,0,0,0.01)'
                                                }}
                                                onMouseEnter={e => {
                                                    e.currentTarget.style.borderColor = '#cbd5e1';
                                                    e.currentTarget.style.transform = 'translateY(-2px)';
                                                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.05)';
                                                }}
                                                onMouseLeave={e => {
                                                    e.currentTarget.style.borderColor = '#f1f5f9';
                                                    e.currentTarget.style.transform = 'translateY(0)';
                                                    e.currentTarget.style.boxShadow = '0 2px 5px rgba(0,0,0,0.01)';
                                                }}
                                            >
                                                <span style={{ fontSize: '0.7rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', marginBottom: '4px' }}>
                                                    {new Date(w.date).toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.', '')}
                                                </span>
                                                <span style={{ fontSize: '1.1rem', fontWeight: 800, color: '#334155', lineHeight: 1 }}>
                                                    {new Date(w.date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
                                                </span>
                                                <div style={{ width: '20px', height: '2px', background: '#e2e8f0', margin: '8px 0' }} />
                                                <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748B', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '100%' }}>
                                                    {w.category || 'Treino'}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                        </div>
                    )}
                </section>
            )
            }
        </div >
    );
};

export default Dashboard;
