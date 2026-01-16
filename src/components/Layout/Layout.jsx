import React from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { Home, PlusCircle, Activity, Users, RefreshCw, TrendingUp, Scale, LogOut, Calculator } from 'lucide-react';

import clsx from 'clsx';
import { useStudent } from '../../context/StudentContext';
import { useAuth } from '../../context/AuthContext';
import styles from './Layout.module.css';

const Layout = ({ children }) => {
    const { selectedStudentId, setSelectedStudentId } = useStudent();
    const { session, role } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();

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
                        <img src="/logo-jv.png" alt="JOÃO VICTOR PERSONAL TRAINER" className={styles.logoImage} />
                        <div className={styles.logoText} style={{ display: 'flex', flexDirection: 'column', lineHeight: '1' }}>
                            <span style={{ fontFamily: '"Orbitron", sans-serif', fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '0.05em', textAlign: 'center' }}>
                                JOÃO<br />VICTOR
                            </span>
                            <span style={{ fontFamily: '"Orbitron", sans-serif', fontSize: '0.5rem', fontWeight: 600, color: 'var(--accent-primary)', letterSpacing: '0.15em', textTransform: 'uppercase', marginTop: '4px', textAlign: 'center', lineHeight: '1.2' }}>
                                PERSONAL<br />TRAINER
                            </span>
                        </div>
                    </NavLink>

                    {/* Desktop Navigation (Sidebar) */}
                    {session && selectedStudentId && (
                        <nav className={styles.nav} style={{ marginTop: '3rem' }}>
                            {role === 'professor' ? (
                                <>
                                    {/* --- PROFESSOR MENU --- */}
                                    <NavLink to="/dashboard" onClick={handleNavClick} className={({ isActive }) => clsx(styles.navLink, isActive && styles.active)}>
                                        <Home size={24} />
                                    </NavLink>
                                    <NavLink to="/workouts" onClick={handleNavClick} className={({ isActive }) => clsx(styles.navLink, isActive && styles.active)}>
                                        <Activity size={24} />
                                    </NavLink>
                                    <NavLink to="/mesocycle-builder" onClick={handleNavClick} className={({ isActive }) => clsx(styles.navLink, isActive && styles.active)}>
                                        <PlusCircle size={24} />
                                    </NavLink>
                                    <NavLink to="/performance" onClick={handleNavClick} className={({ isActive }) => clsx(styles.navLink, isActive && styles.active)}>
                                        <TrendingUp size={24} />
                                    </NavLink>
                                    <NavLink to="/weight" onClick={handleNavClick} className={({ isActive }) => clsx(styles.navLink, isActive && styles.active)}>
                                        <Scale size={24} />
                                    </NavLink>
                                    <NavLink to="/calculator" onClick={handleNavClick} className={({ isActive }) => clsx(styles.navLink, isActive && styles.active)}>
                                        <Calculator size={24} />
                                    </NavLink>
                                </>
                            ) : (
                                <>
                                    {/* --- ALUNO MENU --- */}
                                    {/* Início -> Area do Aluno */}
                                    <NavLink to="/area-do-aluno" onClick={handleNavClick} className={({ isActive }) => clsx(styles.navLink, isActive && styles.active)} title="Página Inicial">
                                        <Home size={24} />
                                    </NavLink>
                                    {/* Meus Treinos -> Workouts List */}
                                    <NavLink to="/workouts" onClick={handleNavClick} className={({ isActive }) => clsx(styles.navLink, isActive && styles.active)} title="Meus Treinos">
                                        <Activity size={24} />
                                    </NavLink>
                                    {/* Performance */}
                                    <NavLink to="/performance" onClick={handleNavClick} className={({ isActive }) => clsx(styles.navLink, isActive && styles.active)} title="Performance">
                                        <TrendingUp size={24} />
                                    </NavLink>
                                </>
                            )}

                            {/* Exit Button - Last Slot */}
                            <button
                                onClick={() => {
                                    setSelectedStudentId(null);
                                    navigate('/gateway');
                                }}
                                className={styles.navLink}
                                style={{ border: 'none', cursor: 'pointer', color: 'var(--text-muted)', marginTop: 'auto' }}
                                title="Sair / Trocar Aluno"
                            >
                                <LogOut size={24} />
                            </button>
                        </nav>
                    )}
                </div>
            </aside>

            <main className={styles.main}>
                {children}
            </main>

            {/* Mobile Bottom Nav */}
            {session && selectedStudentId && (
                <nav className={styles.mobileNav}>
                    {role === 'professor' ? (
                        <>
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
                            <NavLink to="/performance" onClick={handleNavClick} className={({ isActive }) => clsx(styles.mobileNavItem, isActive && styles.active)}>
                                <TrendingUp size={20} />
                                <span>Perf.</span>
                            </NavLink>
                            <NavLink to="/weight" onClick={handleNavClick} className={({ isActive }) => clsx(styles.mobileNavItem, isActive && styles.active)}>
                                <Scale size={20} />
                                <span>Peso</span>
                            </NavLink>
                        </>
                    ) : (
                        <>
                            <NavLink to="/area-do-aluno" onClick={handleNavClick} className={({ isActive }) => clsx(styles.mobileNavItem, isActive && styles.active)}>
                                <Home size={20} />
                                <span>Início</span>
                            </NavLink>
                            <NavLink to="/workouts" onClick={handleNavClick} className={({ isActive }) => clsx(styles.mobileNavItem, isActive && styles.active)}>
                                <Activity size={20} />
                                <span>Treinos</span>
                            </NavLink>
                            <NavLink to="/performance" onClick={handleNavClick} className={({ isActive }) => clsx(styles.mobileNavItem, isActive && styles.active)}>
                                <TrendingUp size={20} />
                                <span>Perf.</span>
                            </NavLink>
                            <button
                                onClick={() => {
                                    setSelectedStudentId(null);
                                    navigate('/gateway');
                                }}
                                className={styles.mobileNavItem}
                                style={{ background: 'none', border: 'none', color: 'var(--text-secondary)' }}
                            >
                                <LogOut size={20} />
                                <span>Sair</span>
                            </button>
                        </>
                    )}
                </nav>
            )}
        </div>
    );
};

export default Layout;
