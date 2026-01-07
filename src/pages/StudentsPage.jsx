import React, { useState } from 'react';
import { useStudent } from '../context/StudentContext';
import { UserPlus, Trash2, Users } from 'lucide-react';

const StudentsPage = () => {
    const { students, addStudent, deleteStudent } = useStudent();
    const [name, setName] = useState('');
    const [goal, setGoal] = useState('');
    const [gender, setGender] = useState('male');
    const [birthDate, setBirthDate] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        if (name.trim()) {
            addStudent(name, goal, { gender, birthDate });
            setName('');
            setGoal('');
            setGender('male');
            setBirthDate('');
        }
    };

    return (
        <div className="page-container animate-fade-in">
            <header style={{ marginBottom: '2rem' }}>
                <h1 style={{ fontSize: '1.8rem', fontWeight: 700, color: 'var(--text-primary)' }}>Meus Alunos</h1>
                <p style={{ color: 'var(--text-secondary)' }}>Gerencie sua lista de atletas</p>
            </header>

            <div className="glass-panel" style={{ marginBottom: '2rem', padding: '1.5rem', border: '1px solid var(--border-subtle)' }}>
                <h3 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-primary)' }}>
                    <UserPlus size={20} color="var(--accent-primary)" />
                    Novo Aluno
                </h3>
                <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', alignItems: 'end' }}>
                    <div>
                        <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Nome</label>
                        <input
                            type="text"
                            className="input"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Ex: João Silva"
                            required
                            style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)', border: '1px solid var(--border-subtle)' }}
                        />
                    </div>
                    <div>
                        <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Data Nascimento</label>
                        <input
                            type="date"
                            className="input"
                            value={birthDate}
                            onChange={(e) => setBirthDate(e.target.value)}
                            style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)', border: '1px solid var(--border-subtle)' }}
                        />
                    </div>
                    <div>
                        <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Sexo</label>
                        <select
                            className="input"
                            value={gender}
                            onChange={(e) => setGender(e.target.value)}
                            style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)', border: '1px solid var(--border-subtle)' }}
                        >
                            <option value="male">Masculino</option>
                            <option value="female">Feminino</option>
                        </select>
                    </div>
                    <div>
                        <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Objetivo</label>
                        <input
                            type="text"
                            className="input"
                            value={goal}
                            onChange={(e) => setGoal(e.target.value)}
                            placeholder="Ex: Hipertrofia"
                            style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)', border: '1px solid var(--border-subtle)' }}
                        />
                    </div>
                    <button type="submit" className="btn-primary" style={{ height: '42px', justifySelf: 'start', minWidth: '120px' }}>
                        Cadastrar
                    </button>
                </form>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.5rem' }}>
                {students.map(student => (
                    <div key={student.id} className="glass-panel" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '1px solid var(--border-subtle)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <div style={{
                                width: '40px', height: '40px',
                                borderRadius: '50%',
                                background: 'rgba(74, 222, 128, 0.1)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                color: 'var(--accent-primary)',
                                fontWeight: 'bold',
                                border: '1px solid rgba(74, 222, 128, 0.2)'
                            }}>
                                {student.name.charAt(0).toUpperCase()}
                            </div>
                            <div>
                                <h4 style={{ margin: 0, fontSize: '1.1rem', color: 'var(--text-primary)' }}>{student.name}</h4>
                                <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{student.goal || 'Sem objetivo'}</p>
                            </div>
                        </div>
                        <button
                            onClick={() => {
                                if (window.confirm('Excluir este aluno?')) deleteStudent(student.id);
                            }}
                            className="bg-transparent hover:bg-red-500/10 p-2 rounded-full transition-colors"
                            style={{ border: 'none', cursor: 'pointer', color: '#f87171' }}
                            title="Excluir"
                        >
                            <Trash2 size={18} />
                        </button>
                    </div>
                ))}
            </div>

            {students.length === 0 && (
                <div style={{ textAlign: 'center', marginTop: '3rem', color: 'var(--text-muted)' }}>
                    <Users size={48} style={{ opacity: 0.2, marginBottom: '1rem' }} />
                    <p>Nenhum aluno cadastrado.</p>
                </div>
            )}
        </div>
    );
};

export default StudentsPage;
