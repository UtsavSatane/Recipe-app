import React, { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext(null);

function getInitialTheme() {
  // Check localStorage first
  const saved = localStorage.getItem('theme');
  if (saved === 'light' || saved === 'dark') {
    return saved;
  }

  // Detect system preference
  if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
    return 'dark';
  }

  return 'light';
}

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(getInitialTheme);

  useEffect(() => {
    // Apply theme to document root
    document.documentElement.setAttribute('data-theme', theme);

    // Save to localStorage
    localStorage.setItem('theme', theme);
  }, [theme]);

  useEffect(() => {
    // Listen for system theme changes
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e) => {
      // Only auto-switch if user hasn't manually set a preference
      const saved = localStorage.getItem('theme');
      if (!saved) {
        setTheme(e.matches ? 'dark' : 'light');
      }
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
