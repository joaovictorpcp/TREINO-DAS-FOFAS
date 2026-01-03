import React, { useState } from 'react';
import { useWorkout } from '../context/WorkoutContext';
import { useNavigate } from 'react-router-dom';
import { Calendar, CheckCircle, Circle, ArrowRight, Download, X, StickyNote } from 'lucide-react';
import { useStudent } from '../context/StudentContext';
import styles from './WorkoutsPage.module.css';

const WorkoutsPage = () => {
    const { workouts, deleteWorkout, clearWorkouts, importMesocycle } = useWorkout();
    const { selectedStudentId, students } = useStudent();
    const navigate = useNavigate();

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

    // Group by Mesocycle
    const groupedWorkouts = displayedWorkouts.reduce((acc, w) => {
        const meso = w.meta?.mesocycle || 1;
        if (!acc[meso]) acc[meso] = [];
        acc[meso].push(w);
        return acc;
    }, {});

    // Sort Mesocycles (Descending)
    const sortedMesos = Object.keys(groupedWorkouts).sort((a, b) => b - a);

    return (
        <div className="page-container animate-fade-in">
            <header style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h1 className={styles.title}>Meus Treinos</h1>
                    <p className={styles.subtitle}>Gerencie seus ciclos e programação</p>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                        onClick={() => setIsImportModalOpen(true)}
                        className="btn"
                        style={{ display: 'flex', alignItems: 'center', gap: '6px', border: '1px dashed #cbd5e1', color: '#475569' }}
                    >
                        <Download size={16} /> Importar
                    </button>

                    {workouts.length > 0 && (
                        <button onClick={handleClearAll} className="btn" style={{ color: '#ef4444', border: '1px solid #fee2e2' }}>
                            Limpar Tudo
                        </button>
                    )}
                </div>
            </header>

            {sortedMesos.map((meso, index) => {
                // Sort weeks ascending within meso
                const mesoWorkouts = groupedWorkouts[meso].sort((a, b) => (a.meta?.week || 0) - (b.meta?.week || 0));

                // Get Month Name from the first workout (or planned date)
                const firstWorkoutDate = mesoWorkouts[0]?.date ? new Date(mesoWorkouts[0].date) : new Date();
                const monthName = firstWorkoutDate.toLocaleString('pt-BR', { month: 'long' });
                const capitalizedMonth = monthName.charAt(0).toUpperCase() + monthName.slice(1);

                return (
                    <div key={meso} className={styles.mesoSection}>
                        {/* Visual Divider (except for the first one) */}
                        {index > 0 && <div className={styles.mesoDivider}></div>}

                        <h2 className={styles.mesoTitle}>
                            <span className={styles.mesoNumber}>Mesociclo {meso}</span>
                            <span className={styles.mesoMonth}>{capitalizedMonth}</span>
                        </h2>

                        <div className={styles.grid}>
                            {mesoWorkouts.map(w => {
                                const isPlanned = w.status === 'planned';
                                return (
                                    <div
                                        key={w.id}
                                        className={`${styles.card} ${isPlanned ? styles.planned : styles.completed}`}
                                        onClick={() => navigate(`/edit/${w.id}`)}
                                    >
                                        <div className={styles.cardHeader}>
                                            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                                <span className={styles.weekBadge}>Semana {w.meta?.week}</span>
                                                {w.category && (
                                                    <span style={{
                                                        fontSize: '0.75rem',
                                                        fontWeight: 700,
                                                        color: '#1e293b',
                                                        background: '#e2e8f0',
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
                                                {isPlanned ? <Circle size={18} color="#94a3b8" /> : <CheckCircle size={18} color="#10b981" />}
                                            </div>
                                        </div>

                                        <div className={styles.cardContent}>
                                            <div className={styles.date}>
                                                <Calendar size={14} />
                                                {new Date(w.date).toLocaleDateString('pt-BR')}
                                            </div>
                                            <div className={styles.exercises}>
                                                {w.exercises?.length} Exercícios
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
            })}

            {workouts.length === 0 && (
                <div style={{ textAlign: 'center', marginTop: '4rem', color: '#94a3b8' }}>
                    <p>Nenhum treino registrado.</p>
                    <button onClick={() => navigate('/mesocycle-builder')} className="btn btn-primary" style={{ marginTop: '1rem' }}>
                        Começar Novo Ciclo
                    </button>
                </div>
            )}
            {/* Import Modal */}
            {isImportModalOpen && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(0,0,0,0.5)', zIndex: 1000,
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                    <div style={{
                        background: '#fff', padding: '2rem', borderRadius: '16px',
                        width: '90%', maxWidth: '400px',
                        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)'
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                            <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Importar Treino</h2>
                            <button onClick={() => setIsImportModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                                <X size={24} color="#64748B" />
                            </button>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: 500, marginBottom: '4px', color: '#475569' }}>
                                    Copiar de qual aluno?
                                </label>
                                <select
                                    value={importSourceStudentId}
                                    onChange={e => setImportSourceStudentId(e.target.value)}
                                    className="input"
                                    style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                                >
                                    <option value="">Selecione...</option>
                                    {students.filter(s => s.id !== selectedStudentId).map(s => (
                                        <option key={s.id} value={s.id}>{s.name}</option>
                                    ))}
                                </select>
                            </div>

                            {importSourceStudentId && (
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: 500, marginBottom: '4px', color: '#475569' }}>
                                        Qual Mesociclo?
                                    </label>
                                    <select
                                        value={importSourceMeso}
                                        onChange={e => setImportSourceMeso(e.target.value)}
                                        className="input"
                                        style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
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
