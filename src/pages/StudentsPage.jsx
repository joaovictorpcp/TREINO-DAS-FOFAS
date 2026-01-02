import React, { useState } from 'react';
import { useStudent } from '../context/StudentContext';
import { UserPlus, Trash2, Users } from 'lucide-react';

const StudentsPage = () => {
    const { students, addStudent, deleteStudent } = useStudent();
    const [name, setName] = useState('');
    const [goal, setGoal] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        if (name.trim()) {
            addStudent(name, goal);
            setName('');
            setGoal('');
        }
    };

    return (
        <div className="page-container animate-fade-in">
            <header style={{ marginBottom: '2rem' }}>
                <h1 style={{ fontSize: '1.8rem', fontWeight: 700, color: 'var(--text-primary)' }}>Meus Alunos</h1>
                <p style={{ color: 'var(--text-secondary)' }}>Gerencie sua lista de atletas</p>
            </header>

            <div className="glass-panel" style={{ marginBottom: '2rem' }}>
                <h3 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <UserPlus size={20} color="var(--accent-primary)" />
                    Novo Aluno
                </h3>
                <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: '1rem', alignItems: 'end' }}>
                    <div>
                        <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.9rem' }}>Nome</label>
                        <input
                            type="text"
                            className="input"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Ex: João Silva"
                            required
                        />
                    </div>
                    <div>
                        <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.9rem' }}>Objetivo</label>
                        <input
                            type="text"
                            className="input"
                            value={goal}
                            onChange={(e) => setGoal(e.target.value)}
                            placeholder="Ex: Hipertrofia"
                        />
                    </div>
                    <button type="submit" className="btn btn-primary" style={{ height: '42px' }}>
                        Cadastrar
                    </button>
                </form>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.5rem' }}>
                {students.map(student => (
                    <div key={student.id} className="glass-panel" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <div style={{
                                width: '40px', height: '40px',
                                borderRadius: '50%',
                                background: 'var(--accent-header)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                color: 'var(--accent-primary)',
                                fontWeight: 'bold'
                            }}>
                                {student.name.charAt(0).toUpperCase()}
                            </div>
                            <div>
                                <h4 style={{ margin: 0, fontSize: '1.1rem' }}>{student.name}</h4>
                                <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{student.goal || 'Sem objetivo'}</p>
                            </div>
                        </div>
                        <button
                            onClick={() => {
                                if (window.confirm('Excluir este aluno?')) deleteStudent(student.id);
                            }}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', opacity: 0.7 }}
                        >
                            <Trash2 size={18} />
                        </button>
                    </div>
                ))}
            </div>

            {students.length === 0 && (
                <div style={{ textAlign: 'center', marginTop: '3rem', color: '#94a3b8' }}>
                    <Users size={48} style={{ opacity: 0.2, marginBottom: '1rem' }} />
                    <p>Nenhum aluno cadastrado.</p>
                </div>
            )}
        </div>
    );
};

export default StudentsPage;
