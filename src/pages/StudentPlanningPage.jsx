import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import AttendanceCalendar from '../components/Student/AttendanceCalendar';
import { LogOut } from 'lucide-react';

const StudentPlanningPage = () => {
    const { user, signOut } = useAuth();
    const navigate = useNavigate();

    const handleLogout = async () => {
        await signOut();
        navigate('/');
    };

    return (
        <div className="page-container animate-fade-in">
            <header style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                marginBottom: '2rem', paddingBottom: '1rem', borderBottom: '1px solid var(--border-subtle)'
            }}>
                <div>
                    <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                        Planejamento
                    </h1>
                    <p style={{ color: 'var(--text-secondary)' }}>
                        Calendário de treinos agendados
                    </p>
                </div>
                <button
                    onClick={handleLogout}
                    className="btn"
                    style={{
                        background: 'rgba(255, 61, 0, 0.1)',
                        color: 'var(--accent-danger)',
                        border: '1px solid var(--accent-danger)'
                    }}
                >
                    <LogOut size={16} /> Sair
                </button>
            </header>

            <div className="glass-panel" style={{ padding: '1rem' }}>
                <AttendanceCalendar
                    fullPageMode={true}
                    onDayClick={(id) => navigate(`/edit/${id}`)}
                />
            </div>
        </div>
    );
};

export default StudentPlanningPage;
