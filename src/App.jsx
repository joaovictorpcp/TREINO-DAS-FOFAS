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
  // const { selectedStudentId } = useStudent(); // Used by Layout internally now

  return (
    <Layout>

      <Routes>
        <Route path="/" element={<LoginPage />} />
        <Route path="/gateway" element={<ProtectedRoute><StudentGateway /></ProtectedRoute>} />
        <Route path="/register" element={<RegisterPage />} />

        {/* Protected Student Routes */}
        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/create" element={<ProtectedRoute><CreateWorkout /></ProtectedRoute>} />
        <Route path="/mesocycle-builder" element={<ProtectedRoute><MesocycleBuilder /></ProtectedRoute>} />
        <Route path="/workouts" element={<ProtectedRoute><WorkoutsPage /></ProtectedRoute>} />
        <Route path="/edit/:id" element={<ProtectedRoute><CreateWorkout /></ProtectedRoute>} />
        <Route path="/performance" element={<ProtectedRoute><PerformancePage /></ProtectedRoute>} />
        <Route path="/weight" element={<ProtectedRoute><WeightTrackerPage /></ProtectedRoute>} />
        <Route path="/calculator" element={<ProtectedRoute><CalculatorPage /></ProtectedRoute>} />

        {/* Protected Admin/Trainer Route */}
        <Route path="/students" element={<AdminRoute><StudentsPage /></AdminRoute>} />

        {/* 404 Catch-All */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Layout>
  );
};

export default App;
