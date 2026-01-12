import React, { useMemo, useState, useEffect } from 'react';
import { useWorkout } from '../../context/WorkoutContext';
import { useStudent } from '../../context/StudentContext';
import { ChevronLeft, ChevronRight, Check, Calendar as CalendarIcon, Clock, Dumbbell, Footprints, Bike, Waves, AlertCircle, XCircle, MapPin, Activity, Trash2, Copy, Square, CheckSquare, X } from 'lucide-react';

const AttendanceCalendar = ({ onDayClick, fullPageMode = false }) => {
    const { workouts, updateWorkout, deleteWorkout, bulkAddWorkouts } = useWorkout();
    const { selectedStudentId } = useStudent();

    const [currentDate, setCurrentDate] = useState(new Date());
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

    // Bulk Selection State
    const [isSelectionMode, setIsSelectionMode] = useState(false);
    const [selectedWorkouts, setSelectedWorkouts] = useState([]);
    const [isDuplicateModalOpen, setIsDuplicateModalOpen] = useState(false);
    const [duplicateTargetDate, setDuplicateTargetDate] = useState('');

    const toggleSelection = (id) => {
        setSelectedWorkouts(prev =>
            prev.includes(id) ? prev.filter(wId => wId !== id) : [...prev, id]
        );
    };

    const handleBulkDelete = async () => {
        if (!confirm(`Tem certeza que deseja apagar ${selectedWorkouts.length} treinos?`)) return;
        await Promise.all(selectedWorkouts.map(id => deleteWorkout(id)));
        setSelectedWorkouts([]);
        setIsSelectionMode(false);
    };

    const handleBulkDuplicate = async () => {
        if (!duplicateTargetDate) return;
        if (selectedWorkouts.length === 0) return;

        const targets = workouts.filter(w => selectedWorkouts.includes(w.id));
        if (targets.length === 0) return;

        const sortedTargets = [...targets].sort((a, b) => new Date(a.date) - new Date(b.date));
        const earliestDate = new Date(sortedTargets[0].date);
        const newStartDate = new Date(duplicateTargetDate);
        // Set newStartDate to Noon to avoid TZ issues
        newStartDate.setHours(12, 0, 0, 0);

        const timeDiff = newStartDate.getTime() - earliestDate.getTime();

        const newWorkoutsData = sortedTargets.map(w => {
            const originalDate = new Date(w.date);
            const nextDate = new Date(originalDate.getTime() + timeDiff);

            return {
                ...w,
                date: nextDate.toISOString(),
                studentId: selectedStudentId || w.studentId,
                status: 'planned',
                exercises: w.exercises.map(ex => ({
                    ...ex,
                    id: crypto.randomUUID(),
                    load: ex.load,
                    reps: ex.reps,
                    rpe: '',
                    rir: '',
                    vtt: 0
                })),
                meta: { ...w.meta }
            };
        });

        await bulkAddWorkouts(newWorkoutsData);

        setIsDuplicateModalOpen(false);
        setDuplicateTargetDate('');
        setSelectedWorkouts([]);
        setIsSelectionMode(false);
        alert(`${newWorkoutsData.length} treinos duplicados com sucesso!`);
    };

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
            // Handle Timezone offset for strict date comparison if needed, but simple Month/Year check usually safe
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
    // UPDATED: Now filters based on the SELECTED MONTH (currentDate), not a fixed "Agenda" window.
    const agendaData = useMemo(() => {
        if (!selectedStudentId) return [];

        return workouts
            .filter(w => {
                if (w.studentId !== selectedStudentId) return false;
                const d = new Date(w.date);
                // Strict Month/Year filtering based on header navigation
                return d.getMonth() === currentDate.getMonth() &&
                    d.getFullYear() === currentDate.getFullYear();
            })
            .sort((a, b) => new Date(a.date) - new Date(b.date));
    }, [workouts, selectedStudentId, currentDate]);

    const handleDelete = (e, workoutId) => {
        e.stopPropagation(); // Prevent card click
        if (window.confirm("Tem certeza que deseja apagar este treino?")) {
            deleteWorkout(workoutId);
        }
    };


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
                    <button
                        onClick={() => {
                            if (isSelectionMode) {
                                setIsSelectionMode(false);
                                setSelectedWorkouts([]);
                            } else {
                                setIsSelectionMode(true);
                            }
                        }}
                        style={{
                            background: isSelectionMode ? 'var(--accent-primary)' : 'transparent',
                            color: isSelectionMode ? '#000' : 'var(--text-secondary)',
                            border: isSelectionMode ? 'none' : '1px dashed var(--border-subtle)',
                            borderRadius: '6px',
                            padding: '4px 8px',
                            cursor: 'pointer',
                            fontSize: '0.8rem',
                            display: 'flex', alignItems: 'center', gap: '4px',
                            marginLeft: '8px'
                        }}
                    >
                        {isSelectionMode ? <CheckSquare size={14} /> : <Square size={14} />}
                        {isSelectionMode ? 'Cancelar' : 'Selecionar'}
                    </button>
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
                            <p>Nenhum treino neste mês.</p>
                        </div>
                    ) : (
                        agendaData.map((w, idx) => {
                            const wDate = new Date(w.date);
                            const todayStr = new Date().toDateString();
                            const wDateStr = wDate.toDateString();

                            const s = w.status === 'completed' ? 'completed' : ((wDate < new Date() && w.status !== 'completed') ? 'missed' : 'planned');
                            const style = getBlockStyle(s);
                            const isToday = wDateStr === todayStr;

                            // Workout Name Logic: Prioritize Custom Name -> Category -> Default
                            const displayName = w.meta?.category || w.category || w.name || 'Treino';
                            const isSelected = selectedWorkouts.includes(w.id);

                            return (
                                <div key={w.id} onClick={() => isSelectionMode ? toggleSelection(w.id) : (onDayClick && onDayClick(w.id))}
                                    style={{
                                        display: 'flex', gap: '16px', position: 'relative',
                                        opacity: (isSelectionMode && !isSelected) ? 0.6 : 1,
                                        transition: 'opacity 0.2s',
                                        cursor: isSelectionMode ? 'pointer' : 'default'
                                    }}
                                >
                                    {/* Selection Checkbox Mobile */}
                                    {isSelectionMode && (
                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                            {isSelected ? <CheckSquare color="var(--accent-primary)" size={24} /> : <Square color="var(--text-muted)" size={24} />}
                                        </div>
                                    )}

                                    {/* Timeline Line */}
                                    {!isSelectionMode && idx !== agendaData.length - 1 && (
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
                                        borderLeft: `4px solid ${style.border}`,
                                        position: 'relative' // For absolute buttons
                                    }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '6px' }}>
                                            <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                {getActivityIcon(w.activity_type)}
                                                {displayName}
                                            </div>
                                            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                                {/* Delete Button Mobile */}
                                                <button
                                                    onClick={(e) => handleDelete(e, w.id)}
                                                    style={{
                                                        background: 'none', border: 'none', color: 'var(--text-muted)',
                                                        cursor: 'pointer', padding: '4px', zIndex: 10
                                                    }}
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                                {style.icon && <div style={{ color: style.text }}>{style.icon}</div>}
                                            </div>
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
                                            const isSelected = selectedWorkouts.includes(w.id);

                                            return (
                                                <div key={w.id}
                                                    draggable={!isSelectionMode}
                                                    className="group"
                                                    onDragStart={(e) => {
                                                        if (isSelectionMode) { e.preventDefault(); return; }
                                                        e.dataTransfer.setData('text/plain', w.id);
                                                        e.dataTransfer.effectAllowed = 'move';
                                                        e.currentTarget.style.opacity = '0.5';
                                                    }}
                                                    onDragEnd={(e) => {
                                                        e.currentTarget.style.opacity = '1';
                                                    }}
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        if (isSelectionMode) {
                                                            toggleSelection(w.id);
                                                        } else {
                                                            onDayClick && onDayClick(w.id);
                                                        }
                                                    }}
                                                    title={w.name}
                                                    style={{
                                                        background: isSelected ? 'rgba(204, 255, 0, 0.1)' : style.bg,
                                                        borderLeft: `3px solid ${isSelected ? 'var(--accent-primary)' : style.border}`,
                                                        border: isSelected ? '1px solid var(--accent-primary)' : undefined,
                                                        padding: '6px',
                                                        borderRadius: '4px',
                                                        cursor: isSelectionMode ? 'pointer' : 'grab',
                                                        display: 'flex', flexDirection: 'column', gap: '2px',
                                                        fontSize: '0.75rem',
                                                        boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
                                                        transition: 'all 0.1s',
                                                        position: 'relative',
                                                        overflow: 'hidden'
                                                    }}
                                                    onMouseEnter={e => {
                                                        if (!isSelectionMode) {
                                                            e.currentTarget.style.transform = 'scale(1.02)';
                                                            const btn = e.currentTarget.querySelector('.delete-btn');
                                                            if (btn) btn.style.display = 'flex';
                                                        }
                                                    }}
                                                    onMouseLeave={e => {
                                                        e.currentTarget.style.transform = 'scale(1)';
                                                        const btn = e.currentTarget.querySelector('.delete-btn');
                                                        if (btn) btn.style.display = 'none';
                                                    }}
                                                >
                                                    {isSelectionMode && (
                                                        <div style={{ position: 'absolute', top: '2px', right: '2px', zIndex: 10 }}>
                                                            {isSelected ? <CheckSquare size={14} color="var(--accent-primary)" fill="rgba(0,0,0,0.5)" /> : <Square size={14} color="rgba(255,255,255,0.3)" />}
                                                        </div>
                                                    )}

                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 700, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', paddingRight: isSelectionMode ? '16px' : '16px' }}>
                                                        {getActivityIcon(w.activity_type)}
                                                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{w.meta?.category || w.category || w.name || 'Treino'}</span>
                                                    </div>

                                                    {/* Delete Button - Desktop (Hidden in selection mode) */}
                                                    {!isSelectionMode && (
                                                        <button
                                                            className="delete-btn"
                                                            onClick={(e) => handleDelete(e, w.id)}
                                                            style={{
                                                                position: 'absolute',
                                                                top: '2px',
                                                                right: '2px',
                                                                background: 'rgba(0,0,0,0.5)',
                                                                color: '#fff',
                                                                border: 'none',
                                                                borderRadius: '4px',
                                                                width: '20px',
                                                                height: '20px',
                                                                display: 'none',
                                                                alignItems: 'center',
                                                                justifyContent: 'center',
                                                                cursor: 'pointer',
                                                                zIndex: 20
                                                            }}
                                                        >
                                                            <Trash2 size={12} />
                                                        </button>
                                                    )}

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
            {/* Floating Action Bar (Selection Mode) */}
            {isSelectionMode && (
                <div className="animate-slide-up" style={{
                    position: 'fixed', bottom: '24px', left: '50%', transform: 'translateX(-50%)',
                    background: 'var(--bg-card)', padding: '12px 24px', borderRadius: '16px',
                    boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.5), 0 0 0 1px var(--border-subtle)',
                    display: 'flex', alignItems: 'center', gap: '16px', zIndex: 100,
                    minWidth: '300px', justifyContent: 'center'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)', fontSize: '0.9rem', marginRight: '8px' }}>
                        <span style={{ fontWeight: 700, color: 'var(--accent-primary)' }}>{selectedWorkouts.length}</span>
                        selecionado(s)
                    </div>

                    <div style={{ width: '1px', height: '20px', background: 'var(--border-subtle)' }} />

                    <button
                        onClick={handleBulkDelete}
                        disabled={selectedWorkouts.length === 0}
                        style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px', fontSize: '0.7rem' }}
                    >
                        <Trash2 size={20} />
                        Excluir
                    </button>

                    <button
                        onClick={() => setIsDuplicateModalOpen(true)}
                        disabled={selectedWorkouts.length === 0}
                        style={{ background: 'transparent', border: 'none', color: 'var(--text-primary)', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px', fontSize: '0.7rem' }}
                    >
                        <Copy size={20} />
                        Duplicar
                    </button>

                    <button
                        onClick={() => { setIsSelectionMode(false); setSelectedWorkouts([]); }}
                        style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px', fontSize: '0.7rem', marginLeft: '8px' }}
                    >
                        <XCircle size={20} />
                        Cancelar
                    </button>
                </div>
            )}

            {/* Duplicate Modal */}
            {isDuplicateModalOpen && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(0,0,0,0.8)', zIndex: 200,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    backdropFilter: 'blur(4px)'
                }}>
                    <div className="glass-panel" style={{
                        padding: '2rem', borderRadius: '16px',
                        width: '90%', maxWidth: '400px',
                        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5)',
                        background: 'var(--bg-primary)',
                        border: '1px solid var(--border-subtle)'
                    }}>
                        <h3 style={{ fontSize: '1.2rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '1rem' }}>
                            Duplicar {selectedWorkouts.length} treinos
                        </h3>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
                            Selecione a data de início para a cópia. Os intervalos entre os treinos originais serão mantidos.
                        </p>

                        <div style={{ marginBottom: '1.5rem' }}>
                            <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Início da Cópia:</label>
                            <input
                                type="date"
                                value={duplicateTargetDate}
                                onChange={e => setDuplicateTargetDate(e.target.value)}
                                className="input"
                                style={{
                                    width: '100%', padding: '12px', borderRadius: '8px',
                                    background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)',
                                    color: 'var(--text-primary)'
                                }}
                            />
                        </div>

                        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                            <button
                                onClick={() => setIsDuplicateModalOpen(false)}
                                className="btn"
                                style={{ background: 'transparent', border: '1px solid var(--border-subtle)', color: 'var(--text-secondary)' }}
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleBulkDuplicate}
                                disabled={!duplicateTargetDate}
                                className="btn btn-primary"
                                style={{ opacity: !duplicateTargetDate ? 0.5 : 1 }}
                            >
                                Confirmar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AttendanceCalendar;
