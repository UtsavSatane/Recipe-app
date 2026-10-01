import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

export default function Navbar() {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="navbar">
      <div className="navbar-brand">
        <Link to="/">Recipe App</Link>
      </div>
      <div className="navbar-links">
        <Link to="/" className={location.pathname === '/' ? 'active' : ''}>Dashboard</Link>
        <Link to="/recipes" className={location.pathname.startsWith('/recipes') ? 'active' : ''}>Recipes</Link>
        <Link to="/pantry" className={location.pathname === '/pantry' ? 'active' : ''}>Pantry</Link>
        <Link to="/goals" className={location.pathname === '/goals' ? 'active' : ''}>Goals</Link>
      </div>
      <div className="navbar-user">
        <button
          className="theme-toggle"
          onClick={toggleTheme}
          aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
        >
          {theme === 'light' ? '🌙' : '☀️'}
        </button>
        <span>{user?.name}</span>
        <button onClick={handleLogout} className="btn btn-secondary">Logout</button>
      </div>
    </nav>
  );
}
