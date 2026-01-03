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
            <header className={styles.header}>
                <div className={styles.logoAndNav} style={{ position: 'relative', justifyContent: 'space-between' }}>
                    {/* Left: Logo */}
                    <NavLink to="/" className={styles.logo} style={{ textDecoration: 'none' }}>
                        <Activity className={styles.logoIcon} />
                        <span>FitScience</span>
                    </NavLink>

                    {/* Center: Main Nav - Absolute Center for perfect alignment */}
                    {/* Center: Main Nav - Absolute Center for perfect alignment */}
                    <nav className={styles.nav} style={{
                        position: 'absolute',
                        left: '50%',
                        transform: 'translateX(-50%)'
                    }}>
                        <NavLink
                            to="/dashboard"
                            onClick={handleNavClick}
                            className={({ isActive }) => clsx(styles.navLink, isActive && styles.active)}
                        >
                            Painel
                        </NavLink>
                        <NavLink
                            to="/workouts"
                            onClick={handleNavClick}
                            className={({ isActive }) => clsx(styles.navLink, isActive && styles.active)}
                        >
                            Treinos
                        </NavLink>
                        <NavLink
                            to="/mesocycle-builder"
                            onClick={handleNavClick}
                            className={({ isActive }) => clsx(styles.navLink, isActive && styles.active)}
                        >
                            + Treinos
                        </NavLink>
                        <NavLink
                            to="/performance"
                            onClick={handleNavClick}
                            className={({ isActive }) => clsx(styles.navLink, isActive && styles.active)}
                        >
                            Performance
                        </NavLink>
                        <NavLink
                            to="/weight"
                            onClick={handleNavClick}
                            className={({ isActive }) => clsx(styles.navLink, isActive && styles.active)}
                        >
                            Peso
                        </NavLink>
                    </nav>

                    {/* Right: Alunos Link, Profile & Change Button */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginLeft: 'auto' }}>
                        {/* Selected Student Name - Click to change */}
                        {selectedStudentId && (
                            <NavLink
                                to="/"
                                title="Trocar de Aluno"
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '12px',
                                    textDecoration: 'none',
                                    cursor: 'pointer'
                                }}
                            >
                                <div style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                    background: '#F1F5F9',
                                    padding: '6px 12px',
                                    borderRadius: '20px',
                                    border: '1px solid transparent',
                                    transition: 'all 0.2s'
                                }}
                                    onMouseEnter={e => e.currentTarget.style.borderColor = '#cbd5e1'}
                                    onMouseLeave={e => e.currentTarget.style.borderColor = 'transparent'}
                                >
                                    <span style={{ fontSize: '0.9rem', fontWeight: 600, color: '#334155' }}>
                                        {students.find(s => s.id === selectedStudentId)?.name || 'Aluno'}
                                    </span>
                                    <RefreshCw size={14} color="#94a3b8" />
                                </div>
                            </NavLink>
                        )}
                    </div>
                </div>
            </header>

            <main className={styles.main}>
                {children}
            </main>

            <nav className={styles.mobileNav}>
                <NavLink
                    to="/"
                    className={({ isActive }) => clsx(styles.mobileNavItem, isActive && styles.active)}
                >
                    <Home size={24} />
                    <span>Início</span>
                </NavLink>
                <NavLink
                    to="/workouts"
                    onClick={handleNavClick}
                    className={({ isActive }) => clsx(styles.mobileNavItem, isActive && styles.active)}
                >
                    <Activity size={24} />
                    <span>Treinos</span>
                </NavLink>
                <NavLink
                    to="/mesocycle-builder"
                    onClick={handleNavClick}
                    className={({ isActive }) => clsx(styles.mobileNavItem, isActive && styles.active)}
                >
                    <PlusCircle size={24} />
                    <span>Criar</span>
                </NavLink>
                <NavLink
                    to="/students"
                    onClick={handleNavClick}
                    className={({ isActive }) => clsx(styles.mobileNavItem, isActive && styles.active)}
                >
                    <Users size={24} />
                    <span>Alunos</span>
                </NavLink>
                <NavLink
                    to="/performance"
                    onClick={handleNavClick}
                    className={({ isActive }) => clsx(styles.mobileNavItem, isActive && styles.active)}
                >
                    <TrendingUp size={24} />
                    <span>Perf.</span>
                </NavLink>
                <NavLink
                    to="/weight"
                    onClick={handleNavClick}
                    className={({ isActive }) => clsx(styles.mobileNavItem, isActive && styles.active)}
                >
                    <Scale size={24} />
                    <span>Peso</span>
                </NavLink>
            </nav>
        </div>
    );
};

export default Layout;
