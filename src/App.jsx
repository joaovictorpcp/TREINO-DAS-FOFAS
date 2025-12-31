import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { WorkoutProvider } from './context/WorkoutContext';
import Layout from './components/Layout/Layout';
import Dashboard from './pages/Dashboard';
import CreateWorkout from './pages/CreateWorkout';
import WorkoutsPage from './pages/WorkoutsPage';
import './styles/index.css';

function App() {
  return (
    <WorkoutProvider>
      <Router>
        <Layout>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/create" element={<CreateWorkout />} />
            <Route path="/workouts" element={<WorkoutsPage />} />
            <Route path="/edit/:id" element={<CreateWorkout />} />
          </Routes>
        </Layout>
      </Router>
    </WorkoutProvider>
  );
}

export default App;
