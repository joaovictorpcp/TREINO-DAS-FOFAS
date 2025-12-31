import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, PlusCircle, Activity, BarChart2 } from 'lucide-react';
import clsx from 'clsx';
import styles from './Layout.module.css';

const Layout = ({ children }) => {
    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <div className={styles.logoAndNav}>
                    <div className={styles.logo}>
                        <Activity className={styles.logoIcon} />
                        <span>FitScience</span>
                    </div>
                    <nav className={styles.nav}>
                        <NavLink
                            to="/"
                            className={({ isActive }) => clsx(styles.navLink, isActive && styles.active)}
                        >
                            Dashboard
                        </NavLink>
                        <NavLink
                            to="/workouts"
                            className={({ isActive }) => clsx(styles.navLink, isActive && styles.active)}
                        >
                            Treinos
                        </NavLink>
                        <NavLink
                            to="/create"
                            className={({ isActive }) => clsx(styles.navLink, isActive && styles.active)}
                        >
                            + Training
                        </NavLink>
                    </nav>
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
                    <span>Overview</span>
                </NavLink>
                <NavLink
                    to="/create"
                    className={({ isActive }) => clsx(styles.mobileNavItem, isActive && styles.active)}
                >
                    <PlusCircle size={24} />
                    <span>New Log</span>
                </NavLink>
            </nav>
        </div>
    );
};

export default Layout;
