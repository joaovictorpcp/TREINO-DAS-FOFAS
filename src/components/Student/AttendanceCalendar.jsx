import React, { useMemo, useState, useEffect } from 'react';
import { useWorkout } from '../../context/WorkoutContext';
import { useStudent } from '../../context/StudentContext';
import { ChevronLeft, ChevronRight, Check, Calendar as CalendarIcon, Clock, Dumbbell, Footprints, Bike, Waves, AlertCircle, XCircle, MapPin, Activity } from 'lucide-react';

const AttendanceCalendar = ({ viewMode = 'simple', onDayClick, fullPageMode = false }) => {
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

    // --- TrainingPeaks Block Logic ---
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
            return { bg: '#dcfce7', border: '#166534', text: '#14532d', icon: <Check size={12} /> }; // Green
        }
        if (s === 'missed') {
            return { bg: '#fee2e2', border: '#991b1b', text: '#7f1d1d', icon: <XCircle size={12} /> }; // Red
        }
        // Future / Planned
        return { bg: '#f1f5f9', border: '#94a3b8', text: '#475569', icon: null }; // Grey
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
            background: '#fff',
            borderRadius: '16px',
            padding: isMobile ? '1rem' : '1.5rem',
            boxShadow: fullPageMode ? 'none' : '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
            border: fullPageMode ? 'none' : '1px solid #e2e8f0',
            height: fullPageMode && !isMobile ? '100%' : 'auto',
            display: 'flex', flexDirection: 'column'
        }}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <h2 style={{ fontSize: isMobile ? '1.1rem' : '1.25rem', fontWeight: 700, color: '#1e293b', margin: 0 }}>
                        {isMobile ? 'Agenda' : 'Calendário'}
                    </h2>
                    {fullPageMode && !isMobile && (
                        <span style={{ fontSize: '0.9rem', color: '#64748B', background: '#f1f5f9', padding: '2px 8px', borderRadius: '12px' }}>Mensal</span>
                    )}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#f8fafc', padding: '4px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                    <button onClick={() => changeMonth(-1)} style={{ background: '#fff', border: '1px solid #e2e8f0', cursor: 'pointer', padding: '4px', borderRadius: '6px', display: 'flex' }}>
                        <ChevronLeft size={16} color="#64748B" />
                    </button>
                    <span style={{ fontWeight: 600, color: '#334155', minWidth: isMobile ? '80px' : '120px', textAlign: 'center', fontSize: '0.9rem' }}>
                        {currentDate.toLocaleDateString('pt-BR', { month: isMobile ? 'short' : 'long', year: 'numeric' })}
                    </span>
                    <button onClick={() => changeMonth(1)} style={{ background: '#fff', border: '1px solid #e2e8f0', cursor: 'pointer', padding: '4px', borderRadius: '6px', display: 'flex' }}>
                        <ChevronRight size={16} color="#64748B" />
                    </button>
                </div>
            </div>

            {/* CONTENT */}
            {isMobile ? (
                // --- MOBILE AGENDA VIEW ---
                <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {agendaData.length === 0 ? (
                        <div style={{ padding: '3rem', textAlign: 'center', color: '#94a3b8', background: '#f8fafc', borderRadius: '12px', border: '1px dashed #cbd5e1' }}>
                            <CalendarIcon size={32} style={{ marginBottom: '8px', opacity: 0.5 }} />
                            <p>Nenhum treino no período.</p>
                        </div>
                    ) : (
                        agendaData.map((w, idx) => {
                            const wDate = new Date(w.date);
                            const todayStr = new Date().toDateString();
                            const wDateStr = wDate.toDateString();

                            let dayLabel = wDate.toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: '2-digit' });
                            if (wDateStr === todayStr) dayLabel = "HOJE";

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
                                        <div style={{ position: 'absolute', left: '24px', top: '40px', bottom: '-20px', width: '2px', background: '#e2e8f0' }} />
                                    )}

                                    {/* Date Bubble */}
                                    <div style={{
                                        display: 'flex', flexDirection: 'column', alignItems: 'center',
                                        minWidth: '50px'
                                    }}>
                                        <div style={{
                                            width: '48px', height: '48px', borderRadius: '12px',
                                            background: isToday ? 'var(--accent-primary)' : '#fff',
                                            border: isToday ? 'none' : '1px solid #e2e8f0',
                                            color: isToday ? '#fff' : '#64748B',
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
                                        background: '#fff',
                                        borderRadius: '12px',
                                        border: '1px solid #e2e8f0',
                                        padding: '12px',
                                        boxShadow: '0 2px 4px rgba(0,0,0,0.02)',
                                        borderLeft: `4px solid ${style.border}`
                                    }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '6px' }}>
                                            <div style={{ fontWeight: 700, color: '#1e293b', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                {getActivityIcon(w.activity_type)}
                                                {w.category || w.name || 'Treino'}
                                            </div>
                                            {style.icon && <div style={{ color: style.text }}>{style.icon}</div>}
                                        </div>

                                        <div style={{ display: 'flex', gap: '12px', fontSize: '0.85rem', color: '#64748B' }}>
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
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', marginBottom: '8px', borderBottom: '1px solid #e2e8f0', paddingBottom: '8px' }}>
                        {['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'].map((d, i) => (
                            <span key={i} style={{ textAlign: 'center', fontSize: '0.8rem', color: '#64748B', fontWeight: 600, textTransform: 'uppercase' }}>{d}</span>
                        ))}
                    </div>
                    {/* Month Grid */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gridAutoRows: 'minmax(120px, 1fr)', flex: 1, borderLeft: '1px solid #e2e8f0', borderTop: '1px solid #e2e8f0' }}>
                        {monthData.map((day, idx) => {
                            if (day.type === 'padding') {
                                return <div key={`pad-${idx}`} style={{ background: '#fcfcfc', borderRight: '1px solid #e2e8f0', borderBottom: '1px solid #e2e8f0' }} />;
                            }

                            const isToday = new Date().toDateString() === day.date.toDateString();

                            return (
                                <div key={day.date.toString()}
                                    style={{
                                        background: isToday ? '#fffbeb' : '#fff',
                                        borderRight: '1px solid #e2e8f0',
                                        borderBottom: '1px solid #e2e8f0',
                                        padding: '8px',
                                        display: 'flex', flexDirection: 'column', gap: '6px',
                                        position: 'relative',
                                        transition: 'background 0.2s',
                                        minHeight: '100px'
                                    }}
                                    onLoad={(e) => e.currentTarget.style.background = isToday ? '#fffbeb' : '#f8fafc'}
                                    onDragOver={(e) => {
                                        e.preventDefault();
                                        e.dataTransfer.dropEffect = 'move';
                                        e.currentTarget.style.background = '#f0fdf4'; // Light green highlight
                                    }}
                                    onDragLeave={(e) => {
                                        e.currentTarget.style.background = isToday ? '#fffbeb' : '#fff';
                                    }}
                                    onDrop={(e) => {
                                        e.preventDefault();
                                        e.currentTarget.style.background = isToday ? '#fffbeb' : '#fff';
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
                                        color: isToday ? '#b45309' : '#94a3b8',
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
                                                        boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                                                        transition: 'transform 0.1s',
                                                    }}
                                                    onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.02)'}
                                                    onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                                                >
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 700, color: '#1e293b', whiteSpace: 'nowrap', overflow: 'hidden' }}>
                                                        {getActivityIcon(w.activity_type)}
                                                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{w.category || 'Treino'}</span>
                                                    </div>
                                                    <div style={{ color: '#475569', fontSize: '0.7rem', display: 'flex', justifyContent: 'space-between' }}>
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
