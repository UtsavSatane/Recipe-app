import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '../api/api';
import LoadingState from '../components/LoadingState';
import ErrorMessage from '../components/ErrorMessage';
import IngredientRow from '../components/IngredientRow';
import NutritionCard from '../components/NutritionCard';
import AvailabilityBadge from '../components/AvailabilityBadge';

export default function RecipeDetails() {
  const { id } = useParams();
  const [recipe, setRecipe] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadRecipe();
  }, [id]);

  const loadRecipe = async () => {
    try {
      setLoading(true);
      const data = await api.getRecipe(id);
      setRecipe(data);
    } catch (err) {
      setError(err.message || 'Failed to load recipe');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <LoadingState />;
  if (error) return <ErrorMessage message={error} />;
  if (!recipe) return <ErrorMessage message="Recipe not found" />;

  return (
    <div className="recipe-details-page">
      <div className="recipe-header">
        <h1>{recipe.recipe.name}</h1>
        <AvailabilityBadge group={recipe.availability?.group} />
      </div>

      <div className="recipe-meta">
        <span>Servings: {recipe.recipe.servings}</span>
      </div>

      <div className="recipe-section">
        <h2>Instructions</h2>
        <p className="recipe-instructions">{recipe.recipe.instructions}</p>
      </div>

      <div className="recipe-section">
        <h2>Ingredients</h2>
        <div className="ingredients-list">
          {recipe.ingredients.map((ing) => (
            <IngredientRow key={ing.ingredient_id} ingredient={ing} />
          ))}
        </div>
      </div>

      <div className="recipe-section">
        <h2>Nutrition</h2>
        <div className="nutrition-section">
          <div>
            <h3>Total</h3>
            <NutritionCard nutrition={recipe.nutrition?.total} />
          </div>
          <div>
            <h3>Per Serving</h3>
            <NutritionCard nutrition={recipe.nutrition?.per_serving} />
          </div>
        </div>
      </div>

      <div className="recipe-section">
        <h2>Macro Fit Score</h2>
        <p className="macro-fit-score">{recipe.macro_fit_score}</p>
        <p className="macro-fit-label">out of 100</p>
      </div>

      {recipe.shopping_suggestions?.length > 0 && (
        <div className="recipe-section">
          <h2>Shopping Suggestions</h2>
          <div className="shopping-suggestions">
            {recipe.shopping_suggestions.map((item) => (
              <div key={item.ingredient_id} className="suggestion-item">
                <span className="suggestion-text">
                  Add {item.suggested_purchase_grams}g {item.ingredient} to your next grocery trip
                </span>
                <span className={`priority-badge priority-${item.priority.toLowerCase()}`}>
                  {item.priority}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
