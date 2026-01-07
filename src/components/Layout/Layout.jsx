import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, PlusCircle, Activity, Users, RefreshCw, TrendingUp, Scale } from 'lucide-react';
import clsx from 'clsx';
import { useStudent } from '../../context/StudentContext';
import styles from './Layout.module.css';

const Layout = ({ children }) => {
    const { students, selectedStudentId, setSelectedStudentId } = useStudent();

    const handleNavClick = (e) => {
        if (!selectedStudentId) {
            e.preventDefault();
            alert("Por favor, selecione uma aluna na página inicial primeiro.");
        }
    };

    return (
        <div className={styles.container}>
            {/* Sidebar / Header */}
            <aside className={styles.header}>
                <div className={styles.logoAndNav}>
                    {/* Logo */}
                    <NavLink to="/" className={styles.logo}>
                        <Activity className={styles.logoIcon} size={28} />
                        <div className={styles.logoText} style={{ display: 'flex', flexDirection: 'column', lineHeight: '1' }}>
                            <span style={{ fontFamily: '"Orbitron", sans-serif', fontSize: '1.4rem', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '0.05em' }}>
                                JOÃO VICTOR
                            </span>
                            <span style={{ fontFamily: '"Orbitron", sans-serif', fontSize: '0.65em', fontWeight: 600, color: 'var(--accent-primary)', letterSpacing: '0.15em', textTransform: 'uppercase', marginTop: '2px' }}>
                                Personal Trainer
                            </span>
                        </div>
                    </NavLink>

                    {/* Desktop Navigation (Sidebar) */}
                    {selectedStudentId && (
                        <nav className={styles.nav}>
                            <NavLink to="/dashboard" onClick={handleNavClick} className={({ isActive }) => clsx(styles.navLink, isActive && styles.active)}>
                                <Home size={24} /> <span>Painel</span>
                            </NavLink>
                            <NavLink to="/workouts" onClick={handleNavClick} className={({ isActive }) => clsx(styles.navLink, isActive && styles.active)}>
                                <Activity size={24} /> <span>Treinos</span>
                            </NavLink>
                            <NavLink to="/mesocycle-builder" onClick={handleNavClick} className={({ isActive }) => clsx(styles.navLink, isActive && styles.active)}>
                                <PlusCircle size={24} /> <span>Criar</span>
                            </NavLink>
                            <NavLink to="/performance" onClick={handleNavClick} className={({ isActive }) => clsx(styles.navLink, isActive && styles.active)}>
                                <TrendingUp size={24} /> <span>Performance</span>
                            </NavLink>
                            <NavLink to="/weight" onClick={handleNavClick} className={({ isActive }) => clsx(styles.navLink, isActive && styles.active)}>
                                <Scale size={24} /> <span>Medidas</span>
                            </NavLink>
                        </nav>
                    )}

                    {/* Student Profile (Bottom of Sidebar on Desk, Right of Header on Mobile) */}
                    {selectedStudentId && (
                        <div className={styles.studentProfile}>
                            <NavLink to="/" title="Trocar de Aluno" style={{ textDecoration: 'none', width: '100%', display: 'flex', justifyContent: 'center' }}>
                                <div className={styles.studentBadge}>
                                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--accent-primary)', boxShadow: '0 0 10px var(--accent-primary)' }}></div>
                                    <span className={styles.studentName}>
                                        {students.find(s => s.id === selectedStudentId)?.name || 'Aluno'}
                                    </span>
                                    <RefreshCw size={14} style={{ marginLeft: 'auto', color: '#52525B' }} />
                                </div>
                            </NavLink>
                        </div>
                    )}
                </div>
            </aside>

            <main className={styles.main}>
                {children}
            </main>

            {/* Mobile Bottom Nav */}
            {selectedStudentId && (
                <nav className={styles.mobileNav}>
                    <NavLink to="/dashboard" onClick={handleNavClick} className={({ isActive }) => clsx(styles.mobileNavItem, isActive && styles.active)}>
                        <Home size={20} />
                        <span>Início</span>
                    </NavLink>
                    <NavLink to="/workouts" onClick={handleNavClick} className={({ isActive }) => clsx(styles.mobileNavItem, isActive && styles.active)}>
                        <Activity size={20} />
                        <span>Treinos</span>
                    </NavLink>
                    <NavLink to="/mesocycle-builder" onClick={handleNavClick} className={({ isActive }) => clsx(styles.mobileNavItem, isActive && styles.active)}>
                        <PlusCircle size={20} />
                        <span>Criar</span>
                    </NavLink>
                    <NavLink to="/students" onClick={handleNavClick} className={({ isActive }) => clsx(styles.mobileNavItem, isActive && styles.active)}>
                        <Users size={20} />
                        <span>Alunos</span>
                    </NavLink>
                    <NavLink to="/weight" onClick={handleNavClick} className={({ isActive }) => clsx(styles.mobileNavItem, isActive && styles.active)}>
                        <Scale size={20} />
                        <span>Peso</span>
                    </NavLink>
                </nav>
            )}
        </div>
    );
};

export default Layout;
