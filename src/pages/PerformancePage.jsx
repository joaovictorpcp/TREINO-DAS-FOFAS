
import React, { useMemo } from 'react';
import { useWorkout } from '../context/WorkoutContext';
import { useStudent } from '../context/StudentContext';
import {
    ResponsiveContainer, ComposedChart, Line, Area, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, BarChart
} from 'recharts';
import { Activity, Battery, TrendingUp, Calendar } from 'lucide-react';

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
        // Added 'px-4 md:px-8' for responsive padding using Tailwind utility classes mixed with user's preferred styles
        <div style={{ maxWidth: '1200px', margin: '0 auto', paddingBottom: '100px' }} className="p-4 md:p-8">
            <header style={{ marginBottom: '2rem' }}>
                <h1 style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.5rem', lineHeight: '1.2' }}>
                    Performance de {currentStudent?.name || 'Aluno'}
                </h1>
                <p style={{ color: 'var(--text-secondary)' }}>Análise de Carga Crônica (Fitness) vs Aguda (Fadiga)</p>
            </header>

            {/* STATS GRID - Responsive via flex/grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem', marginBottom: '3rem' }}>
                <div className="glass-panel" style={{
                    padding: '20px',
                    display: 'flex', flexDirection: 'column', gap: '8px'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)', fontSize: '0.9rem', fontWeight: 600 }}>
                        <Activity size={16} color="#3b82f6" />
                        Fitness (CTL)
                    </div>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                        <span style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-primary)' }}>{latest.fitness}</span>
                        <span style={{ fontSize: '0.85rem', color: '#3b82f6', fontWeight: 700 }}>Condicionamento</span>
                    </div>
                </div>

                <div className="glass-panel" style={{
                    padding: '20px',
                    display: 'flex', flexDirection: 'column', gap: '8px'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)', fontSize: '0.9rem', fontWeight: 600 }}>
                        <TrendingUp size={16} color="#f43f5e" />
                        Fadiga (ATL)
                    </div>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                        <span style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-primary)' }}>{latest.fatigue}</span>
                        <span style={{ fontSize: '0.85rem', color: '#f43f5e', fontWeight: 700 }}>Carga Recente</span>
                    </div>
                </div>

                <div className="glass-panel" style={{
                    padding: '20px',
                    display: 'flex', flexDirection: 'column', gap: '8px'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)', fontSize: '0.9rem', fontWeight: 600 }}>
                        <Battery size={16} color={formColor} />
                        Forma (TSB)
                    </div>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                        <span style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-primary)' }}>{latest.form}</span>
                        <span style={{ fontSize: '0.85rem', color: formColor, fontWeight: 700 }}>{formStatus}</span>
                    </div>
                </div>
            </div>

            {/* MAIN PMC CHART SECTION */}
            <div className="glass-panel" style={{
                padding: '24px',
                minHeight: 'auto', marginBottom: '1rem'
            }}>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '1.5rem' }}>
                    Gráfico de Gerenciamento de Performance
                </h3>

                {/* 1. GRAPH - Height controlled via class for responsive adjustment if needed, but fixed height usually fine for charts */}
                <div style={{ height: '400px', width: '100%' }}>
                    {pmcData.length > 1 ? (
                        <ResponsiveContainer width="100%" height="100%">
                            <ComposedChart data={pmcData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
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
                                    tickMargin={10}
                                />
                                <YAxis stroke="var(--text-muted)" fontSize={12} />
                                <Tooltip
                                    contentStyle={{
                                        borderRadius: '12px',
                                        border: '1px solid var(--border-subtle)',
                                        background: '#09090b',
                                        color: '#fff'
                                    }}
                                    labelFormatter={(label) => new Date(label).toLocaleDateString('pt-BR', { day: 'numeric', month: 'long' })}
                                />
                                <Area
                                    type="monotone"
                                    dataKey="fitness"
                                    name="Fitness (CTL)"
                                    stroke="#3b82f6"
                                    strokeWidth={2}
                                    fillOpacity={1}
                                    fill="url(#colorFitness)"
                                    activeDot={{ r: 6, strokeWidth: 0 }}
                                />
                                <Line
                                    type="monotone"
                                    dataKey="fatigue"
                                    name="Fadiga (ATL)"
                                    stroke="#f43f5e"
                                    strokeWidth={2}
                                    dot={false}
                                    activeDot={{ r: 6, strokeWidth: 0 }}
                                />
                                <Line
                                    type="monotone"
                                    dataKey="form"
                                    name="Forma (TSB)"
                                    stroke="#10b981"
                                    strokeWidth={2}
                                    strokeDasharray="5 5"
                                    dot={false}
                                    activeDot={{ r: 6, strokeWidth: 0 }}
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
                padding: '1.5rem',
                background: 'rgba(255, 255, 255, 0.02)',
                borderRadius: '16px',
                marginBottom: '3rem',
                border: '1px solid var(--border-subtle)'
            }}>
                {/* Changed minmax from 280px to 250px to fit smaller screens better, and gap adjustment */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem' }}>

                    {/* Fitness */}
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                        <div style={{ minWidth: '12px', height: '12px', background: '#3b82f6', opacity: 0.2, border: '2px solid #3b82f6', marginTop: '4px', borderRadius: '2px' }}></div>
                        <div>
                            <span style={{ color: 'var(--text-primary)', fontWeight: 700, display: 'block', marginBottom: '4px' }}>Fitness (CTL)</span>
                            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: '1.4' }}>Quanto você treinou nos últimos 42 dias. O objetivo é subir gradualmente.</span>
                        </div>
                    </div>

                    {/* Fadiga */}
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                        <div style={{ minWidth: '12px', height: '2px', background: '#f43f5e', marginTop: '9px' }}></div>
                        <div>
                            <span style={{ color: 'var(--text-primary)', fontWeight: 700, display: 'block', marginBottom: '4px' }}>Fadiga (ATL)</span>
                            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: '1.4' }}>Cansaço atual (média de 7 dias). Sobe rápido após treinos intensos.</span>
                        </div>
                    </div>

                    {/* Forma */}
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                        <div style={{ minWidth: '12px', height: '2px', background: '#10b981', borderTop: '2px dashed #10b981', marginTop: '9px' }}></div>
                        <div>
                            <span style={{ color: 'var(--text-primary)', fontWeight: 700, display: 'block', marginBottom: '4px' }}>Forma (TSB)</span>
                            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: '1.4' }}>Saldo (Fitness - Fadiga). Evite manter muito negativo (-30) por muito tempo.</span>
                        </div>
                    </div>

                </div>
            </div>

            {/* 3. DAYS GRAPH */}
            <div style={{ marginTop: '0' }}>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <Calendar size={20} className="text-accent-primary" /> Frequência Mensal  <span style={{ opacity: 0.5, fontWeight: 400, fontSize: '1rem' }}>• {new Date().toLocaleString('default', { month: 'long' })}</span>
                </h2>

                <div className="glass-panel" style={{
                    padding: '24px', // Reduced padding for mobile
                }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '3rem', alignItems: 'center' }}>

                        {/* 1. Bar Chart (Side by Side) */}
                        <div style={{ height: '300px', width: '100%', minWidth: '0' }}> {/* minWidth 0 prevents flex/grid overflow issues */}
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart
                                    data={[monthlyStats]}
                                    margin={{ top: 20, right: 10, left: 10, bottom: 20 }}
                                    barCategoryGap="20%"
                                    barGap={0}
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
                                        align="center"
                                        wrapperStyle={{ paddingBottom: '20px' }}
                                    />

                                    <Bar
                                        dataKey="planned"
                                        name="Planejado"
                                        fill="#52525b"
                                        radius={[4, 4, 0, 0]}
                                        barSize={50}
                                        label={{ position: 'top', fill: '#71717a', fontSize: 14, fontWeight: 700 }}
                                    />
                                    <Bar
                                        dataKey="done"
                                        name="Realizado"
                                        fill="#10b981"
                                        radius={[4, 4, 0, 0]}
                                        barSize={50}
                                        label={{ position: 'top', fill: '#10b981', fontSize: 14, fontWeight: 700 }}
                                    />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>

                        {/* 2. Big Numbers Stats (Dark Theme) */}
                        <div style={{ display: 'flex', gap: '2rem', justifyContent: 'space-around', alignItems: 'center', flexWrap: 'wrap' }}>
                            <div style={{ textAlign: 'center', minWidth: '80px' }}>
                                <div style={{ fontSize: '3rem', fontWeight: 800, color: 'var(--text-muted)', lineHeight: 1 }}>{monthlyStats.planned}</div>
                                <div style={{ color: 'var(--text-secondary)', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: '8px' }}>Planejados</div>
                            </div>
                            <div style={{ width: '1px', height: '60px', background: 'var(--border-subtle)' }}></div>
                            <div style={{ textAlign: 'center', minWidth: '80px' }}>
                                <div style={{ fontSize: '3rem', fontWeight: 800, color: '#10b981', lineHeight: 1 }}>{monthlyStats.done}</div>
                                <div style={{ color: '#10b981', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: '8px' }}>Concluídos</div>
                            </div>
                            <div style={{ width: '1px', height: '60px', background: 'var(--border-subtle)' }}></div>
                            <div style={{ textAlign: 'center', minWidth: '80px' }}>
                                <div style={{ fontSize: '3rem', fontWeight: 800, color: '#f59e0b', lineHeight: 1 }}>{monthlyStats.completionRate}%</div>
                                <div style={{ color: '#f59e0b', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: '8px' }}>Aderência</div>
                            </div>
                        </div>

                    </div>
                </div>
            </div>
        </div>
    );
};

export default PerformancePage;
