import React, { useState } from 'react';
import { useStudent } from '../context/StudentContext';
import { Users, Trash2, Edit2, Calendar, Heart, X, Check } from 'lucide-react';

const StudentsPage = () => {
    // Puxa os alunos reais do contexto
    const { students, deleteStudent, updateStudent } = useStudent();

    const [editingStudent, setEditingStudent] = useState(null);
    const [editName, setEditName] = useState('');
    const [editGender, setEditGender] = useState('female');
    const [editBirthDate, setEditBirthDate] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    const handleOpenEdit = (student) => {
        setEditingStudent(student);
        setEditName(student.name || student.full_name || '');
        setEditGender(student.gender || 'female');
        setEditBirthDate(student.birthDate || student.birth_date || '');
    };

    const handleSaveEdit = async (e) => {
        e.preventDefault();
        if (!editingStudent) return;
        setIsSaving(true);

        const ok = await updateStudent(editingStudent.id, {
            name: editName,
            gender: editGender,
            birthDate: editBirthDate,
            birth_date: editBirthDate
        });

        setIsSaving(false);
        if (ok) {
            setEditingStudent(null);
        } else {
            alert('Não foi possível salvar as alterações. Tente novamente.');
        }
    };

    const getAge = (dob) => {
        if (!dob) return null;
        const today = new Date();
        const birth = new Date(dob);
        if (isNaN(birth.getTime())) return null;
        let age = today.getFullYear() - birth.getFullYear();
        const m = today.getMonth() - birth.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
        return age >= 0 ? age : null;
    };

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
                                        {(student.name || student.full_name || student.email || 'A').charAt(0).toUpperCase()}
                                    </div>
                                    <div>
                                        <h4 style={{ margin: 0, fontSize: '1.1rem', color: 'var(--text-primary)' }}>
                                            {student.name || student.full_name || student.email || 'Aluna sem email'}
                                        </h4>
                                        <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                                            {student.email || 'Email não informado'}
                                        </p>
                                        <div style={{ display: 'flex', gap: '8px', fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                                            <span>
                                                {student.gender === 'male' ? 'Masculino' : 'Feminino'}
                                            </span>
                                            •
                                            <span>
                                                {getAge(student.birthDate || student.birth_date) !== null
                                                    ? `${getAge(student.birthDate || student.birth_date)} anos`
                                                    : 'Idade não def.'}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                    <button
                                        onClick={() => handleOpenEdit(student)}
                                        className="bg-transparent hover:bg-emerald-500/10 p-2 rounded-full transition-colors"
                                        style={{ border: 'none', cursor: 'pointer', color: 'var(--accent-primary)', background: 'transparent' }}
                                        title="Editar Dados (Sexo/Nascimento/Nome)"
                                    >
                                        <Edit2 size={18} />
                                    </button>
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

            {/* MODAL DE EDIÇÃO DE ATLETA */}
            {editingStudent && (
                <div style={{
                    position: 'fixed',
                    inset: 0,
                    backgroundColor: 'rgba(0, 0, 0, 0.75)',
                    backdropFilter: 'blur(4px)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 1000,
                    padding: '1rem'
                }}>
                    <div className="glass-panel animate-fade-in" style={{
                        maxWidth: '420px',
                        width: '100%',
                        padding: '1.75rem',
                        border: '1px solid var(--border-subtle)'
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                            <h3 style={{ margin: 0, fontSize: '1.2rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <Edit2 size={18} color="var(--accent-primary)" />
                                Editar Perfil do Atleta
                            </h3>
                            <button
                                type="button"
                                onClick={() => setEditingStudent(null)}
                                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleSaveEdit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <div style={{ textAlign: 'left' }}>
                                <label className="label">Nome</label>
                                <input
                                    type="text"
                                    className="input"
                                    value={editName}
                                    onChange={(e) => setEditName(e.target.value)}
                                    style={{ width: '100%' }}
                                    required
                                />
                            </div>

                            <div style={{ textAlign: 'left' }}>
                                <label className="label">Sexo Biológico</label>
                                <select
                                    className="input"
                                    value={editGender}
                                    onChange={(e) => setEditGender(e.target.value)}
                                    style={{ width: '100%' }}
                                    required
                                >
                                    <option value="female">Feminino</option>
                                    <option value="male">Masculino</option>
                                </select>
                            </div>

                            <div style={{ textAlign: 'left' }}>
                                <label className="label">Data de Nascimento</label>
                                <input
                                    type="date"
                                    className="input"
                                    value={editBirthDate}
                                    onChange={(e) => setEditBirthDate(e.target.value)}
                                    style={{ width: '100%' }}
                                    required
                                />
                                {editBirthDate && (
                                    <span style={{ fontSize: '0.78rem', color: 'var(--accent-primary)', marginTop: '4px', display: 'block' }}>
                                        Idade calculada: {getAge(editBirthDate)} anos
                                    </span>
                                )}
                            </div>

                            <div style={{ display: 'flex', gap: '10px', marginTop: '0.75rem' }}>
                                <button
                                    type="button"
                                    onClick={() => setEditingStudent(null)}
                                    className="btn btn-secondary"
                                    style={{ flex: 1, justifyContent: 'center' }}
                                    disabled={isSaving}
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    className="btn btn-primary"
                                    style={{ flex: 1, justifyContent: 'center' }}
                                    disabled={isSaving}
                                >
                                    {isSaving ? 'Salvando...' : 'Salvar Alterações'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default StudentsPage;