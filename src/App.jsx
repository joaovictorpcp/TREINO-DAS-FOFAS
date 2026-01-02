import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { WorkoutProvider } from './context/WorkoutContext';
import { StudentProvider } from './context/StudentContext';
import Layout from './components/Layout/Layout';
import Dashboard from './pages/Dashboard';
import CreateWorkout from './pages/CreateWorkout';
import WorkoutsPage from './pages/WorkoutsPage';
import StudentsPage from './pages/StudentsPage';
import StudentGateway from './pages/StudentGateway';
import MesocycleBuilder from './pages/MesocycleBuilder';
import { useStudent } from './context/StudentContext';
import './styles/index.css';

function App() {
  return (
    <StudentProvider>
      <WorkoutProvider>
        <Router>
          <MainContent />
        </Router>
      </WorkoutProvider>
    </StudentProvider>
  );
}

// Separate component to access useStudent context
const MainContent = () => {
  const { selectedStudentId } = useStudent();

  // if (!selectedStudentId) {
  //   return <StudentGateway />;
  // }

  return (
    <Layout>
      <Routes>
        <Route path="/" element={<StudentGateway />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/create" element={<CreateWorkout />} />
        <Route path="/new-program" element={<MesocycleBuilder />} />
        <Route path="/workouts" element={<WorkoutsPage />} />
        <Route path="/edit/:id" element={<CreateWorkout />} />
        <Route path="/students" element={<StudentsPage />} />
      </Routes>
    </Layout>
  );
};

export default App;
