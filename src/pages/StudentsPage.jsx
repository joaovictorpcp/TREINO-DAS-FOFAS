import React from 'react';
import { useStudent } from '../context/StudentContext';
import { Users, Trash2 } from 'lucide-react';

const StudentsPage = () => {
    // Puxa os alunos reais do contexto
    const { students, deleteStudent } = useStudent();

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
                <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-primary)', marginBottom: '1.5rem' }}>
                    <Users size={20} color="var(--accent-primary)" />
                    Atletas Cadastrados
                </h3>

                {students && students.length > 0 ? (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.5rem' }}>
                        {students.map((student) => (
                            <div key={student.id} className="glass-panel" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.25rem', border: '1px solid var(--border-subtle)', background: 'var(--bg-card)' }}>
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
                                        {(student.name || student.full_name || 'A').charAt(0).toUpperCase()}
                                    </div>
                                    <div>
                                        <h4 style={{ margin: 0, fontSize: '1.1rem', color: 'var(--text-primary)' }}>
                                            {student.name || student.full_name || 'Atleta sem nome'}
                                        </h4>
                                        <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                                            {student.email || 'Email não informado'}
                                        </p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => {
                                        if (window.confirm('Excluir este aluno? O painel do Supabase é a forma recomendada de excluir usuários.')) deleteStudent(student.id);
                                    }}
                                    className="bg-transparent hover:bg-red-500/10 p-2 rounded-full transition-colors"
                                    style={{ border: 'none', cursor: 'pointer', color: '#f87171', background: 'transparent' }}
                                    title="Excluir"
                                >
                                    <Trash2 size={18} />
                                </button>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div style={{ textAlign: 'center', padding: '3rem 0', color: 'var(--text-muted)' }}>
                        <Users size={48} style={{ opacity: 0.2, margin: '0 auto 1rem' }} />
                        <p>Nenhum atleta encontrado no banco de dados ainda.</p>
                        <p style={{ fontSize: '0.85rem', marginTop: '8px' }}>Peça para os alunos criarem conta no app.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default StudentsPage;