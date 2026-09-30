import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/api';
import { useAuth } from '../context/AuthContext';
import RecipeCard from '../components/RecipeCard';
import LoadingState from '../components/LoadingState';
import ErrorMessage from '../components/ErrorMessage';

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}

export default function Dashboard() {
  const { user } = useAuth();
  const [pantry, setPantry] = useState([]);
  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    if (pantry.length > 0) {
      loadRecipes();
    } else {
      setRecipes([]);
    }
  }, [pantry.length]);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      const pantryData = await api.getPantry();
      setPantry(pantryData.pantry || []);
    } catch (err) {
      setError(err.message || 'Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  };

  const loadRecipes = async () => {
    try {
      setLoading(true);
      const data = await api.matchRecipes();
      setRecipes(data.recipes || []);
    } catch (err) {
      setError(err.message || 'Failed to load recipes');
    } finally {
      setLoading(false);
    }
  };

  const fullyAvailable = recipes.filter((r) => r.availability?.group === 'FULLY_AVAILABLE');
  const partiallyAvailable = recipes.filter((r) => r.availability?.group === 'PARTIALLY_AVAILABLE');

  // Aggregate shopping suggestions
  const shoppingMap = {};
  partiallyAvailable.forEach((recipe) => {
    recipe.shopping_suggestions?.forEach((item) => {
      if (!shoppingMap[item.ingredient_id]) {
        shoppingMap[item.ingredient_id] = {
          ...item,
          totalGrams: 0,
          recipes: [],
        };
      }
      shoppingMap[item.ingredient_id].totalGrams += item.suggested_purchase_grams;
      shoppingMap[item.ingredient_id].recipes.push(recipe.name);
    });
  });
  const shoppingSuggestions = Object.values(shoppingMap).slice(0, 6);

  const totalPantryWeight = pantry.reduce((sum, p) => sum + parseFloat(p.quantity_grams || 0), 0);

  if (loading && pantry.length === 0) return <LoadingState />;
  if (error) return <ErrorMessage message={error} />;

  return (
    <div className="dashboard">
      {/* Hero Section */}
      <div className="dashboard-hero">
        <h1>{getGreeting()}{user?.name ? `, ${user.name}` : ''}</h1>
        <p className="hero-subtitle">Here's what you can make with what's in your pantry.</p>
      </div>

      {/* Summary Stats */}
      <div className="stats-grid">
        <div className="stat-card">
          <span className="stat-value">{pantry.length}</span>
          <span className="stat-label">Ingredients</span>
        </div>
        <div className="stat-card">
          <span className="stat-value">{fullyAvailable.length}</span>
          <span className="stat-label">Ready Recipes</span>
        </div>
        <div className="stat-card">
          <span className="stat-value">{partiallyAvailable.length}</span>
          <span className="stat-label">Almost Ready</span>
        </div>
        <div className="stat-card">
          <span className="stat-value">{Math.round(totalPantryWeight)}g</span>
          <span className="stat-label">Pantry Weight</span>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="quick-actions">
        <Link to="/pantry" className="btn btn-primary">+ Add Ingredient</Link>
        <Link to="/recipes" className="btn btn-outline">Find Recipes</Link>
        <Link to="/goals" className="btn btn-outline">Macro Goals</Link>
      </div>

      {/* Empty Pantry State */}
      {pantry.length === 0 && (
        <div className="empty-state">
          <h3>Your pantry is empty</h3>
          <p>Add a few ingredients and we'll find recipes you can make.</p>
          <Link to="/pantry" className="btn btn-primary">Go to Pantry</Link>
        </div>
      )}

      {/* Recipes You Can Make */}
      {pantry.length > 0 && fullyAvailable.length > 0 && (
        <div className="dashboard-section">
          <div className="section-header">
            <div>
              <h2>Recipes You Can Make</h2>
              <p className="section-subtitle">You have all the CORE ingredients needed.</p>
            </div>
            <span className="section-count">{fullyAvailable.length} recipes</span>
          </div>
          <div className="recipe-grid">
            {fullyAvailable.map((recipe) => (
              <RecipeCard key={recipe.recipe_id} recipe={recipe} />
            ))}
          </div>
        </div>
      )}

      {/* Recipes You Almost Have */}
      {pantry.length > 0 && partiallyAvailable.length > 0 && (
        <div className="dashboard-section">
          <div className="section-header">
            <div>
              <h2>Recipes You Almost Have</h2>
              <p className="section-subtitle">You're just a few ingredients away.</p>
            </div>
            <span className="section-count">{partiallyAvailable.length} recipes</span>
          </div>
          <div className="recipe-grid">
            {partiallyAvailable.map((recipe) => (
              <RecipeCard key={recipe.recipe_id} recipe={recipe} />
            ))}
          </div>
        </div>
      )}

      {/* Shopping Suggestions */}
      {shoppingSuggestions.length > 0 && (
        <div className="dashboard-section">
          <div className="section-header">
            <h2>Complete Your Pantry</h2>
            <span className="section-count">Buy next time</span>
          </div>
          <div className="shopping-suggestions">
            {shoppingSuggestions.map((item) => (
              <div key={item.ingredient_id} className="suggestion-item">
                <div>
                  <span className="suggestion-text">{item.ingredient}</span>
                  <span className="suggestion-grams">{item.totalGrams}g</span>
                </div>
                <span className={`priority-badge priority-${(item.priority || '').toLowerCase()}`}>
                  {item.priority || '—'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
