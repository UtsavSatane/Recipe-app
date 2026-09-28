import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Pantry from './pages/Pantry';
import Recipes from './pages/Recipes';
import RecipeDetails from './pages/RecipeDetails';
import MacroGoals from './pages/MacroGoals';

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="loading-container">Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

function PublicRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="loading-container">Loading...</div>;
  }

  if (user) {
    return <Navigate to="/" replace />;
  }

  return children;
}

export default function App() {
  const { user } = useAuth();

  return (
    <div className="app">
      {user && <Navbar />}
      <main className="main-content">
        <Routes>
          <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
          <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />
          <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/pantry" element={<ProtectedRoute><Pantry /></ProtectedRoute>} />
          <Route path="/recipes" element={<ProtectedRoute><Recipes /></ProtectedRoute>} />
          <Route path="/recipes/:id" element={<ProtectedRoute><RecipeDetails /></ProtectedRoute>} />
          <Route path="/goals" element={<ProtectedRoute><MacroGoals /></ProtectedRoute>} />
        </Routes>
      </main>
    </div>
  );
}
