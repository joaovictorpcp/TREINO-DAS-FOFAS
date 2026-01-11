import React from 'react';
import { Calculator } from 'lucide-react';

const CalculatorPage = () => {
    return (
        <div className="page-container">
            <header className="page-header">
                <div>
                    <h1 className="page-title">Calculadora</h1>
                    <p className="section-subtitle">Ferramentas úteis para seu treino</p>
                </div>
            </header>

            <div className="main-layout">
                {/* Content will go here */}
                <h2 style={{ color: 'white' }}>Carregando Calculadora...</h2>
                <div className="glass-panel" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                    <div style={{
                        width: '64px', height: '64px',
                        background: 'rgba(255, 255, 255, 0.05)',
                        borderRadius: '50%',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        margin: '0 auto 1rem'
                    }}>
                        <Calculator size={32} color="var(--accent-primary)" />
                    </div>
                    <p>Funcionalidades de calculadora em breve...</p>
                </div>
            </div>
        </div>
    );
};

export default CalculatorPage;
