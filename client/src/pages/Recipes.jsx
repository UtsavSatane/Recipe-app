import React, { useState, useEffect } from 'react';
import { api } from '../api/api';
import LoadingState from '../components/LoadingState';
import ErrorMessage from '../components/ErrorMessage';
import NutritionCard from '../components/NutritionCard';

export default function Recipes() {
  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadRecipes();
  }, []);

  const loadRecipes = async () => {
    try {
      setLoading(true);
      const data = await api.getRecipes();
      setRecipes(data.recipes || []);
    } catch (err) {
      setError(err.message || 'Failed to load recipes');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <LoadingState />;
  if (error) return <ErrorMessage message={error} />;

  return (
    <div className="recipes-page">
      <h1>All Recipes</h1>
      <div className="recipe-grid">
        {recipes.map((recipe) => (
          <div key={recipe.recipe_id} className="recipe-card">
            <div className="recipe-card-header">
              <h3>{recipe.name}</h3>
            </div>
            <div className="recipe-card-body">
              <p className="servings">Servings: {recipe.servings}</p>
              <NutritionCard nutrition={recipe.nutrition} />
            </div>
            <div className="recipe-card-footer">
              <a href={`/recipes/${recipe.recipe_id}`} className="btn btn-primary">
                View Details
              </a>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
