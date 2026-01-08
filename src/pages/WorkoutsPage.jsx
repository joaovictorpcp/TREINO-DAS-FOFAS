import React, { useState } from 'react';
import { useWorkout } from '../context/WorkoutContext';
import { useNavigate } from 'react-router-dom';
import { Calendar, List, Download, X, StickyNote, CheckCircle, Circle, ArrowRight, Dumbbell, Bike, Footprints, Waves, Clock, MapPin, LayoutGrid } from 'lucide-react';
import { useStudent } from '../context/StudentContext';
import styles from './WorkoutsPage.module.css';
import AttendanceCalendar from '../components/Student/AttendanceCalendar';

const WorkoutsPage = () => {
    const { workouts, clearWorkouts, importMesocycle } = useWorkout();
    const { selectedStudentId, students } = useStudent();
    const navigate = useNavigate();

    const [viewMode, setViewMode] = useState('calendar'); // 'calendar' | 'list'

    // Import Modal State
    const [isImportModalOpen, setIsImportModalOpen] = useState(false);
    const [importSourceStudentId, setImportSourceStudentId] = useState('');
    const [importSourceMeso, setImportSourceMeso] = useState('');

    // Derived state for import options
    const sourceStudentWorkouts = importSourceStudentId
        ? workouts.filter(w => w.studentId === importSourceStudentId)
        : [];
    const sourceMesocycles = [...new Set(sourceStudentWorkouts.map(w => w.meta?.mesocycle || 1))].sort((a, b) => b - a);

    const handleImportWrapper = () => {
        if (!importSourceStudentId || !importSourceMeso) return;
        try {
            const count = importMesocycle(importSourceStudentId, selectedStudentId, parseInt(importSourceMeso));
            alert(`${count} treinos importados com sucesso!`);
            setIsImportModalOpen(false);
            setImportSourceStudentId('');
            setImportSourceMeso('');
        } catch (error) {
            alert(error.message);
        }
    };

    // Filter by Student
    const displayedWorkouts = selectedStudentId
        ? workouts.filter(w => w.studentId === selectedStudentId)
        : workouts;

    const handleClearAll = () => {
        if (window.confirm("Tem certeza que deseja apagar TODOS os treinos exibidos?")) {
            clearWorkouts(selectedStudentId);
        }
    };

    // Group by Mesocycle (List View Logic)
    const groupedWorkouts = displayedWorkouts.reduce((acc, w) => {
        const meso = w.meta?.mesocycle || 1;
        if (!acc[meso]) acc[meso] = [];
        acc[meso].push(w);
        return acc;
    }, {});
    const sortedMesos = Object.keys(groupedWorkouts).sort((a, b) => b - a);

    return (
        <div className="page-container animate-fade-in">
            <header style={{ marginBottom: '2rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <div>
                        <h1 className={styles.title} style={{ color: 'var(--text-primary)' }}>Meus Treinos</h1>
                        <p className={styles.subtitle} style={{ color: 'var(--text-secondary)' }}>Planejamento e Histórico</p>
                    </div>
                </div>

                {/* Toolbar */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                    {/* View Switcher */}
                    <div style={{ display: 'flex', background: 'var(--bg-secondary)', padding: '4px', borderRadius: '8px' }}>
                        <button
                            onClick={() => setViewMode('calendar')}
                            style={{
                                display: 'flex', alignItems: 'center', gap: '6px',
                                padding: '6px 16px', borderRadius: '6px', border: 'none',
                                background: viewMode === 'calendar' ? 'var(--accent-primary)' : 'transparent',
                                color: viewMode === 'calendar' ? '#000' : 'var(--text-secondary)',
                                fontWeight: 600, cursor: 'pointer', boxShadow: viewMode === 'calendar' ? '0 1px 2px rgba(0,0,0,0.1)' : 'none',
                                transition: 'all 0.2s'
                            }}
                        >
                            <LayoutGrid size={16} /> Calendário
                        </button>
                        <button
                            onClick={() => setViewMode('list')}
                            style={{
                                display: 'flex', alignItems: 'center', gap: '6px',
                                padding: '6px 16px', borderRadius: '6px', border: 'none',
                                background: viewMode === 'list' ? 'var(--accent-primary)' : 'transparent',
                                color: viewMode === 'list' ? '#000' : 'var(--text-secondary)',
                                fontWeight: 600, cursor: 'pointer', boxShadow: viewMode === 'list' ? '0 1px 2px rgba(0,0,0,0.1)' : 'none',
                                transition: 'all 0.2s'
                            }}
                        >
                            <List size={16} /> Lista
                        </button>
                    </div>

                    <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                            onClick={() => setIsImportModalOpen(true)}
                            className="btn"
                            style={{ display: 'flex', alignItems: 'center', gap: '6px', border: '1px dashed var(--border-subtle)', color: 'var(--text-secondary)', fontSize: '0.9rem', background: 'transparent' }}
                        >
                            <Download size={16} /> Importar Ciclo
                        </button>

                        {workouts.length > 0 && viewMode === 'list' && (
                            <button onClick={handleClearAll} className="btn" style={{ color: '#ef4444', border: '1px solid #7f1d1d', background: 'rgba(239, 68, 68, 0.1)', fontSize: '0.9rem' }}>
                                Limpar
                            </button>
                        )}
                    </div>
                </div>
            </header>

            {/* CONTENT AREA */}
            {viewMode === 'calendar' ? (
                <div className="animate-fade-in">
                    <AttendanceCalendar
                        fullPageMode={true}
                        onDayClick={(id) => navigate(`/edit/${id}`)}
                    />
                </div>
            ) : (
                <div className="animate-fade-in">
                    {sortedMesos.length === 0 ? (
                        <div style={{ textAlign: 'center', marginTop: '4rem', color: 'var(--text-muted)' }}>
                            <p>Nenhum treino registrado.</p>
                            <button onClick={() => navigate('/mesocycle-builder')} className="btn btn-primary" style={{ marginTop: '1rem' }}>
                                Começar Novo Ciclo
                            </button>
                        </div>
                    ) : (
                        sortedMesos.map((meso, index) => {
                            const mesoWorkouts = groupedWorkouts[meso].sort((a, b) => (a.meta?.week || 0) - (b.meta?.week || 0));
                            const firstWorkoutDate = mesoWorkouts[0]?.date ? new Date(mesoWorkouts[0].date) : new Date();
                            const monthName = firstWorkoutDate.toLocaleString('pt-BR', { month: 'long' });
                            const capitalizedMonth = monthName.charAt(0).toUpperCase() + monthName.slice(1);

                            return (
                                <div key={meso} className={styles.mesoSection}>
                                    {index > 0 && <div className={styles.mesoDivider} style={{ borderColor: 'var(--border-subtle)' }}></div>}

                                    <h2 className={styles.mesoTitle} style={{ color: 'var(--text-primary)' }}>
                                        <span className={styles.mesoNumber} style={{ color: 'var(--accent-primary)' }}>Mesociclo {meso}</span>
                                        <span className={styles.mesoMonth} style={{ color: 'var(--text-secondary)' }}>{capitalizedMonth}</span>
                                    </h2>

                                    <div className={styles.grid}>
                                        {mesoWorkouts.map(w => {
                                            const isPlanned = w.status === 'planned';
                                            return (
                                                <div
                                                    key={w.id}
                                                    className={`glass-panel ${styles.card} ${isPlanned ? styles.planned : styles.completed}`}
                                                    onClick={() => navigate(`/edit/${w.id}`)}
                                                    style={{
                                                        cursor: 'pointer',
                                                        border: isPlanned ? '1px solid var(--border-subtle)' : '1px solid var(--accent-primary)',
                                                        background: 'rgba(20, 20, 20, 0.6)'
                                                    }}
                                                >
                                                    <div className={styles.cardHeader}>
                                                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                                            <span className={styles.weekBadge} style={{ background: 'var(--bg-secondary)', color: 'var(--text-secondary)' }}>Semana {w.meta?.week}</span>
                                                            <div style={{
                                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                                width: '24px', height: '24px', borderRadius: '50%',
                                                                background: w.status === 'completed' ? 'rgba(204, 255, 0, 0.2)' : 'rgba(255, 61, 0, 0.2)',
                                                                color: w.status === 'completed' ? 'var(--accent-primary)' : 'var(--accent-danger)'
                                                            }}>
                                                                {(!w.activity_type || w.activity_type === 'weightlifting') && <Dumbbell size={14} />}
                                                                {w.activity_type === 'running' && <Footprints size={14} />}
                                                                {w.activity_type === 'cycling' && <Bike size={14} />}
                                                                {w.activity_type === 'swimming' && <Waves size={14} />}
                                                            </div>

                                                            {w.category && (
                                                                <span style={{
                                                                    fontSize: '0.75rem',
                                                                    fontWeight: 700,
                                                                    color: 'var(--text-primary)',
                                                                    background: 'var(--bg-secondary)',
                                                                    padding: '2px 8px',
                                                                    borderRadius: '12px'
                                                                }}>
                                                                    {w.category}
                                                                </span>
                                                            )}
                                                        </div>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                            {w.observations && (
                                                                <div title="Possui observações salvas" style={{ color: '#F59E0B' }}>
                                                                    <StickyNote size={16} fill="#F59E0B" fillOpacity={0.2} />
                                                                </div>
                                                            )}
                                                            {isPlanned ? <Circle size={18} color="var(--text-muted)" /> : <CheckCircle size={18} color="#10b981" />}
                                                        </div>
                                                    </div>

                                                    <div className={styles.cardContent}>
                                                        <div className={styles.date} style={{ color: 'var(--text-muted)' }}>
                                                            <Calendar size={14} />
                                                            {new Date(w.date).toLocaleDateString('pt-BR')}
                                                        </div>
                                                        <div className={styles.exercises} style={{ color: 'var(--text-secondary)' }}>
                                                            {w.activity_type && w.activity_type !== 'weightlifting' ? (
                                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Clock size={14} /> {w.duration_minutes || '-'}min</span>
                                                                    {w.distance_km > 0 && (
                                                                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><MapPin size={14} /> {w.distance_km}km</span>
                                                                    )}
                                                                </div>
                                                            ) : (
                                                                <>{w.exercises?.length} Exercícios</>
                                                            )}
                                                        </div>
                                                    </div>

                                                    {isPlanned && (
                                                        <button className={styles.fillBtn}>
                                                            Preencher Agora <ArrowRight size={14} />
                                                        </button>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            )}

            {/* Import Modal */}
            {isImportModalOpen && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(0,0,0,0.8)', zIndex: 1000,
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
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)' }}>Importar Treino</h2>
                            <button onClick={() => setIsImportModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                                <X size={24} color="var(--text-muted)" />
                            </button>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: 500, marginBottom: '4px', color: 'var(--text-secondary)' }}>
                                    Copiar de qual aluno?
                                </label>
                                <select
                                    value={importSourceStudentId}
                                    onChange={e => setImportSourceStudentId(e.target.value)}
                                    className="input"
                                    style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-subtle)', background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
                                >
                                    <option value="">Selecione...</option>
                                    {students.filter(s => s.id !== selectedStudentId).map(s => (
                                        <option key={s.id} value={s.id}>{s.name}</option>
                                    ))}
                                </select>
                            </div>

                            {importSourceStudentId && (
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: 500, marginBottom: '4px', color: 'var(--text-secondary)' }}>
                                        Qual Mesociclo?
                                    </label>
                                    <select
                                        value={importSourceMeso}
                                        onChange={e => setImportSourceMeso(e.target.value)}
                                        className="input"
                                        style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-subtle)', background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
                                    >
                                        <option value="">Selecione...</option>
                                        {sourceMesocycles.length === 0 && <option disabled>Nenhum treino encontrado</option>}
                                        {sourceMesocycles.map(m => (
                                            <option key={m} value={m}>Mesociclo #{m}</option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            <button
                                onClick={handleImportWrapper}
                                disabled={!importSourceStudentId || !importSourceMeso}
                                className="btn btn-primary"
                                style={{ marginTop: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', opacity: (!importSourceStudentId || !importSourceMeso) ? 0.5 : 1 }}
                            >
                                <Download size={18} /> Confirmar Importação
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default WorkoutsPage;
