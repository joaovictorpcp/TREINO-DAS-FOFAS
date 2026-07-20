
import React, { useMemo, useState } from 'react';
import { useWorkout } from '../context/WorkoutContext';
import { useStudent } from '../context/StudentContext';
import { useAuth } from '../context/AuthContext';
import {
    ResponsiveContainer, ComposedChart, Line, Area, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, BarChart
} from 'recharts';
import { Activity, Battery, TrendingUp, Calendar, FileText, Printer, Award, AlertCircle } from 'lucide-react';

const StatCard = ({ title, value, label, color, icon: Icon }) => (
    <div style={{
        background: '#fff', borderRadius: '16px', padding: '20px',
        boxShadow: '0 4px 20px rgba(0,0,0,0.03)', border: '1px solid rgba(0,0,0,0.04)',
        display: 'flex', flexDirection: 'column', gap: '8px'
    }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#64748B', fontSize: '0.9rem', fontWeight: 600 }}>
            {Icon && <Icon size={16} color={color} />}
            {title}
        </div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
            <span style={{ fontSize: '2rem', fontWeight: 800, color: '#0f172a' }}>{value}</span>
            <span style={{ fontSize: '0.85rem', color: color, fontWeight: 700 }}>{label}</span>
        </div>
    </div>
);

const PerformancePage = () => {
    const { getPMCData, workouts } = useWorkout(); // Access workouts directly
    const { selectedStudentId, currentStudent } = useStudent();
    const { role } = useAuth();

    const [reportPeriod, setReportPeriod] = useState('month'); // 'month', 'last30', 'prev_month', 'all'
    const [notes, setNotes] = useState('');

    const reportStats = useMemo(() => {
        if (!selectedStudentId || !workouts) return null;

        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();

        const studentWorkouts = Array.isArray(workouts) ? workouts.filter(w => w.studentId === selectedStudentId) : [];

        const filtered = studentWorkouts.filter(w => {
            const d = new Date(w.date);
            if (reportPeriod === 'month') {
                return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
            } else if (reportPeriod === 'prev_month') {
                const prevMonth = currentMonth === 0 ? 11 : currentMonth - 1;
                const prevYear = currentMonth === 0 ? currentYear - 1 : currentYear;
                return d.getMonth() === prevMonth && d.getFullYear() === prevYear;
            } else if (reportPeriod === 'last30') {
                const limit = new Date();
                limit.setDate(limit.getDate() - 30);
                return d >= limit;
            }
            return true; // 'all'
        });

        // 1. Dias Treinados (Completed workouts)
        const trained = filtered.filter(w => {
            const s = (w.status || '').toLowerCase();
            return s === 'completed' || s === 'done' || s === 'finished' || w.isCompleted;
        });
        const diasTreinados = trained.length;

        // 2. Treinos Faltosos (Planned in the past, but not completed)
        const missed = filtered.filter(w => {
            const d = new Date(w.date);
            d.setHours(0, 0, 0, 0);
            const s = (w.status || '').toLowerCase();
            const isCompleted = s === 'completed' || s === 'done' || s === 'finished' || w.isCompleted;
            return d < today && !isCompleted;
        });
        const treinosFaltosos = missed.length;

        // 3. Total planejado no período
        const totalPlanejado = filtered.length;

        // 4. Adesão (%)
        const taxaAdesao = totalPlanejado > 0 ? Math.round((diasTreinados / totalPlanejado) * 100) : 100;

        // 5. Cargas mínima e máxima
        let minLoad = Infinity;
        let maxLoad = -Infinity;
        let hasLoads = false;
        const exerciseCounts = {};

        trained.forEach(w => {
            if (w.exercises && Array.isArray(w.exercises)) {
                w.exercises.forEach(ex => {
                    // Exercise count
                    const name = (ex.name || 'Sem nome').trim();
                    exerciseCounts[name] = (exerciseCounts[name] || 0) + 1;

                    // Load
                    const loadVal = parseFloat(ex.load);
                    if (!isNaN(loadVal) && loadVal > 0) {
                        if (loadVal < minLoad) minLoad = loadVal;
                        if (loadVal > maxLoad) maxLoad = loadVal;
                        hasLoads = true;
                    }
                });
            }
        });

        // Top 5 Exercises
        const topExercises = Object.entries(exerciseCounts)
            .map(([name, count]) => ({ name, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 5);

        return {
            diasTreinados,
            treinosFaltosos,
            totalPlanejado,
            taxaAdesao,
            minCarga: hasLoads ? minLoad : 0,
            maxCarga: hasLoads ? maxLoad : 0,
            topExercises,
            periodText: reportPeriod === 'month' ? 'Mês Atual' :
                        reportPeriod === 'prev_month' ? 'Mês Anterior' :
                        reportPeriod === 'last30' ? 'Últimos 30 Dias' : 'Todo o Período'
        };
    }, [workouts, selectedStudentId, reportPeriod]);

    const pmcData = useMemo(() => {
        if (!selectedStudentId) return [];
        return getPMCData(selectedStudentId);
    }, [selectedStudentId, getPMCData]);

    const latest = pmcData.length > 0 ? pmcData[pmcData.length - 1] : { fitness: 0, fatigue: 0, form: 0 };

    // --- MONTHLY STATS LOGIC ---
    const monthlyStats = useMemo(() => {
        if (!selectedStudentId || !workouts) return { name: 'Mês Atual', planned: 0, done: 0, completionRate: 0 };

        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();

        const studentWorkouts = Array.isArray(workouts) ? workouts.filter(w => w.studentId === selectedStudentId) : [];

        const thisMonthWorkouts = studentWorkouts.filter(w => {
            const d = new Date(w.date);
            return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
        });

        const planned = thisMonthWorkouts.length;
        const done = thisMonthWorkouts.filter(w => {
            const s = (w.status || '').toLowerCase();
            return s === 'completed' || s === 'done' || s === 'finished' || w.isCompleted;
        }).length;

        return {
            name: 'Mês Atual',
            planned,
            done,
            completionRate: planned > 0 ? Math.round((done / planned) * 100) : 0
        };
    }, [workouts, selectedStudentId]);

    // Form Status Logic
    let formStatus = "Neutro";
    let formColor = "#64748B";
    if (latest.form > 20) { formStatus = "Transição/Recuperação"; formColor = "#10b981"; }
    else if (latest.form > 5) { formStatus = "Fresco"; formColor = "#3b82f6"; }
    else if (latest.form > -10) { formStatus = "Zona Ótima"; formColor = "#10b981"; }
    else if (latest.form > -30) { formStatus = "Carga Alta"; formColor = "#f59e0b"; }
    else { formStatus = "Risco de Lesão"; formColor = "#ef4444"; }

    if (!selectedStudentId) return <div className="p-8">Selecione um aluno.</div>;

    return (
        // Added 'px-4 md:px-8' for responsive padding and significant top padding to avoid browser bar collision
        <div className="page-container p-4 md:p-8">
            <header style={{ marginBottom: '3rem' }}>
                <h1 style={{ fontSize: '2.5rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.5rem', lineHeight: '1.1', letterSpacing: '-0.02em' }}>
                    Performance de {currentStudent?.name || 'Aluno'}
                </h1>
                <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem' }}>Análise de Carga Crônica (Fitness) vs Aguda (Fadiga)</p>
            </header>

            {/* STATS GRID - Responsive via flex/grid */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
                gap: '1.5rem',
                marginBottom: '3rem'
            }}>
                <div className="glass-panel" style={{
                    padding: '24px',
                    display: 'flex', flexDirection: 'column', gap: '12px',
                    border: '1px solid var(--border-subtle)'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)', fontSize: '0.9rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        <Activity size={16} color="#3b82f6" />
                        Fitness (CTL)
                    </div>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '12px' }}>
                        <span style={{ fontSize: '2.5rem', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1 }}>{latest.fitness}</span>
                        <span style={{ fontSize: '0.9rem', color: '#3b82f6', fontWeight: 700 }}>Condicionamento</span>
                    </div>
                </div>

                <div className="glass-panel" style={{
                    padding: '24px',
                    display: 'flex', flexDirection: 'column', gap: '12px',
                    border: '1px solid var(--border-subtle)'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)', fontSize: '0.9rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        <TrendingUp size={16} color="#f43f5e" />
                        Fadiga (ATL)
                    </div>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '12px' }}>
                        <span style={{ fontSize: '2.5rem', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1 }}>{latest.fatigue}</span>
                        <span style={{ fontSize: '0.9rem', color: '#f43f5e', fontWeight: 700 }}>Carga Recente</span>
                    </div>
                </div>

                <div className="glass-panel" style={{
                    padding: '24px',
                    display: 'flex', flexDirection: 'column', gap: '12px',
                    border: '1px solid var(--border-subtle)'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)', fontSize: '0.9rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        <Battery size={16} color={formColor} />
                        Forma (TSB)
                    </div>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '12px' }}>
                        <span style={{ fontSize: '2.5rem', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1 }}>{latest.form}</span>
                        <span style={{ fontSize: '0.9rem', color: formColor, fontWeight: 700 }}>{formStatus}</span>
                    </div>
                </div>
            </div>

            {/* MAIN PMC CHART SECTION */}
            <div className="glass-panel responsive-panel" style={{
                marginBottom: '2rem',
                border: '1px solid var(--border-subtle)'
            }}>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '2rem' }}>
                    Gráfico de Gerenciamento de Performance
                </h3>

                {/* 1. GRAPH */}
                <div className="chart-container">
                    {pmcData.length > 1 ? (
                        <ResponsiveContainer width="100%" height="100%">
                            <ComposedChart data={pmcData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="colorFitness" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2} />
                                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-subtle)" />
                                <XAxis
                                    dataKey="date"
                                    tickFormatter={(str) => new Date(str).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
                                    stroke="var(--text-muted)"
                                    fontSize={12}
                                    tickMargin={12}
                                    axisLine={false}
                                    tickLine={false}
                                />
                                <YAxis stroke="var(--text-muted)" fontSize={12} axisLine={false} tickLine={false} tickMargin={12} />
                                <Tooltip
                                    contentStyle={{
                                        borderRadius: '12px',
                                        border: '1px solid var(--border-subtle)',
                                        background: 'rgba(9, 9, 11, 0.95)',
                                        color: '#fff',
                                        backdropFilter: 'blur(4px)',
                                        boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
                                    }}
                                    labelFormatter={(label) => new Date(label).toLocaleDateString('pt-BR', { day: 'numeric', month: 'long' })}
                                />
                                <Area
                                    type="monotone"
                                    dataKey="fitness"
                                    name="Fitness (CTL)"
                                    stroke="#3b82f6"
                                    strokeWidth={3}
                                    fillOpacity={1}
                                    fill="url(#colorFitness)"
                                    activeDot={{ r: 6, strokeWidth: 0, stroke: '#fff' }}
                                />
                                <Line
                                    type="monotone"
                                    dataKey="fatigue"
                                    name="Fadiga (ATL)"
                                    stroke="#f43f5e"
                                    strokeWidth={2}
                                    dot={false}
                                    activeDot={{ r: 6, strokeWidth: 0, stroke: '#fff' }}
                                />
                                <Line
                                    type="monotone"
                                    dataKey="form"
                                    name="Forma (TSB)"
                                    stroke="#10b981"
                                    strokeWidth={2}
                                    strokeDasharray="5 5"
                                    dot={false}
                                    activeDot={{ r: 6, strokeWidth: 0, stroke: '#fff' }}
                                />
                            </ComposedChart>
                        </ResponsiveContainer>
                    ) : (
                        <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
                            <p>Dados insuficientes para gerar o gráfico. Complete alguns treinos!</p>
                        </div>
                    )}
                </div>
            </div>

            {/* COMBINED LEGEND & EXPLANATION */}
            <div style={{
                marginTop: '1rem',
                padding: '24px',
                background: 'var(--bg-card)',
                borderRadius: '16px',
                marginBottom: '4rem',
                border: '1px solid var(--border-subtle)'
            }}>
                {/* Changed minmax from 280px to 250px to fit smaller screens better, and gap adjustment */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '2rem' }}>

                    {/* Fitness */}
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                        <div style={{ minWidth: '12px', height: '12px', background: '#3b82f6', opacity: 0.2, border: '2px solid #3b82f6', marginTop: '4px', borderRadius: '4px' }}></div>
                        <div>
                            <span style={{ color: 'var(--text-primary)', fontWeight: 700, display: 'block', marginBottom: '4px' }}>Fitness (CTL)</span>
                            <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: '1.5' }}>Quanto você treinou nos últimos 42 dias. O objetivo é subir gradualmente para ganhar condicionamento.</span>
                        </div>
                    </div>

                    {/* Fadiga */}
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                        <div style={{ minWidth: '12px', height: '12px', background: '#f43f5e', marginTop: '4px', borderRadius: '50%' }}></div>
                        <div>
                            <span style={{ color: 'var(--text-primary)', fontWeight: 700, display: 'block', marginBottom: '4px' }}>Fadiga (ATL)</span>
                            <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: '1.5' }}>Cansaço atual (média de 7 dias). Sobe rápido após treinos intensos e cai com descanso.</span>
                        </div>
                    </div>

                    {/* Forma */}
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                        <div style={{ minWidth: '12px', height: '2px', background: '#10b981', borderTop: '2px dashed #10b981', marginTop: '10px' }}></div>
                        <div>
                            <span style={{ color: 'var(--text-primary)', fontWeight: 700, display: 'block', marginBottom: '4px' }}>Forma (TSB)</span>
                            <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: '1.5' }}>Equilíbrio (Fitness - Fadiga). Positiva indica frescor para competir; muito negativa (-30) indica risco de overtraining.</span>
                        </div>
                    </div>

                </div>
            </div>

            {/* 3. DAYS GRAPH */}
            <div style={{ marginTop: '0' }}>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <Calendar size={28} className="text-accent-primary" /> Frequência Mensal  <span style={{ opacity: 0.5, fontWeight: 400, fontSize: '1.2rem', marginTop: '4px' }}>• {new Date().toLocaleString('pt-BR', { month: 'long' })}</span>
                </h2>

                <div className="glass-panel" style={{
                    padding: '32px', // Comfortable padding
                    border: '1px solid var(--border-subtle)'
                }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '3rem', alignItems: 'center' }}>

                        {/* 1. Bar Chart (Side by Side) */}
                        <div style={{ height: '300px', width: '100%', minWidth: '0' }}> {/* minWidth 0 prevents flex/grid overflow issues */}
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart
                                    data={[monthlyStats]}
                                    margin={{ top: 20, right: 10, left: 10, bottom: 20 }}
                                    barCategoryGap="20%"
                                    barGap={10}
                                >
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-subtle)" />
                                    <XAxis dataKey="name" stroke="var(--text-muted)" tick={{ fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
                                    <YAxis hide />
                                    <Tooltip
                                        cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                                        contentStyle={{
                                            borderRadius: '12px',
                                            border: '1px solid var(--border-subtle)',
                                            background: '#09090b',
                                            color: '#fff'
                                        }}
                                    />
                                    <Legend
                                        verticalAlign="top"
                                        align="right"
                                        wrapperStyle={{ paddingBottom: '20px' }}
                                    />

                                    <Bar
                                        dataKey="planned"
                                        name="Planejado"
                                        fill="#3f3f46"
                                        radius={[4, 4, 4, 4]}
                                        barSize={50}
                                        label={{ position: 'top', fill: '#71717a', fontSize: 14, fontWeight: 700 }}
                                    />
                                    <Bar
                                        dataKey="done"
                                        name="Realizado"
                                        fill="#CCFF00"
                                        radius={[4, 4, 4, 4]}
                                        barSize={50}
                                        label={{ position: 'top', fill: '#CCFF00', fontSize: 14, fontWeight: 700 }}
                                    />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>

                        {/* 2. Big Numbers Stats (Dark Theme) */}
                        <div style={{ display: 'flex', gap: '2rem', justifyContent: 'center', alignItems: 'center', flexWrap: 'wrap' }}>
                            <div style={{ textAlign: 'center', minWidth: '100px' }}>
                                <div style={{ fontSize: '3.5rem', fontWeight: 800, color: 'var(--text-muted)', lineHeight: 1, letterSpacing: '-0.03em' }}>{monthlyStats.planned}</div>
                                <div style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: '12px' }}>Planejados</div>
                            </div>
                            <div style={{ width: '1px', height: '60px', background: 'var(--border-subtle)' }} className="hidden sm:block"></div>
                            <div style={{ textAlign: 'center', minWidth: '100px' }}>
                                <div style={{ fontSize: '3.5rem', fontWeight: 800, color: 'var(--accent-primary)', lineHeight: 1, letterSpacing: '-0.03em' }}>{monthlyStats.done}</div>
                                <div style={{ color: 'var(--accent-primary)', fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: '12px' }}>Concluídos</div>
                            </div>
                            <div style={{ width: '1px', height: '60px', background: 'var(--border-subtle)' }} className="hidden sm:block"></div>
                            <div style={{ textAlign: 'center', minWidth: '100px' }}>
                                <div style={{ fontSize: '3.5rem', fontWeight: 800, color: '#f59e0b', lineHeight: 1, letterSpacing: '-0.03em' }}>{monthlyStats.completionRate}%</div>
                                <div style={{ color: '#f59e0b', fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: '12px' }}>Aderência</div>
                            </div>
                        </div>

                    </div>
                </div>
            </div>

            {/* --- REPORT GENERATOR SECTION --- */}
            {role === 'professor' && reportStats && (
                <>
                    {/* Estilos específicos de impressão e utilitários */}
                    <style dangerouslySetInnerHTML={{ __html: `
                        @media print {
                            /* Oculta tudo na página exceto o container do relatório */
                            body * {
                                visibility: hidden;
                            }
                            #print-report-area, #print-report-area * {
                                visibility: visible;
                            }
                            #print-report-area {
                                position: absolute;
                                left: 0;
                                top: 0;
                                width: 100%;
                                background: #ffffff !important;
                                color: #000000 !important;
                                padding: 25px !important;
                                border: none !important;
                                box-shadow: none !important;
                            }
                            /* Força a cor do texto a ser preta para legibilidade e economia de tinta */
                            h1, h2, h3, h4, h5, h6, p, span, div, strong, td, th, label {
                                color: #000000 !important;
                                text-shadow: none !important;
                            }
                            .no-print {
                                display: none !important;
                            }
                            .print-badge {
                                border: 1px solid #000 !important;
                                color: #000 !important;
                                background: transparent !important;
                            }
                            .print-grid {
                                display: grid !important;
                                grid-template-columns: repeat(3, 1fr) !important;
                                gap: 15px !important;
                                margin-bottom: 20px !important;
                            }
                            .print-card-stat {
                                border: 1px solid #ccc !important;
                                padding: 12px !important;
                                border-radius: 6px !important;
                                text-align: center !important;
                            }
                            .print-exercise-row {
                                border-bottom: 1px solid #eee !important;
                            }
                            .print-notes-box {
                                border: 1px solid #aaa !important;
                                border-radius: 6px !important;
                                padding: 15px !important;
                                min-height: 120px !important;
                                margin-top: 10px !important;
                                font-style: italic !important;
                            }
                        }
                    `}} />

                    {/* Dashboard view of the Report Generator */}
                    <div className="glass-panel no-print" style={{
                        marginTop: '2rem',
                        padding: '32px',
                        border: '1px solid var(--border-subtle)',
                        marginBottom: '4rem'
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1.5rem', marginBottom: '2rem' }}>
                            <div>
                                <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <FileText size={24} className="text-accent-primary" /> Relatório do Aluno
                                </h2>
                                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '4px' }}>
                                    Gere e imprima um resumo do desempenho de <strong>{currentStudent?.name || 'Aluno'}</strong>.
                                </p>
                            </div>
                            
                            {/* Period selector */}
                            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                <select 
                                    value={reportPeriod} 
                                    onChange={(e) => setReportPeriod(e.target.value)}
                                    className="input"
                                    style={{
                                        background: 'var(--bg-secondary)',
                                        borderColor: 'var(--border-subtle)',
                                        color: 'var(--text-primary)',
                                        width: 'auto',
                                        padding: '8px 16px',
                                        fontSize: '0.9rem',
                                        cursor: 'pointer'
                                    }}
                                >
                                    <option value="month">Este Mês</option>
                                    <option value="prev_month">Mês Anterior</option>
                                    <option value="last30">Últimos 30 Dias</option>
                                    <option value="all">Todo o Período</option>
                                </select>

                                <button
                                    onClick={() => window.print()}
                                    className="btn btn-primary"
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '8px',
                                        padding: '10px 20px',
                                        fontSize: '0.85rem'
                                    }}
                                >
                                    <Printer size={16} /> Imprimir / PDF
                                </button>
                            </div>
                        </div>

                        {/* Interactive Preview for the Coach */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
                            {/* Days trained */}
                            <div style={{ background: 'rgba(255, 255, 255, 0.02)', border: '1px solid var(--border-subtle)', borderRadius: '12px', padding: '16px', textAlign: 'center' }}>
                                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase' }}>Dias Treinados</div>
                                <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--accent-primary)', marginTop: '8px' }}>{reportStats.diasTreinados}</div>
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>Realizados no período</div>
                            </div>
                            
                            {/* Missed workouts */}
                            <div style={{ background: 'rgba(255, 255, 255, 0.02)', border: '1px solid var(--border-subtle)', borderRadius: '12px', padding: '16px', textAlign: 'center' }}>
                                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase' }}>Treinos Faltosos</div>
                                <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--accent-danger)', marginTop: '8px' }}>{reportStats.treinosFaltosos}</div>
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>Pendentes / Não concluídos</div>
                            </div>

                            {/* Compliance */}
                            <div style={{ background: 'rgba(255, 255, 255, 0.02)', border: '1px solid var(--border-subtle)', borderRadius: '12px', padding: '16px', textAlign: 'center' }}>
                                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase' }}>Aderência</div>
                                <div style={{ fontSize: '2rem', fontWeight: 800, color: '#facc15', marginTop: '8px' }}>{reportStats.taxaAdesao}%</div>
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>{reportStats.diasTreinados} de {reportStats.totalPlanejado} treinos</div>
                            </div>

                            {/* Carga Min / Max */}
                            <div style={{ background: 'rgba(255, 255, 255, 0.02)', border: '1px solid var(--border-subtle)', borderRadius: '12px', padding: '16px', textAlign: 'center' }}>
                                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase' }}>Cargas</div>
                                <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '12px' }}>
                                    Min: <span style={{ color: 'var(--accent-primary)' }}>{reportStats.minCarga} kg</span>
                                </div>
                                <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '4px' }}>
                                    Max: <span style={{ color: 'var(--accent-primary)' }}>{reportStats.maxCarga} kg</span>
                                </div>
                            </div>
                        </div>

                        {/* Exercises list + Notes selection */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
                            <div>
                                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <Award size={18} color="var(--accent-primary)" /> Exercícios Mais Feitos
                                </h3>
                                {reportStats.topExercises.length > 0 ? (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                        {reportStats.topExercises.map((ex, idx) => (
                                            <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 12px', background: 'var(--bg-secondary)', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
                                                <span style={{ fontSize: '0.9rem', color: 'var(--text-primary)', fontWeight: 500 }}>
                                                    {idx + 1}. {ex.name}
                                                </span>
                                                <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600, background: 'var(--bg-primary)', padding: '2px 8px', borderRadius: '12px' }}>
                                                    {ex.count}x
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Nenhum exercício registrado no período.</p>
                                )}
                            </div>

                            <div>
                                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '1rem' }}>
                                    Anotações do Professor
                                </h3>
                                <textarea
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                    placeholder="Digite aqui observações sobre a evolução, execução ou ajustes de carga para constar no relatório impresso..."
                                    className="input"
                                    style={{
                                        minHeight: '150px',
                                        resize: 'vertical',
                                        fontSize: '0.9rem',
                                        background: 'var(--bg-secondary)',
                                        borderColor: 'var(--border-subtle)',
                                        color: 'var(--text-primary)'
                                    }}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Hidden printable A4 report container (using ID targeted by printer css) */}
                    <div id="print-report-area" style={{ display: 'none', fontFamily: 'sans-serif' }}>
                        {/* Header block */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #000', paddingBottom: '15px', marginBottom: '20px' }}>
                            <div>
                                <h1 style={{ fontSize: '20px', fontWeight: 800, margin: 0, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                    Relatório de Desempenho Físico
                                </h1>
                                <p style={{ fontSize: '12px', color: '#555', margin: '4px 0 0 0' }}>
                                    JOÃO VICTOR PERSONAL TRAINER
                                </p>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                                <p style={{ fontSize: '12px', margin: 0 }}><strong>Gerado em:</strong> {new Date().toLocaleDateString('pt-BR')}</p>
                                <p style={{ fontSize: '12px', margin: '2px 0 0 0' }}><strong>Período:</strong> {reportStats.periodText}</p>
                            </div>
                        </div>

                        {/* Student details */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '20px', padding: '12px', background: '#f5f5f5', borderRadius: '6px' }}>
                            <div>
                                <p style={{ margin: '4px 0', fontSize: '13px' }}><strong>Aluno(a):</strong> {currentStudent?.name || 'Não informado'}</p>
                                <p style={{ margin: '4px 0', fontSize: '13px' }}><strong>Objetivo:</strong> {currentStudent?.goal || 'Não informado'}</p>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                                <p style={{ margin: '4px 0', fontSize: '13px' }}><strong>Aderência Geral no Período:</strong> {reportStats.taxaAdesao}%</p>
                            </div>
                        </div>

                        {/* Stats block layout */}
                        <h3 style={{ fontSize: '14px', borderBottom: '1px solid #ccc', paddingBottom: '6px', marginBottom: '12px', textTransform: 'uppercase' }}>
                            Resumo Estatístico
                        </h3>
                        <div className="print-grid">
                            <div className="print-card-stat">
                                <span style={{ fontSize: '11px', textTransform: 'uppercase', color: '#666' }}>Dias Treinados</span>
                                <div style={{ fontSize: '24px', fontWeight: 'bold', margin: '5px 0' }}>{reportStats.diasTreinados}</div>
                            </div>
                            <div className="print-card-stat">
                                <span style={{ fontSize: '11px', textTransform: 'uppercase', color: '#666' }}>Treinos Faltosos</span>
                                <div style={{ fontSize: '24px', fontWeight: 'bold', margin: '5px 0', color: '#d32f2f' }}>{reportStats.treinosFaltosos}</div>
                            </div>
                            <div className="print-card-stat">
                                <span style={{ fontSize: '11px', textTransform: 'uppercase', color: '#666' }}>Carga Mín / Máx</span>
                                <div style={{ fontSize: '16px', fontWeight: 'bold', margin: '8px 0' }}>
                                    {reportStats.minCarga} kg / {reportStats.maxCarga} kg
                                </div>
                            </div>
                        </div>

                        {/* Detailed table list of exercises */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '20px', marginTop: '20px' }}>
                            <div>
                                <h3 style={{ fontSize: '14px', borderBottom: '1px solid #ccc', paddingBottom: '6px', marginBottom: '12px', textTransform: 'uppercase' }}>
                                    Exercícios Mais Realizados
                                </h3>
                                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                                    <thead>
                                        <tr style={{ borderBottom: '1px solid #000', textAlign: 'left' }}>
                                            <th style={{ padding: '6px 0' }}>Exercício</th>
                                            <th style={{ padding: '6px 0', textAlign: 'right' }}>Frequência</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {reportStats.topExercises.length > 0 ? (
                                            reportStats.topExercises.map((ex, idx) => (
                                                <tr key={idx} className="print-exercise-row" style={{ borderBottom: '1px solid #eee' }}>
                                                    <td style={{ padding: '6px 0' }}>{idx + 1}. {ex.name}</td>
                                                    <td style={{ padding: '6px 0', textAlign: 'right' }}>{ex.count} treinos</td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td colSpan="2" style={{ padding: '6px 0', color: '#666' }}>Nenhum treino concluído no período.</td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>

                            {/* Printable Notes */}
                            <div>
                                <h3 style={{ fontSize: '14px', borderBottom: '1px solid #ccc', paddingBottom: '6px', marginBottom: '12px', textTransform: 'uppercase' }}>
                                    Avaliação do Treinador
                                </h3>
                                <div className="print-notes-box" style={{ fontSize: '12px', minHeight: '120px', border: '1px solid #ccc', padding: '10px', borderRadius: '4px' }}>
                                    {notes || 'Nenhuma anotação adicional inserida pelo professor.'}
                                </div>
                            </div>
                        </div>

                        {/* Signature area */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '80px', paddingTop: '20px' }}>
                            <div style={{ width: '45%', textAlign: 'center' }}>
                                <div style={{ borderTop: '1px solid #000', width: '100%', margin: '0 auto' }}></div>
                                <p style={{ fontSize: '12px', margin: '8px 0 0 0' }}>João Victor (Personal Trainer)</p>
                            </div>
                            <div style={{ width: '45%', textAlign: 'center' }}>
                                <div style={{ borderTop: '1px solid #000', width: '100%', margin: '0 auto' }}></div>
                                <p style={{ fontSize: '12px', margin: '8px 0 0 0' }}>Assinatura do Aluno(a): {currentStudent?.name}</p>
                            </div>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

export default PerformancePage;
