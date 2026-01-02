import React, { useMemo } from 'react';
import { useWorkout } from '../../context/WorkoutContext';
import { useStudent } from '../../context/StudentContext';
import { ChevronLeft, ChevronRight, Check } from 'lucide-react';

const AttendanceCalendar = ({ viewMode = 'simple', onDayClick }) => {
    const { workouts } = useWorkout();
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
            // Find ALL workouts for this day (for heatmap)
            const dayWorkouts = monthlyWorkouts.filter(w => new Date(w.date).getDate() === i && w.status === 'completed');

            // For simple mode (legacy logic)
            const workout = monthlyWorkouts.find(w => new Date(w.date).getDate() === i);
            const isToday = new Date().toDateString() === date.toDateString();
            const isPast = date < new Date() && !isToday;

            let status = 'rest';
            let summary = '';

            if (workout) {
                status = workout.status === 'completed' ? 'trained' : (isPast ? 'missed' : 'planned');
                const exercises = workout.exercises?.slice(0, 3).map(e => e.name).join(', ') || 'Sem exercícios';
                summary = `${exercises}${workout.exercises?.length > 3 ? '...' : ''}`;
            }

            days.push({
                type: 'day',
                day: i,
                status,
                date,
                summary,
                workouts: dayWorkouts // Array of completed workouts for dots
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
                        {monthData.map((day, idx) => (
                            <div
                                key={day.date ? day.date.toString() : `pad-${idx}`}
                                title={day.summary || undefined}
                                style={{
                                    aspectRatio: '1',
                                    borderRadius: '8px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: '0.9rem',
                                    color: day.status === 'rest' ? '#64748B' : '#064e3b',
                                    background: getStatusColor(day.status),
                                    border: `1px solid ${getStatusBorder(day.status)}`,
                                    position: 'relative',
                                    cursor: (day.workouts && day.workouts.length > 0) || day.status === 'trained' ? 'pointer' : 'default',
                                    flexDirection: 'column',
                                    gap: '2px'
                                }}
                                onClick={() => {
                                    // Prefer query for completed workout first
                                    const completed = day.workouts && day.workouts.length > 0 ? day.workouts[0] : null;
                                    // Fallback to the single 'workout' found in loop (for simple mode compat)
                                    // We need to pass the ID back up
                                    if (completed) {
                                        onDayClick && onDayClick(completed.id);
                                    } else if (day.status === 'trained') {
                                        // Try to find it from monthData closure if possible, or simpler:
                                        // Re-find it or rely on what's passed.
                                        // Actually `day` object in map doesn't have the single workout ID directly in `day.workouts` if logic differs.
                                        // Let's ensure day.workouts is populated for 'trained' status in the useMemo above?
                                        // Line 76: workouts: dayWorkouts. Yes it is.
                                        if (day.workouts && day.workouts[0]) {
                                            onDayClick && onDayClick(day.workouts[0].id);
                                        }
                                    }
                                }}
                            >
                                {day.day}

                                {viewMode === 'heatmap' ? (
                                    <div style={{ display: 'flex', gap: '2px', position: 'absolute', bottom: '4px' }}>
                                        {day.workouts && day.workouts.map(w => (
                                            <div
                                                key={w.id}
                                                style={{
                                                    width: '6px',
                                                    height: '6px',
                                                    borderRadius: '50%',
                                                    background: getCategoryColor(w.category || 'A')
                                                }}
                                            />
                                        ))}
                                    </div>
                                ) : (
                                    day.status === 'trained' && (
                                        <div style={{ position: 'absolute', bottom: '2px', right: '2px' }}>
                                            <Check size={10} color="#15803d" strokeWidth={3} />
                                        </div>
                                    )
                                )}
                            </div>
                        ))}
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
