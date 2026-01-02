import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWorkout } from '../context/WorkoutContext';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend } from 'recharts';
import { Activity, TrendingUp, Calendar, Layers } from 'lucide-react';
import styles from './Dashboard.module.css';

import { useStudent } from '../context/StudentContext';

import BiometricCard from '../components/Student/BiometricCard';
import AttendanceCalendar from '../components/Student/AttendanceCalendar';


import { Copy, Repeat } from 'lucide-react';

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

    // --- Analytics Logic ---
    // ... (rest of analytics logic remains same for now)

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

        // Current Cycle Data (Weeks 1-4)
        const currentCycleData = [1, 2, 3, 4].map(week => {
            const weekWorkouts = filteredWorkouts.filter(w =>
                (w.meta?.mesocycle || 1) === latestMeso &&
                (w.meta?.week || 1) === week
            );

            if (weekWorkouts.length === 0) return { name: `S${week}`, volume: 0, rpe: 0 };

            const totalVol = weekWorkouts.reduce((acc, w) => {
                return acc + (w.exercises?.reduce((v, ex) => v + (ex.vtt || 0), 0) || 0);
            }, 0);

            const avgRpe = weekWorkouts.reduce((acc, w) => {
                const sessionRpe = w.exercises?.reduce((r, ex) => r + (ex.rpe || 0), 0) / (w.exercises?.length || 1);
                return acc + sessionRpe;
            }, 0) / weekWorkouts.length;

            return {
                name: `W${week}`,
                volume: totalVol,
                rpe: parseFloat(avgRpe.toFixed(1))
            };
        });

        // Macrocycle Data (Mesos 1-6)
        const macroData = [1, 2, 3, 4, 5, 6].map(meso => {
            const mesoWorkouts = filteredWorkouts.filter(w => (w.meta?.mesocycle || 1) === meso);
            const totalVol = mesoWorkouts.reduce((acc, w) => {
                return acc + (w.exercises?.reduce((v, ex) => v + (ex.vtt || 0), 0) || 0);
            }, 0);
            return { name: `Meso ${meso}`, volume: totalVol };
        });

        return { currentCycleData, macroData, latestMeso, hasWeek1Data };
    }, [workouts, filteredWorkouts]);

    const [viewMode, setViewMode] = React.useState('weekly'); // 'weekly' | 'monthly'

    const { currentCycleData, macroData, latestMeso, hasWeek1Data } = processedData;

    const handleMirror = () => {
        if (window.confirm(`Você está prestes a copiar os treinos da Semana 1 (Meso ${latestMeso}) para as semanas 2, 3 e 4. \n\nOs exercícios serão mantidos, mas cargas e RPE serão zerados para preenchimento futuro.\n\nDeseja continuar?`)) {
            mirrorWeekToMonth(selectedStudentId, latestMeso);
        }
    };

    // Weekly View Logic
    const weeklyWorkouts = useMemo(() => {
        if (!selectedStudentId) return [];

        const now = new Date();
        const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay()));
        const endOfWeek = new Date(now.setDate(now.getDate() - now.getDay() + 6));
        // Ensure comparison covers the whole day
        startOfWeek.setHours(0, 0, 0, 0);
        endOfWeek.setHours(23, 59, 59, 999);

        return workouts.filter(w => {
            if (w.studentId !== selectedStudentId) return false;
            const wDate = new Date(w.date);
            return wDate >= startOfWeek && wDate <= endOfWeek;
        });
    }, [workouts, selectedStudentId]);

    const categorizedWorkouts = {
        A: weeklyWorkouts.filter(w => (w.category || 'A') === 'A'),
        B: weeklyWorkouts.filter(w => (w.category || 'A') === 'B'),
        C: weeklyWorkouts.filter(w => (w.category || 'A') === 'C')
    };

    return (
        <div className="page-container animate-fade-in">
            <header className={styles.header}>
                <div>
                    {/* Greeting */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '2rem' }}>
                        <div>
                            <h1 className={styles.title}>
                                {currentStudent ? `Painel de ${currentStudent.name}` : 'Painel Geral'}
                            </h1>
                            <p className={styles.subtitle}>Visão geral do progresso</p>
                        </div>
                    </div>

                    {/* Ranking Banner */}
                    {currentStudent && (
                        <div className="animate-fade-in" style={{
                            background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
                            borderRadius: '16px',
                            padding: '1.5rem',
                            marginBottom: '2rem',
                            color: '#fff',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
                        }}>
                            {(() => {
                                // Calculate Ranking Logic
                                const allStats = students.map(s => {
                                    const sWorkouts = workouts.filter(w => w.studentId === s.id);
                                    const count = sWorkouts.length;
                                    const totalLoad = sWorkouts.reduce((acc, w) => {
                                        // Simple volume proxy: sum of all loads recorded (might be loose but better than nothing)
                                        return acc + (w.exercises?.reduce((v, ex) => v + (parseFloat(ex.load) || 0), 0) || 0);
                                    }, 0);
                                    return { id: s.id, name: s.name, count, totalLoad };
                                });

                                // Sort by Count then Load
                                allStats.sort((a, b) => {
                                    if (b.count !== a.count) return b.count - a.count;
                                    return b.totalLoad - a.totalLoad;
                                });

                                const myRank = allStats.findIndex(s => s.id === currentStudent.id) + 1;
                                const myStat = allStats.find(s => s.id === currentStudent.id);
                                const isFirst = myRank === 1;

                                return (
                                    <>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                            <div style={{
                                                width: '48px', height: '48px',
                                                background: isFirst ? '#fbbf24' : 'rgba(255,255,255,0.1)',
                                                borderRadius: '50%',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                fontSize: '1.5rem', fontWeight: 800,
                                                color: isFirst ? '#78350f' : '#fff'
                                            }}>
                                                {myRank}º
                                            </div>
                                            <div>
                                                <h3 style={{ fontSize: '1.1rem', fontWeight: 600, margin: 0 }}>
                                                    {isFirst ? 'Parabéns! Você lidera o ranking!' : `Você está em ${myRank}º lugar`}
                                                </h3>
                                                <p style={{ color: '#94a3b8', fontSize: '0.9rem', margin: 0 }}>
                                                    {myStat?.count} treinos realizados
                                                </p>
                                            </div>
                                        </div>
                                        <div style={{ textAlign: 'right', display: 'none', md: { display: 'block' } }}>
                                            <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Volume Total</div>
                                            <div style={{ fontSize: '1.1rem', fontWeight: 700 }}>{myStat?.totalLoad.toLocaleString()} kg</div>
                                        </div>
                                    </>
                                );
                            })()}
                        </div>
                    )}
                </div>
                {/* View Toggle */}
                {selectedStudentId && (
                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                        {hasWeek1Data && (
                            <button
                                onClick={handleMirror}
                                title="Clonar Semana 1 para o mês todo"
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '6px',
                                    padding: '6px 16px',
                                    borderRadius: '6px',
                                    border: '1px solid var(--accent-primary)',
                                    background: '#eff6ff',
                                    color: 'var(--accent-primary)',
                                    fontWeight: 600,
                                    cursor: 'pointer',
                                    height: '100%',
                                    whiteSpace: 'nowrap'
                                }}
                            >
                                <Copy size={16} /> Preencher Mês
                            </button>
                        )}

                        <button
                            onClick={() => {
                                if (window.confirm("Deseja criar um NOVO mesociclo baseado no atual? (Copia estrutura para +4 semanas)")) {
                                    context.duplicateMesocycleToNext(selectedStudentId, latestMeso);
                                }
                            }}
                            className="btn-primary"
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                                padding: '6px 16px',
                                borderRadius: '6px',
                                border: 'none',
                                fontWeight: 600,
                                cursor: 'pointer',
                                height: '100%',
                                whiteSpace: 'nowrap',
                                fontSize: '0.9rem'
                            }}
                        >
                            <Repeat size={16} /> Novo Ciclo
                        </button>

                        <div style={{ display: 'flex', background: '#e2e8f0', borderRadius: '8px', padding: '4px' }}>
                            <button
                                onClick={() => setViewMode('weekly')}
                                style={{
                                    padding: '6px 16px',
                                    borderRadius: '6px',
                                    border: 'none',
                                    background: viewMode === 'weekly' ? '#fff' : 'transparent',
                                    color: viewMode === 'weekly' ? '#0f172a' : '#64748B',
                                    fontWeight: 600,
                                    cursor: 'pointer',
                                    boxShadow: viewMode === 'weekly' ? '0 1px 2px rgba(0,0,0,0.1)' : 'none',
                                    transition: 'all 0.2s'
                                }}
                            >
                                Semana
                            </button>
                            <button
                                onClick={() => setViewMode('monthly')}
                                style={{
                                    padding: '6px 16px',
                                    borderRadius: '6px',
                                    border: 'none',
                                    background: viewMode === 'monthly' ? '#fff' : 'transparent',
                                    color: viewMode === 'monthly' ? '#0f172a' : '#64748B',
                                    fontWeight: 600,
                                    cursor: 'pointer',
                                    boxShadow: viewMode === 'monthly' ? '0 1px 2px rgba(0,0,0,0.1)' : 'none',
                                    transition: 'all 0.2s'
                                }}
                            >
                                Mês
                            </button>
                        </div>
                    </div>
                )}
            </header>

            {/* Profile & Attendance Section */}
            {selectedStudentId && (
                <section style={{ marginBottom: '2rem' }}>
                    <BiometricCard />

                    {viewMode === 'monthly' ? (
                        <AttendanceCalendar
                            viewMode="heatmap"
                            onDayClick={(workoutId) => navigate(`/edit/${workoutId}`)}
                        />
                    ) : (
                        // Weekly Kanban View
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem' }}>
                            {/* Type A */}
                            <div style={{ background: '#eff6ff', borderRadius: '12px', padding: '1rem', border: '1px solid #dbeafe' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                                    <span style={{ fontWeight: 700, color: '#1e40af' }}>Treino A</span>
                                    <span style={{ background: '#2563eb', color: '#fff', padding: '2px 8px', borderRadius: '12px', fontSize: '0.8rem' }}>{categorizedWorkouts.A.length}</span>
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                    {categorizedWorkouts.A.length === 0 && <span style={{ fontSize: '0.9rem', color: '#60a5fa', fontStyle: 'italic' }}>Nenhum treino A esta semana</span>}
                                    {categorizedWorkouts.A.map(w => {
                                        const names = w.exercises?.slice(0, 3).map(e => e.name).join(', ') || 'Treino';
                                        return (
                                            <div key={w.id} style={{ background: '#fff', padding: '10px', borderRadius: '8px', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
                                                <div style={{ fontSize: '0.85rem', color: '#64748B', display: 'flex', justifyContent: 'space-between' }}>
                                                    <span>{new Date(w.date).toLocaleDateString('pt-BR')}</span>
                                                    {w.exercises?.some(e => e.supersetId) && <span title="Possui conjugados" style={{ color: '#2563eb' }}>🔗</span>}
                                                </div>
                                                <div style={{ fontWeight: 600, color: '#1e293b' }}>{names}{w.exercises?.length > 3 ? '...' : ''}</div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Type B */}
                            <div style={{ background: '#f0fdf4', borderRadius: '12px', padding: '1rem', border: '1px solid #dcfce7' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                                    <span style={{ fontWeight: 700, color: '#166534' }}>Treino B</span>
                                    <span style={{ background: '#16a34a', color: '#fff', padding: '2px 8px', borderRadius: '12px', fontSize: '0.8rem' }}>{categorizedWorkouts.B.length}</span>
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                    {categorizedWorkouts.B.length === 0 && <span style={{ fontSize: '0.9rem', color: '#4ade80', fontStyle: 'italic' }}>Nenhum treino B esta semana</span>}
                                    {categorizedWorkouts.B.map(w => {
                                        const names = w.exercises?.slice(0, 3).map(e => e.name).join(', ') || 'Treino';
                                        return (
                                            <div key={w.id} style={{ background: '#fff', padding: '10px', borderRadius: '8px', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
                                                <div style={{ fontSize: '0.85rem', color: '#64748B', display: 'flex', justifyContent: 'space-between' }}>
                                                    <span>{new Date(w.date).toLocaleDateString('pt-BR')}</span>
                                                    {w.exercises?.some(e => e.supersetId) && <span title="Possui conjugados" style={{ color: '#16a34a' }}>🔗</span>}
                                                </div>
                                                <div style={{ fontWeight: 600, color: '#1e293b' }}>{names}{w.exercises?.length > 3 ? '...' : ''}</div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Type C */}
                            <div style={{ background: '#fff7ed', borderRadius: '12px', padding: '1rem', border: '1px solid #ffedd5' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                                    <span style={{ fontWeight: 700, color: '#9a3412' }}>Treino C</span>
                                    <span style={{ background: '#ea580c', color: '#fff', padding: '2px 8px', borderRadius: '12px', fontSize: '0.8rem' }}>{categorizedWorkouts.C.length}</span>
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                    {categorizedWorkouts.C.length === 0 && <span style={{ fontSize: '0.9rem', color: '#fb923c', fontStyle: 'italic' }}>Nenhum treino C esta semana</span>}
                                    {categorizedWorkouts.C.map(w => {
                                        // Group exercises by superset for display
                                        const displayExercises = []; // Array of strings or groups

                                        // Simple exercise name extraction mainly for summary
                                        const names = w.exercises?.slice(0, 3).map(e => e.name).join(', ') || 'Treino';

                                        return (
                                            <div key={w.id} style={{ background: '#fff', padding: '10px', borderRadius: '8px', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
                                                <div style={{ fontSize: '0.85rem', color: '#64748B', display: 'flex', justifyContent: 'space-between' }}>
                                                    <span>{new Date(w.date).toLocaleDateString('pt-BR')}</span>
                                                    {w.exercises?.some(e => e.supersetId) && <span title="Possui conjugados" style={{ color: 'var(--accent-primary)' }}>🔗</span>}
                                                </div>
                                                <div style={{ fontWeight: 600, color: '#1e293b' }}>{names}{w.exercises?.length > 3 ? '...' : ''}</div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    )}
                </section>
            )}

            {/* KPI Cards */}
            <section className={styles.statsGrid}>
                <div className={`glass-panel ${styles.statCard}`}>
                    <div className={styles.statIcon} style={{ background: 'rgba(167, 199, 231, 0.2)', color: 'var(--accent-primary)' }}>
                        <Layers size={24} />
                    </div>
                    <div>
                        <p className={styles.statLabel}>Mesociclo Atual</p>
                        <p className={styles.statValue}>#{latestMeso}</p>
                    </div>
                </div>
                <div className={`glass-panel ${styles.statCard}`}>
                    <div className={styles.statIcon} style={{ background: 'rgba(178, 244, 199, 0.2)', color: 'var(--success)' }}>
                        <Activity size={24} />
                    </div>
                    <div>
                        <p className={styles.statLabel}>Volume (Semana Atual)</p>
                        <p className={styles.statValue}>
                            {currentCycleData.find(d => d.volume > 0)?.volume?.toLocaleString() || 0} kg
                        </p>
                    </div>
                </div>
            </section>

            {/* Charts Grid */}
            <section className={styles.chartsGrid}>
                {/* Chart 1: Current Mesocycle Progress (Weeks 1-4) */}
                <div className={`glass-panel ${styles.chartContainer}`}>
                    <div className={styles.chartHeader}>
                        <h3>Mesociclo #{latestMeso} (4 Semanas)</h3>
                        <p>Progresso curto prazo: Volume vs Intensidade</p>
                    </div>
                    <div style={{ height: 300, width: '100%', minWidth: 0 }}>
                        <ResponsiveContainer>
                            <LineChart data={currentCycleData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-subtle)" />
                                <XAxis dataKey="name" tick={{ fill: '#64748B', fontSize: 12 }} axisLine={false} tickLine={false} />
                                <YAxis yAxisId="left" tick={{ fill: '#64748B', fontSize: 12 }} axisLine={false} tickLine={false} />
                                <YAxis yAxisId="right" orientation="right" domain={[0, 10]} tick={{ fill: '#64748B', fontSize: 12 }} axisLine={false} tickLine={false} />
                                <Tooltip
                                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                                />
                                <Legend />
                                <Line yAxisId="left" type="monotone" dataKey="volume" stroke="var(--accent-primary)" strokeWidth={3} dot={{ r: 5 }} name="Volume (kg)" />
                                <Line yAxisId="right" type="monotone" dataKey="rpe" stroke="#FFB7B2" strokeWidth={3} dot={{ r: 5 }} name="RPE Médio" />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Chart 2: Macrocycle Overview (Mesos 1-6) */}
                <div className={`glass-panel ${styles.chartContainer}`}>
                    <div className={styles.chartHeader}>
                        <h3>Macrociclo (Visão Geral 24 Semanas)</h3>
                        <p>Volume Acumulado por Mesociclo</p>
                    </div>
                    <div style={{ height: 300, width: '100%', minWidth: 0 }}>
                        <ResponsiveContainer>
                            <BarChart data={macroData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-subtle)" />
                                <XAxis dataKey="name" tick={{ fill: '#64748B', fontSize: 12 }} axisLine={false} tickLine={false} />
                                <YAxis tick={{ fill: '#64748B', fontSize: 12 }} axisLine={false} tickLine={false} />
                                <Tooltip cursor={{ fill: 'rgba(0,0,0,0.02)' }} contentStyle={{ borderRadius: '8px', border: 'none' }} />
                                <Bar dataKey="volume" fill="#D1DCE5" radius={[4, 4, 0, 0]} name="Volume Total">
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default Dashboard;
