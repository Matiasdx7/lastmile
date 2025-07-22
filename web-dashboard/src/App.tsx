import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout/Layout';
import Dashboard from './pages/Dashboard/Dashboard';
import Orders from './pages/Orders/Orders';
import Vehicles from './pages/Vehicles/Vehicles';
import RoutesPage from './pages/Routes/Routes';
import Loads from './pages/Loads/Loads';
import Dispatch from './pages/Dispatch/Dispatch';
import BPM from './pages/BPM/BPM';
import Login from './pages/Auth/Login';
import { AuthProvider, useAuth } from './context/AuthContext';

// Protected route component - bypassed for development
const ProtectedRoute: React.FC<{ element: React.ReactElement }> = ({ element }) => {
  // For development, we're bypassing authentication checks
  return element;
};

function AppRoutes() {
  return (
    <Routes>
      {/* Redirect login page to dashboard for development */}
      <Route path="/login" element={<Navigate to="/" />} />
      
      {/* All routes are accessible without authentication */}
      <Route path="/" element={<Layout><Dashboard /></Layout>} />
      <Route path="/orders" element={<Layout><Orders /></Layout>} />
      <Route path="/loads" element={<Layout><Loads /></Layout>} />
      <Route path="/vehicles" element={<Layout><Vehicles /></Layout>} />
      <Route path="/routes" element={<Layout><RoutesPage /></Layout>} />
      <Route path="/routes/:routeId" element={<Layout><RoutesPage /></Layout>} />
      <Route path="/dispatch" element={<Layout><Dispatch /></Layout>} />
      <Route path="/bpm" element={<Layout><BPM /></Layout>} />
    </Routes>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  );
}

export default App;