import React from 'react';
import { useStudent } from '../context/StudentContext';
import { Users } from 'lucide-react';

const StudentsPage = () => {
    // Puxa os alunos reais do contexto
    const { students } = useStudent();

    return (
        <div className="page-container animate-fade-in">
            <header style={{ marginBottom: '2rem' }}>
                <h1 style={{ fontSize: '1.8rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                    Meus Alunos
                </h1>
                <p style={{ color: 'var(--text-secondary)' }}>
                    Gerencie sua lista de atletas (Adicionados automaticamente via Cadastro)
                </p>
            </header>

            <div className="glass-panel" style={{ padding: '1.5rem', border: '1px solid var(--border-subtle)' }}>
                <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-primary)', marginBottom: '1rem' }}>
                    <Users size={20} color="var(--accent-primary)" />
                    Atletas Cadastrados
                </h3>

                {students && students.length > 0 ? (
                    <div style={{ display: 'grid', gap: '1rem' }}>
                        {students.map((student, index) => (
                            <div key={index} style={{ padding: '1rem', background: 'var(--bg-secondary)', borderRadius: '8px', border: '1px solid var(--border-subtle)', color: 'white' }}>
                                {student.name || student.full_name || 'Atleta sem nome'}
                            </div>
                        ))}
                    </div>
                ) : (
                    <p style={{ color: 'var(--text-secondary)' }}>
                        Nenhum atleta encontrado no banco de dados ainda.
                    </p>
                )}
            </div>
        </div>
    );
};

export default StudentsPage;