import React from 'react';
import { useWorkout } from '../context/WorkoutContext';
import { useNavigate } from 'react-router-dom';
import { Calendar, CheckCircle, Circle, ArrowRight } from 'lucide-react';
import styles from './WorkoutsPage.module.css';

const WorkoutsPage = () => {
    const { workouts, deleteWorkout, clearWorkouts } = useWorkout();
    const navigate = useNavigate();

    const handleClearAll = () => {
        if (window.confirm("Tem certeza que deseja apagar TODOS os treinos?")) {
            localStorage.removeItem('workouts');
            window.location.reload();
        }
    };

    // Group by Mesocycle
    const groupedWorkouts = workouts.reduce((acc, w) => {
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
                {workouts.length > 0 && (
                    <button onClick={handleClearAll} className="btn" style={{ color: '#ef4444', border: '1px solid #fee2e2' }}>
                        Limpar Tudo
                    </button>
                )}
            </header>

            {sortedMesos.map(meso => {
                // Sort weeks ascending within meso
                const mesoWorkouts = groupedWorkouts[meso].sort((a, b) => (a.meta?.week || 0) - (b.meta?.week || 0));

                return (
                    <div key={meso} className={styles.mesoSection}>
                        <h2 className={styles.mesoTitle}>Mesociclo #{meso}</h2>
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
                                            <span className={styles.weekBadge}>Semana {w.meta?.week}</span>
                                            {isPlanned ? <Circle size={18} color="#94a3b8" /> : <CheckCircle size={18} color="#10b981" />}
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
                    <button onClick={() => navigate('/create')} className="btn btn-primary" style={{ marginTop: '1rem' }}>
                        Começar Novo Ciclo
                    </button>
                </div>
            )}
        </div>
    );
};

export default WorkoutsPage;
