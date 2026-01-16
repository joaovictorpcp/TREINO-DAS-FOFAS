import React, { useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useStudent } from '../context/StudentContext';
import AttendanceCalendar from '../components/Student/AttendanceCalendar';
import { useNavigate } from 'react-router-dom';
import { LogOut } from 'lucide-react';

const StudentArea = () => {
    const { user, signOut } = useAuth();
    const { students, setSelectedStudentId } = useStudent();
    const navigate = useNavigate();

    // Auto-select student profile linked to this user (if we had that link)
    // For now, since we might not have a direct link in context yet, 
    // we can rely on the fact that if they are an 'aluno', they might see everything or we need to filter?
    // Assumption: For this task, we just show the calendar. 
    // TODO: Ideally 'students' table has 'user_id' to match 'auth.uid'.

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
                        Área do Aluno
                    </h1>
                    <p style={{ color: 'var(--text-secondary)' }}>
                        Bem-vindo, {user?.email}
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
                <AttendanceCalendar fullPageMode={true} />
            </div>
        </div>
    );
};

export default StudentArea;
