import React from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { Home, PlusCircle, Activity, Users, RefreshCw, TrendingUp, Scale, LogOut } from 'lucide-react';
import clsx from 'clsx';
import { useStudent } from '../../context/StudentContext';
import styles from './Layout.module.css';

const Layout = ({ children }) => {
    const { selectedStudentId, setSelectedStudentId } = useStudent();
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
                    {selectedStudentId && (
                        <nav className={styles.nav} style={{ marginTop: '3rem' }}>
                            {/* Sliding Active Indicator */}
                            <div
                                className={styles.activeIndicator}
                                style={{
                                    top: (() => {
                                        const paths = ['/dashboard', '/workouts', '/mesocycle-builder', '/performance', '/weight'];
                                        const currentPath = location.pathname;
                                        // Simple approximation: check which path is active
                                        const index = paths.findIndex(p => currentPath === p || (p !== '/dashboard' && currentPath.startsWith(p)));
                                        return index !== -1 ? `${index * (50 + 24)}px` : '-100px'; // 50px height + 24px gap (1.5rem)
                                    })(),
                                    opacity: (() => { // Hide if no match
                                        const paths = ['/dashboard', '/workouts', '/mesocycle-builder', '/performance', '/weight'];
                                        const currentPath = location.pathname;
                                        return paths.some(p => currentPath === p || (p !== '/dashboard' && currentPath.startsWith(p))) ? 1 : 0;
                                    })()
                                }}
                            />

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

                            {/* Exit Button - Last Slot */}
                            <button
                                onClick={() => {
                                    setSelectedStudentId(null);
                                    navigate('/');
                                }}
                                className={styles.navLink}
                                style={{ border: 'none', cursor: 'pointer', color: 'var(--text-muted)', marginTop: 'auto' }} // auto margin pushes it if container is flex col h-full, but nav is likely just flex col.
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
                    <NavLink to="/performance" onClick={handleNavClick} className={({ isActive }) => clsx(styles.mobileNavItem, isActive && styles.active)}>
                        <TrendingUp size={20} />
                        <span>Performance</span>
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
