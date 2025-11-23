import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from './contexts/ThemeContext';
import LandingPage from './pages/LandingPage';
import Trap from './pages/Trap';
import Dashboard from './pages/Dashboard';
import FakeDashboard from './pages/FakeDashboard';
import LoadingPage from './pages/LoadingPage';
import IncidentReplay from './pages/IncidentReplay';

function App() {
  return (
    <ThemeProvider>
      <Router>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<Trap />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/fake-dashboard" element={<FakeDashboard />} />
          <Route path="/loading" element={<LoadingPage />} />
          <Route path="/replay/:eventId" element={<IncidentReplay />} />
        </Routes>
      </Router>
    </ThemeProvider>
  );
}

export default App;
