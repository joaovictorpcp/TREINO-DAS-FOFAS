import React, { useMemo, useState, useEffect } from 'react';
import { useWorkout } from '../../context/WorkoutContext';
import { useStudent } from '../../context/StudentContext';
import { ChevronLeft, ChevronRight, Check, Calendar as CalendarIcon, Clock, Dumbbell, Footprints, Bike, Waves, AlertCircle, XCircle, MapPin, Activity } from 'lucide-react';

const AttendanceCalendar = ({ onDayClick, fullPageMode = false }) => {
    const { workouts, updateWorkout } = useWorkout();
    const { selectedStudentId } = useStudent();

    const [currentDate, setCurrentDate] = useState(new Date());
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth < 768);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const daysInMonth = (date) => new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
    const firstDayOfMonth = (date) => new Date(date.getFullYear(), date.getMonth(), 1).getDay();

    const monthData = useMemo(() => {
        if (!selectedStudentId) return [];
        const days = [];
        const totalDays = daysInMonth(currentDate);
        const startDay = firstDayOfMonth(currentDate);

        // Filter valid workouts
        const monthlyWorkouts = workouts.filter(w => {
            if (w.studentId !== selectedStudentId) return false;
            const wDate = new Date(w.date);
            return wDate.getMonth() === currentDate.getMonth() &&
                wDate.getFullYear() === currentDate.getFullYear();
        });

        for (let i = 0; i < startDay; i++) days.push({ type: 'padding' });

        for (let i = 1; i <= totalDays; i++) {
            const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), i);
            const dayWorkouts = monthlyWorkouts.filter(w => new Date(w.date).getDate() === i);
            days.push({ type: 'day', day: i, date, workouts: dayWorkouts });
        }
        return days;
    }, [currentDate, workouts, selectedStudentId]);

    const changeMonth = (offset) => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + offset, 1));
    };

    // --- TrainingPeaks Block Logic (Dark Theme) ---
    const getActivityIcon = (type) => {
        switch (type) {
            case 'running': return <Footprints size={14} />;
            case 'cycling': return <Bike size={14} />;
            case 'swimming': return <Waves size={14} />;
            default: return <Dumbbell size={14} />;
        }
    };

    const getBlockStyle = (status) => {
        const s = (status || '').toLowerCase();
        if (s === 'completed' || s === 'done' || s === 'finished') {
            return { bg: 'rgba(0, 230, 118, 0.1)', border: 'var(--accent-primary)', text: 'var(--accent-primary)', icon: <Check size={12} /> };
        }
        if (s === 'missed') {
            return { bg: 'rgba(239, 68, 68, 0.1)', border: 'var(--accent-danger)', text: 'var(--accent-danger)', icon: <XCircle size={12} /> };
        }
        // Future / Planned
        return { bg: 'rgba(255, 255, 255, 0.05)', border: 'var(--border-subtle)', text: 'var(--text-secondary)', icon: null };
    };

    // --- AGENDA DATA (Mobile) ---
    const agendaData = useMemo(() => {
        if (!selectedStudentId) return [];
        // Show 2 days past, Today, 7 days future
        const center = new Date();
        center.setHours(0, 0, 0, 0);
        const start = new Date(center);
        start.setDate(start.getDate() - 3);
        const end = new Date(center);
        end.setDate(end.getDate() + 14);

        return workouts
            .filter(w => {
                const d = new Date(w.date);
                return w.studentId === selectedStudentId && d >= start && d <= end;
            })
            .sort((a, b) => new Date(a.date) - new Date(b.date));
    }, [workouts, selectedStudentId]);


    return (
        <div style={{
            background: 'var(--bg-card)',
            backdropFilter: 'blur(10px)',
            borderRadius: '16px',
            padding: isMobile ? '1rem' : '1.5rem',
            boxShadow: fullPageMode ? 'none' : 'var(--shadow-card)',
            border: fullPageMode ? 'none' : '1px solid var(--border-subtle)',
            height: fullPageMode && !isMobile ? '100%' : 'auto',
            display: 'flex', flexDirection: 'column'
        }}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <h2 style={{ fontSize: isMobile ? '1.1rem' : '1.25rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                        {isMobile ? 'Agenda' : 'Calendário'}
                    </h2>
                    {fullPageMode && !isMobile && (
                        <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', background: 'var(--bg-primary)', padding: '2px 8px', borderRadius: '12px', border: '1px solid var(--border-subtle)' }}>Mensal</span>
                    )}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'var(--bg-primary)', padding: '4px', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
                    <button onClick={() => changeMonth(-1)} style={{ background: 'transparent', border: '1px solid var(--border-subtle)', cursor: 'pointer', padding: '4px', borderRadius: '6px', display: 'flex', color: 'var(--text-secondary)' }}>
                        <ChevronLeft size={16} />
                    </button>
                    <span style={{ fontWeight: 600, color: 'var(--text-primary)', minWidth: isMobile ? '80px' : '120px', textAlign: 'center', fontSize: '0.9rem' }}>
                        {currentDate.toLocaleDateString('pt-BR', { month: isMobile ? 'short' : 'long', year: 'numeric' })}
                    </span>
                    <button onClick={() => changeMonth(1)} style={{ background: 'transparent', border: '1px solid var(--border-subtle)', cursor: 'pointer', padding: '4px', borderRadius: '6px', display: 'flex', color: 'var(--text-secondary)' }}>
                        <ChevronRight size={16} />
                    </button>
                </div>
            </div>

            {/* CONTENT */}
            {isMobile ? (
                // --- MOBILE AGENDA VIEW ---
                <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {agendaData.length === 0 ? (
                        <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: '1px dashed var(--border-subtle)' }}>
                            <CalendarIcon size={32} style={{ marginBottom: '8px', opacity: 0.5 }} />
                            <p>Nenhum treino no período.</p>
                        </div>
                    ) : (
                        agendaData.map((w, idx) => {
                            const wDate = new Date(w.date);
                            const todayStr = new Date().toDateString();
                            const wDateStr = wDate.toDateString();

                            // let dayLabel = wDate.toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: '2-digit' });
                            // if (wDateStr === todayStr) dayLabel = "HOJE";

                            const s = w.status === 'completed' ? 'completed' : ((wDate < new Date() && w.status !== 'completed') ? 'missed' : 'planned');
                            const style = getBlockStyle(s);
                            const isToday = wDateStr === todayStr;

                            return (
                                <div key={w.id} onClick={() => onDayClick && onDayClick(w.id)}
                                    style={{
                                        display: 'flex', gap: '16px', position: 'relative'
                                    }}
                                >
                                    {/* Timeline Line */}
                                    {idx !== agendaData.length - 1 && (
                                        <div style={{ position: 'absolute', left: '24px', top: '40px', bottom: '-20px', width: '2px', background: 'var(--border-subtle)' }} />
                                    )}

                                    {/* Date Bubble */}
                                    <div style={{
                                        display: 'flex', flexDirection: 'column', alignItems: 'center',
                                        minWidth: '50px'
                                    }}>
                                        <div style={{
                                            width: '48px', height: '48px', borderRadius: '12px',
                                            background: isToday ? 'var(--accent-primary)' : 'var(--bg-primary)',
                                            border: isToday ? 'none' : '1px solid var(--border-subtle)',
                                            color: isToday ? 'var(--text-on-accent)' : 'var(--text-secondary)',
                                            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                                            fontWeight: 700, fontSize: '1rem',
                                            zIndex: 1
                                        }}>
                                            <span style={{ fontSize: '0.6rem', fontWeight: 600, textTransform: 'uppercase', opacity: 0.8 }}>
                                                {wDate.toLocaleDateString('pt-BR', { weekday: 'short' }).slice(0, 3)}
                                            </span>
                                            {wDate.getDate()}
                                        </div>
                                    </div>

                                    {/* Card */}
                                    <div style={{
                                        flex: 1,
                                        background: 'rgba(255,255,255,0.03)',
                                        borderRadius: '12px',
                                        border: '1px solid var(--border-subtle)',
                                        padding: '12px',
                                        boxShadow: 'none',
                                        borderLeft: `4px solid ${style.border}`
                                    }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '6px' }}>
                                            <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                {getActivityIcon(w.activity_type)}
                                                {w.category || w.name || 'Treino'}
                                            </div>
                                            {style.icon && <div style={{ color: style.text }}>{style.icon}</div>}
                                        </div>

                                        <div style={{ display: 'flex', gap: '12px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                                            {w.duration_minutes && (
                                                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Clock size={12} /> {w.duration_minutes}m</span>
                                            )}
                                            {w.distance_km > 0 && (
                                                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><MapPin size={12} /> {w.distance_km}km</span>
                                            )}
                                            {!w.duration_minutes && !w.distance_km && (
                                                <span>{w.exercises?.length || 0} Exercícios</span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>

            ) : (
                // --- DESKTOP CALENDAR VIEW (TrainingPeaks Style) ---
                <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
                    {/* Weekday Headers */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', marginBottom: '8px', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '8px' }}>
                        {['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'].map((d, i) => (
                            <span key={i} style={{ textAlign: 'center', fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase' }}>{d}</span>
                        ))}
                    </div>
                    {/* Month Grid */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gridAutoRows: 'minmax(120px, 1fr)', flex: 1, borderLeft: '1px solid var(--border-subtle)', borderTop: '1px solid var(--border-subtle)' }}>
                        {monthData.map((day, idx) => {
                            if (day.type === 'padding') {
                                return <div key={`pad-${idx}`} style={{ background: 'rgba(255,255,255,0.02)', borderRight: '1px solid var(--border-subtle)', borderBottom: '1px solid var(--border-subtle)' }} />;
                            }

                            const isToday = new Date().toDateString() === day.date.toDateString();

                            return (
                                <div key={day.date.toString()}
                                    style={{
                                        background: isToday ? 'rgba(204, 255, 0, 0.05)' : 'transparent',
                                        borderRight: '1px solid var(--border-subtle)',
                                        borderBottom: '1px solid var(--border-subtle)',
                                        padding: '8px',
                                        display: 'flex', flexDirection: 'column', gap: '6px',
                                        position: 'relative',
                                        transition: 'background 0.2s',
                                        minHeight: '100px'
                                    }}
                                    onLoad={(e) => e.currentTarget.style.background = isToday ? 'rgba(204, 255, 0, 0.05)' : 'transparent'}
                                    onDragOver={(e) => {
                                        e.preventDefault();
                                        e.dataTransfer.dropEffect = 'move';
                                        e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
                                    }}
                                    onDragLeave={(e) => {
                                        e.currentTarget.style.background = isToday ? 'rgba(204, 255, 0, 0.05)' : 'transparent';
                                    }}
                                    onDrop={(e) => {
                                        e.preventDefault();
                                        e.currentTarget.style.background = isToday ? 'rgba(204, 255, 0, 0.05)' : 'transparent';
                                        const workoutId = e.dataTransfer.getData('text/plain');
                                        if (workoutId && updateWorkout) {
                                            const newDate = new Date(day.date);
                                            newDate.setHours(12, 0, 0, 0); // Noon for safety
                                            updateWorkout(workoutId, { date: newDate.toISOString() });
                                        }
                                    }}
                                >
                                    <span style={{
                                        fontSize: '0.85rem', fontWeight: 700,
                                        color: isToday ? 'var(--accent-primary)' : 'var(--text-secondary)',
                                        marginBottom: '4px', textAlign: 'right'
                                    }}>
                                        {day.day}
                                    </span>

                                    {/* Workout Blocks */}
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: 1 }}>
                                        {day.workouts.map(w => {
                                            const status = w.status === 'completed' ? 'completed' : ((new Date(w.date) < new Date() && w.status !== 'completed') ? 'missed' : 'planned');
                                            const style = getBlockStyle(status);

                                            return (
                                                <div key={w.id}
                                                    draggable={true}
                                                    onDragStart={(e) => {
                                                        e.dataTransfer.setData('text/plain', w.id);
                                                        e.dataTransfer.effectAllowed = 'move';
                                                        e.currentTarget.style.opacity = '0.5';
                                                    }}
                                                    onDragEnd={(e) => {
                                                        e.currentTarget.style.opacity = '1';
                                                    }}
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        onDayClick && onDayClick(w.id);
                                                    }}
                                                    title={w.name}
                                                    style={{
                                                        background: style.bg,
                                                        borderLeft: `3px solid ${style.border}`,
                                                        padding: '6px',
                                                        borderRadius: '4px',
                                                        cursor: 'grab',
                                                        display: 'flex', flexDirection: 'column', gap: '2px',
                                                        fontSize: '0.75rem',
                                                        boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
                                                        transition: 'transform 0.1s',
                                                    }}
                                                    onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.02)'}
                                                    onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                                                >
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 700, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden' }}>
                                                        {getActivityIcon(w.activity_type)}
                                                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{w.category || 'Treino'}</span>
                                                    </div>
                                                    <div style={{ color: 'var(--text-secondary)', fontSize: '0.7rem', display: 'flex', justifyContent: 'space-between' }}>
                                                        {w.duration_minutes ? <span>{w.duration_minutes}m</span> : <span>{w.exercises?.length}ex</span>}
                                                        {w.distance_km > 0 && <span>{w.distance_km}km</span>}
                                                        {w.normalized_load > 0 && <span style={{ fontWeight: 600 }}>TSS {w.normalized_load}</span>}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
};

export default AttendanceCalendar;
