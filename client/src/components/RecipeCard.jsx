import React from 'react';
import { Link } from 'react-router-dom';
import AvailabilityBadge from './AvailabilityBadge';
import NutritionCard from './NutritionCard';

export default function RecipeCard({ recipe }) {
  const isAvailable = recipe.availability?.group === 'FULLY_AVAILABLE';
  const missingIngredients = recipe.ingredients?.filter((ing) => ing.status !== 'AVAILABLE') || [];
  const missingCore = missingIngredients.filter((ing) => ing.priority === 'CORE');
  const missingOther = missingIngredients.filter((ing) => ing.priority !== 'CORE');

  return (
    <div className="recipe-card">
      <div className="recipe-card-header">
        <h3>{recipe.name}</h3>
        <AvailabilityBadge group={recipe.availability?.group} />
      </div>
      <div className="recipe-card-body">
        <p className="servings">Servings: {recipe.servings}</p>
        <NutritionCard nutrition={recipe.nutrition} />

        {isAvailable && (
          <p className="ready-text">Ready to Cook</p>
        )}

        {!isAvailable && missingCore.length > 0 && (
          <div className="missing-section missing-core">
            <h4>Missing CORE:</h4>
            <ul>
              {missingCore.map((ing) => (
                <li key={ing.ingredient}>
                  ✗ {ing.ingredient} — {ing.missing_grams}g
                </li>
              ))}
            </ul>
          </div>
        )}

        {!isAvailable && missingOther.length > 0 && (
          <div className="missing-section">
            <h4>Also missing:</h4>
            <ul>
              {missingOther.slice(0, 2).map((ing) => (
                <li key={ing.ingredient}>
                  {ing.status === 'MISSING' ? '✗' : '⚠'} {ing.ingredient} — {ing.missing_grams}g
                </li>
              ))}
              {missingOther.length > 2 && <li>+{missingOther.length - 2} more</li>}
            </ul>
          </div>
        )}
      </div>
      <div className="recipe-card-footer">
        <Link to={`/recipes/${recipe.recipe_id || recipe.id}`} className="btn btn-primary" style={{ width: '100%' }}>
          View Recipe
        </Link>
      </div>
    </div>
  );
}
