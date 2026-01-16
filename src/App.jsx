import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { WorkoutProvider } from './context/WorkoutContext';
import { StudentProvider } from './context/StudentContext';
import { ExerciseProvider } from './context/ExerciseContext';
import Layout from './components/Layout/Layout';
import Dashboard from './pages/Dashboard';
import CreateWorkout from './pages/CreateWorkout';
import WorkoutsPage from './pages/WorkoutsPage';
import StudentsPage from './pages/StudentsPage';
import StudentGateway from './pages/StudentGateway';
import MesocycleBuilder from './pages/MesocycleBuilder';
import PerformancePage from './pages/PerformancePage';
import WeightTrackerPage from './pages/WeightTrackerPage';
import CalculatorPage from './pages/CalculatorPage';
import './styles/index.css';
import { AuthProvider } from './context/AuthContext';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ProtectedRoute from './components/Auth/ProtectedRoute';
import AdminRoute from './components/Auth/AdminRoute';
import NotFoundPage from './pages/NotFoundPage';
import StudentArea from './pages/StudentArea';

function App() {
  return (
    <AuthProvider>
      <StudentProvider>
        <ExerciseProvider>
          <WorkoutProvider>
            <Router>
              <MainContent />
            </Router>
          </WorkoutProvider>
        </ExerciseProvider>
      </StudentProvider>
    </AuthProvider>
  );
}

// Separate component to access useStudent context
const MainContent = () => {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<LoginPage />} />
        <Route path="/gateway" element={<ProtectedRoute><StudentGateway /></ProtectedRoute>} />
        <Route path="/register" element={<RegisterPage />} />

        {/* ALUNO AREA */}
        <Route path="/area-do-aluno" element={<ProtectedRoute><StudentArea /></ProtectedRoute>} />

        {/* Protected COACH Routes */}
        <Route path="/dashboard" element={<AdminRoute><Dashboard /></AdminRoute>} />
        <Route path="/create" element={<AdminRoute><CreateWorkout /></AdminRoute>} />
        <Route path="/mesocycle-builder" element={<AdminRoute><MesocycleBuilder /></AdminRoute>} />
        <Route path="/students" element={<AdminRoute><StudentsPage /></AdminRoute>} />

        {/* SHARED Routes (Accessible by both, provided they have student context selected) */}
        <Route path="/workouts" element={<ProtectedRoute><WorkoutsPage /></ProtectedRoute>} />
        <Route path="/edit/:id" element={<ProtectedRoute><CreateWorkout /></ProtectedRoute>} />
        <Route path="/performance" element={<ProtectedRoute><PerformancePage /></ProtectedRoute>} />
        <Route path="/weight" element={<ProtectedRoute><WeightTrackerPage /></ProtectedRoute>} />
        <Route path="/calculator" element={<ProtectedRoute><CalculatorPage /></ProtectedRoute>} />

        {/* 404 Catch-All */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Layout>
  );
};

export default App;
