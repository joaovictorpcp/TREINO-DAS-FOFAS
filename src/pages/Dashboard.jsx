import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWorkout } from '../context/WorkoutContext';
import { useStudent } from '../context/StudentContext';
import { Trophy, Rocket, Dumbbell, Bike, Footprints, Waves } from 'lucide-react';
import styles from './Dashboard.module.css';

const Dashboard = () => {
    const context = useWorkout();
    const navigate = useNavigate();
    const workouts = Array.isArray(context.workouts) ? context.workouts : [];
    const { selectedStudentId, students } = useStudent();

    // If no student selected, user should stick to "Select Student" or "Loading"
    // Ideally redirect or show selector.
    const currentStudent = students.find(s => s.id === selectedStudentId);

    // --- WEEKLY STRIP LOGIC ---
    const weeklyStatus = useMemo(() => {
        if (!selectedStudentId) return [];
        const today = new Date();
        const dayOfWeek = today.getDay(); // 0 (Sun) - 6 (Sat)
        const startOfWeek = new Date(today);
        startOfWeek.setDate(today.getDate() - dayOfWeek);
        startOfWeek.setHours(0, 0, 0, 0);

        const days = [];
        for (let i = 0; i < 7; i++) {
            const d = new Date(startOfWeek);
            d.setDate(startOfWeek.getDate() + i);

            const isToday = d.toDateString() === today.toDateString();
            const dTime = d.getTime();
            const todayTime = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
            const isPast = dTime < todayTime;

            // Find workouts for this day
            const dayWorkouts = workouts.filter(w =>
                w.studentId === selectedStudentId &&
                new Date(w.date).toDateString() === d.toDateString()
            );

            let status = 'neutral';
            const hasCompleted = dayWorkouts.some(w => (w.status || '').toLowerCase() === 'completed');

            if (hasCompleted) {
                status = 'completed';
            } else if (dayWorkouts.length > 0) {
                if (isPast) status = 'missed';
                else status = 'planned'; // Future or Today Pending
            } else {
                status = 'neutral'; // No workout scheduled
            }

            days.push({ date: d, status, isToday });
        }
        return days;
    }, [workouts, selectedStudentId]);

    // --- HERO LOGIC ---
    const heroContent = useMemo(() => {
        if (!selectedStudentId) return { type: 'empty' };

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Filter valid workouts: Today or Future
        const validWorkouts = workouts
            .filter(w => w.studentId === selectedStudentId)
            .filter(w => {
                const d = new Date(w.date);
                d.setHours(0, 0, 0, 0); // normalize
                return d >= today;
            })
            .sort((a, b) => new Date(a.date) - new Date(b.date));

        if (validWorkouts.length === 0) return { type: 'empty' };

        // Check for TODAY's workouts
        const todays = validWorkouts.filter(w => new Date(w.date).toDateString() === today.toDateString());

        if (todays.length > 0) {
            return { type: 'today', items: todays };
        } else {
            return { type: 'next', item: validWorkouts[0] };
        }
    }, [workouts, selectedStudentId]);

    // --- GAMIFICATION: RANKING SYSTEM (Optional - keep minimal badge?) ---
    const rankingData = useMemo(() => {
        if (!workouts || !students || !selectedStudentId) return null;
        const scores = {};
        workouts.forEach(w => {
            const s = (w.status || '').toLowerCase();
            if (s === 'completed' || s === 'done' || s === 'finished' || w.isCompleted) {
                scores[w.studentId] = (scores[w.studentId] || 0) + 1;
            }
        });
        const rankedList = Object.entries(scores)
            .map(([sId, score]) => ({ studentId: sId, score }))
            .sort((a, b) => b.score - a.score);

        const myRankIndex = rankedList.findIndex(x => x.studentId === selectedStudentId);
        const myScore = scores[selectedStudentId] || 0;

        return {
            rank: myRankIndex !== -1 ? myRankIndex + 1 : '-',
            score: myScore
        };
    }, [workouts, students, selectedStudentId]);


    const renderHeroCard = (workout, label = "PRÓXIMO TREINO") => (
        <div key={workout.id} className={`${styles.heroCard} glass-panel`} style={{ marginBottom: '1rem', position: 'relative', overflow: 'hidden', border: '1px solid var(--accent-primary)' }}>
            <div style={{ flex: 1, zIndex: 2 }}>
                <div style={{
                    fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.05em', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '6px'
                }}>
                    {label}
                </div>
                <h2 style={{
                    fontSize: '2rem', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1.1, margin: 0, letterSpacing: '-0.02em'
                }}>
                    {workout.name || workout.category || 'Treino do Dia'}
                </h2>

                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginTop: '12px', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'var(--bg-primary)', padding: '4px 10px', borderRadius: '8px' }}>
                        {(!workout.activity_type || workout.activity_type === 'weightlifting') && <Trophy size={14} color="var(--accent-primary)" />}
                        {workout.activity_type === 'running' && <Footprints size={14} color="var(--accent-primary)" />}
                        {workout.activity_type === 'cycling' && <Bike size={14} color="var(--accent-primary)" />}
                        {workout.activity_type === 'swimming' && <Waves size={14} color="var(--accent-primary)" />}

                        <span style={{ fontWeight: 600 }}>
                            {workout.activity_type && workout.activity_type !== 'weightlifting' ? (
                                <>
                                    {workout.activity_type === 'running' && 'Corrida'}
                                    {workout.activity_type === 'cycling' && 'Ciclismo'}
                                    {workout.activity_type === 'swimming' && 'Natação'}
                                </>
                            ) : (
                                workout.exercises && workout.exercises.some(e => (e.muscleGroup || '').includes('Legs')) ? 'Inferiores' : (workout.exercises && workout.exercises.some(e => (e.muscleGroup || '').includes('Chest')) ? 'Peitoral' : 'Geral')
                            )}
                        </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'var(--bg-primary)', padding: '4px 10px', borderRadius: '8px' }}>
                        <span style={{ fontSize: '1em' }}>⏱</span>
                        <span style={{ fontWeight: 600 }}>
                            {workout.duration_minutes ? `~${workout.duration_minutes} min` : `~${Math.max(45, (workout.exercises?.length || 0) * 5)} min`}
                        </span>
                    </div>
                </div>
            </div>

            <div style={{ zIndex: 2 }}>
                <button
                    onClick={() => navigate(`/edit/${workout.id}`)}
                    className="btn-primary"
                    style={{
                        padding: '16px 32px',
                        borderRadius: '16px',
                        fontSize: '0.95rem',
                        fontWeight: 600,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.5)',
                        transition: 'all 0.2s'
                    }}
                >
                    <Rocket size={18} />
                    {workout.status === 'completed' ? 'VER' : 'INICIAR'}
                </button>
            </div>

            {/* Decorative BG */}
            <div style={{
                position: 'absolute', right: -20, top: -20,
                width: '150px', height: '150px',
                background: 'var(--neon-glow)',
                opacity: 0.1,
                borderRadius: '50%', pointerEvents: 'none',
                filter: 'blur(40px)'
            }} />
        </div>
    );

    if (!selectedStudentId) {
        return <div className="p-4" style={{ textAlign: 'center', marginTop: '2rem', color: 'var(--text-muted)' }}>Selecione um aluno para começar.</div>;
    }

    return (
        <div className="page-container animate-fade-in">
            {/* MINIMAL HEADER */}
            <header className={styles.header} style={{ marginBottom: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <h1 className={styles.title} style={{ color: 'var(--text-primary)' }}>
                                {currentStudent ? `Olá, ${currentStudent.name}` : 'Bem-vindo'}
                            </h1>
                            {rankingData && (
                                <div style={{
                                    background: 'rgba(234, 179, 8, 0.2)', color: '#facc15',
                                    padding: '4px 12px', borderRadius: '20px',
                                    fontSize: '0.8rem', fontWeight: 700,
                                    display: 'flex', alignItems: 'center', gap: '6px',
                                    border: '1px solid rgba(234, 179, 8, 0.3)'
                                }}>
                                    <Trophy size={12} />
                                    #{rankingData.rank}
                                </div>
                            )}
                        </div>
                        <div className={styles.subtitle} style={{ marginTop: '4px', color: 'var(--text-secondary)' }}>
                            Foco na execução hoje.
                        </div>
                    </div>
                </div>
            </header>

            <section style={{ maxWidth: '800px', margin: '0 auto' }}>

                {/* 1. WEEKLY STRIP context */}
                <div style={{ marginBottom: '2rem' }}>
                    <div style={{
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                        marginBottom: '0.75rem', padding: '0 4px'
                    }}>
                        <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                            Resumo da Semana
                        </span>
                    </div>
                    <div className="glass-panel" style={{
                        display: 'flex', justifyContent: 'space-between', gap: '8px',
                        padding: '16px', borderRadius: '16px',
                        border: '1px solid var(--border-subtle)'
                    }}>
                        {weeklyStatus.map((day, idx) => (
                            <div key={idx} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', flex: 1 }}>
                                <div style={{
                                    width: '32px', height: '32px', borderRadius: '50%',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    background: day.status === 'completed' ? 'rgba(74, 222, 128, 0.2)' : (day.status === 'missed' ? 'rgba(248, 113, 113, 0.2)' : (day.isToday ? 'var(--bg-secondary)' : 'transparent')),
                                    border: day.isToday ? '2px solid var(--accent-primary)' : (day.status === 'neutral' ? '1px dashed var(--border-subtle)' : '1px solid var(--border-subtle)'),
                                    color: day.status === 'completed' ? 'var(--accent-primary)' : (day.status === 'missed' ? '#f87171' : 'var(--text-muted)'),
                                    fontWeight: 700, fontSize: '0.8rem'
                                }}>
                                    {day.status === 'completed' ? '✓' : (day.status === 'missed' ? '✕' : (day.date.getDate()))}
                                </div>
                                <span style={{ fontSize: '0.65rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                                    {day.date.toLocaleDateString('pt-BR', { weekday: 'short' }).substring(0, 3)}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* 2. HERO SECTION */}
                <div style={{ marginBottom: '2rem' }}>
                    {heroContent.type === 'today' ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>
                                HOJE • {heroContent.items.length} SESSÕES
                            </div>
                            {heroContent.items.map(w => renderHeroCard(w, "TREINO DE HOJE"))}
                        </div>
                    ) : heroContent.type === 'next' ? (
                        renderHeroCard(heroContent.item, "SUA PRÓXIMA MISSÃO")
                    ) : (
                        <div className="glass-panel" style={{ padding: '4rem', textAlign: 'center', borderRadius: '24px' }}>
                            <div style={{ marginBottom: '1rem', background: 'var(--bg-secondary)', width: '64px', height: '64px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' }}>
                                <Trophy size={32} color="var(--text-muted)" />
                            </div>
                            <h3 style={{ fontSize: '1.2rem', fontWeight: 600, color: 'var(--text-primary)' }}>Tudo em dia!</h3>
                            <p style={{ color: 'var(--text-secondary)', maxWidth: '300px', margin: '8px auto' }}>Aproveite o descanso ou registre uma atividade extra.</p>
                            <button onClick={() => navigate('/create')} className="btn-primary" style={{ marginTop: '1rem', display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                                <Rocket size={16} /> Registrar Treino
                            </button>
                        </div>
                    )}
                </div>

            </section>
        </div>
    );
};

export default Dashboard;
