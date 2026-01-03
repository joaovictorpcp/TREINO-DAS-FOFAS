import React, { useMemo } from 'react';
import { useWorkout } from '../../context/WorkoutContext';
import { useStudent } from '../../context/StudentContext';
import { ChevronLeft, ChevronRight, Check } from 'lucide-react';

const AttendanceCalendar = ({ viewMode = 'simple', onDayClick }) => {
    const { workouts, updateWorkout } = useWorkout(); // Destructure updateWorkout
    const { selectedStudentId } = useStudent();

    // State for current month view
    const [currentDate, setCurrentDate] = React.useState(new Date());

    const daysInMonth = (date) => {
        return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
    };

    const firstDayOfMonth = (date) => {
        return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
    };

    const getCategoryColor = (category) => {
        switch (category) {
            case 'A': return '#3b82f6'; // Blue
            case 'B': return '#22c55e'; // Green
            case 'C': return '#f97316'; // Orange
            default: return '#94a3b8'; // Gray
        }
    };

    const monthData = useMemo(() => {
        if (!selectedStudentId) return [];

        const days = [];
        const totalDays = daysInMonth(currentDate);
        const startDay = firstDayOfMonth(currentDate);

        // Filter workouts for this student and month
        const monthlyWorkouts = workouts.filter(w => {
            if (w.studentId !== selectedStudentId) return false;
            const wDate = new Date(w.date);
            return wDate.getMonth() === currentDate.getMonth() &&
                wDate.getFullYear() === currentDate.getFullYear();
        });

        // Add padding for start of month
        for (let i = 0; i < startDay; i++) {
            days.push({ type: 'padding', day: null });
        }

        // Add actual days
        for (let i = 1; i <= totalDays; i++) {
            const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), i);
            // Find ALL workouts for this day
            const dayWorkouts = monthlyWorkouts.filter(w => {
                const wDate = new Date(w.date);
                return wDate.getDate() === i;
            });

            days.push({
                type: 'day',
                day: i,
                date,
                workouts: dayWorkouts
            });
        }

        return days;
    }, [currentDate, workouts, selectedStudentId]);

    const trainedCount = monthData.filter(d => d.status === 'trained').length;

    const changeMonth = (offset) => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + offset, 1));
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'trained': return '#98FF98'; // Mint Green
            case 'missed': return '#fee2e2'; // red-100
            case 'planned': return '#e0f2fe'; // blue-100
            default: return 'transparent';
        }
    };

    const getStatusBorder = (status) => {
        switch (status) {
            case 'trained': return '#86EFAC'; // green-300
            case 'missed': return '#ef4444'; // red-500
            case 'planned': return '#3b82f6'; // blue-500
            default: return '#f1f5f9'; // slate-100
        }
    };

    return (
        <div style={{
            background: '#fff',
            borderRadius: '16px',
            padding: '1.5rem',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
        }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#1e293b' }}>
                    Frequência
                </h2>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <button onClick={() => changeMonth(-1)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                        <ChevronLeft size={20} color="#64748B" />
                    </button>
                    <span style={{ fontWeight: 600, color: '#334155', minWidth: '100px', textAlign: 'center' }}>
                        {currentDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
                    </span>
                    <button onClick={() => changeMonth(1)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                        <ChevronRight size={20} color="#64748B" />
                    </button>
                </div>
            </div>

            <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>
                {/* Calendar Grid */}
                <div style={{ flex: 1, minWidth: '300px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '8px', marginBottom: '8px' }}>
                        {['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].map((d, i) => (
                            <span key={i} style={{ textAlign: 'center', fontSize: '0.8rem', color: '#94a3b8', fontWeight: 600 }}>{d}</span>
                        ))}
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '8px' }}>
                        {monthData.map((day, idx) => {
                            if (day.type === 'padding') {
                                return <div key={`pad-${idx}`} style={{ minHeight: '80px' }} />;
                            }

                            const isToday = new Date().toDateString() === day.date.toDateString();

                            return (
                                <div
                                    key={day.date.toString()}
                                    onDragOver={(e) => {
                                        e.preventDefault();
                                        e.dataTransfer.dropEffect = 'move';
                                    }}
                                    onDrop={(e) => {
                                        e.preventDefault();
                                        const workoutId = e.dataTransfer.getData('text/plain');
                                        if (workoutId && updateWorkout) {
                                            const newDate = new Date(day.date);
                                            newDate.setHours(12, 0, 0, 0); // Noon to conform to simple date
                                            updateWorkout(workoutId, { date: newDate.toISOString() });
                                        }
                                    }}
                                    style={{
                                        minHeight: '100px',
                                        background: isToday ? '#fffbeb' : '#f8fafc', // Highlight today
                                        border: isToday ? '2px solid #fcd34d' : '1px solid #e2e8f0',
                                        borderRadius: '8px',
                                        padding: '4px',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        gap: '4px',
                                        position: 'relative'
                                    }}
                                >
                                    <span style={{
                                        fontSize: '0.8rem',
                                        fontWeight: 700,
                                        color: isToday ? '#b45309' : '#64748B',
                                        marginBottom: '2px',
                                        display: 'block',
                                        textAlign: 'right'
                                    }}>
                                        {day.day}
                                    </span>

                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: 1 }}>
                                        {day.workouts.map(w => {
                                            const isDone = w.status === 'completed';
                                            const wDate = new Date(w.date);
                                            const isPast = wDate < new Date() && !isToday && !isDone;

                                            // Dynamic Styles
                                            let bg = '#e0f2fe'; // Blue-100 (Planned)
                                            let color = '#1e40af'; // Blue-800
                                            let border = '1px solid #bfdbfe';

                                            if (isDone) {
                                                bg = '#dcfce7'; // Green-100
                                                color = '#166534'; // Green-800
                                                border = '1px solid #bbf7d0';
                                            } else if (isPast) {
                                                bg = '#fef2f2'; // Red-50
                                                color = '#991b1b'; // Red-800
                                                border = '1px solid #fecaca';
                                            }

                                            return (
                                                <div
                                                    key={w.id}
                                                    draggable={true}
                                                    onDragStart={(e) => {
                                                        e.dataTransfer.setData('text/plain', w.id);
                                                        e.dataTransfer.effectAllowed = 'move';
                                                    }}
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        onDayClick && onDayClick(w.id);
                                                    }}
                                                    title={w.category ? `Treino ${w.category}` : 'Treino Personalizado'}
                                                    style={{
                                                        background: bg,
                                                        color: color,
                                                        border: border,
                                                        borderRadius: '4px',
                                                        padding: '2px 4px',
                                                        fontSize: '0.7rem',
                                                        fontWeight: 600,
                                                        cursor: 'grab',
                                                        whiteSpace: 'nowrap',
                                                        overflow: 'hidden',
                                                        textOverflow: 'ellipsis',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: '4px'
                                                    }}
                                                >
                                                    {isDone && <Check size={10} strokeWidth={3} />}
                                                    {w.category ? `Treino ${w.category}` : (w.name || 'Treino')}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Summary Card */}
                <div style={{
                    minWidth: '200px',
                    background: '#F8FAFC',
                    borderRadius: '12px',
                    padding: '1.5rem',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    alignItems: 'center',
                    gap: '0.5rem'
                }}>
                    <span style={{ fontSize: '0.9rem', color: '#64748B', fontWeight: 500 }}>Treinos Realizados</span>
                    <span style={{ fontSize: '3rem', fontWeight: 800, color: '#10b981' }}>{trainedCount}</span>
                    <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
                        {currentDate.toLocaleDateString('pt-BR', { month: 'long' })}
                    </span>

                    <div style={{ marginTop: '1rem', width: '100%', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8rem', color: '#64748B' }}>
                            <div style={{ width: '12px', height: '12px', borderRadius: '4px', background: '#98FF98', border: '1px solid #86EFAC' }}></div>
                            Concluído
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8rem', color: '#64748B' }}>
                            <div style={{ width: '12px', height: '12px', borderRadius: '4px', background: '#fee2e2', border: '1px solid #ef4444' }}></div>
                            Perdido/Não Feito
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AttendanceCalendar;
