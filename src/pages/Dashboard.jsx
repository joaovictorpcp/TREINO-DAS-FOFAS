import React, { useMemo } from 'react';
import { useWorkout } from '../context/WorkoutContext';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend } from 'recharts';
import { Activity, TrendingUp, Calendar, Layers } from 'lucide-react';
import styles from './Dashboard.module.css';

const Dashboard = () => {
    const { workouts } = useWorkout();

    // --- Analytics Logic ---

    // 1. Group Data by Mesocycle & Week
    const processedData = useMemo(() => {
        // Find latest mesocycle to show "Current Cycle"
        const latestMeso = workouts.length > 0
            ? Math.max(...workouts.map(w => w.meta?.mesocycle || 1))
            : 1;

        // Current Cycle Data (Weeks 1-4)
        const currentCycleData = [1, 2, 3, 4].map(week => {
            const weekWorkouts = workouts.filter(w =>
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
            const mesoWorkouts = workouts.filter(w => (w.meta?.mesocycle || 1) === meso);
            const totalVol = mesoWorkouts.reduce((acc, w) => {
                return acc + (w.exercises?.reduce((v, ex) => v + (ex.vtt || 0), 0) || 0);
            }, 0);
            return { name: `Meso ${meso}`, volume: totalVol };
        });

        return { currentCycleData, macroData, latestMeso };
    }, [workouts]);

    const { currentCycleData, macroData, latestMeso } = processedData;

    return (
        <div className="page-container animate-fade-in">
            <header className={styles.header}>
                <div>
                    <h1 className={styles.title}>Painel Geral</h1>
                    <p className={styles.subtitle}>Visão do Macrociclo (24 Semanas)</p>
                </div>
            </header>

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
                    <div style={{ height: 300, width: '100%' }}>
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
                    <div style={{ height: 300, width: '100%' }}>
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
