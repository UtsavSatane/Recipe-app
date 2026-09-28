import React, { useState, useEffect } from 'react';
import { api } from '../api/api';
import RecipeCard from '../components/RecipeCard';
import LoadingState from '../components/LoadingState';
import ErrorMessage from '../components/ErrorMessage';

export default function Dashboard() {
  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadRecipes();
  }, []);

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

  if (loading) return <LoadingState />;
  if (error) return <ErrorMessage message={error} />;

  const fullyAvailable = recipes.filter((r) => r.availability?.group === 'FULLY_AVAILABLE');
  const partiallyAvailable = recipes.filter((r) => r.availability?.group === 'PARTIALLY_AVAILABLE');

  return (
    <div className="dashboard">
      <h1>Dashboard</h1>
      <p className="subtitle">Your personalized recipe recommendations</p>

      {fullyAvailable.length > 0 && (
        <section>
          <h2>Fully Available Recipes</h2>
          <div className="recipe-grid">
            {fullyAvailable.map((recipe) => (
              <RecipeCard key={recipe.recipe_id} recipe={recipe} />
            ))}
          </div>
        </section>
      )}

      {partiallyAvailable.length > 0 && (
        <section>
          <h2>Partially Available Recipes</h2>
          <div className="recipe-grid">
            {partiallyAvailable.map((recipe) => (
              <RecipeCard key={recipe.recipe_id} recipe={recipe} />
            ))}
          </div>
        </section>
      )}

      {recipes.length === 0 && (
        <p>No recipes found. Add ingredients to your pantry to get recommendations.</p>
      )}
    </div>
  );
}
