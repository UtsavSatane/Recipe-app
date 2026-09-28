import React from 'react';
import { Link } from 'react-router-dom';
import AvailabilityBadge from './AvailabilityBadge';
import NutritionCard from './NutritionCard';

export default function RecipeCard({ recipe }) {
  return (
    <div className="recipe-card">
      <div className="recipe-card-header">
        <h3>{recipe.name}</h3>
        <AvailabilityBadge group={recipe.availability?.group} />
      </div>
      <div className="recipe-card-body">
        <p className="servings">Servings: {recipe.servings}</p>
        <NutritionCard nutrition={recipe.nutrition} />
        {recipe.availability?.group === 'PARTIALLY_AVAILABLE' && recipe.ingredients && (
          <div className="missing-ingredients">
            <h4>Missing/Insufficient:</h4>
            <ul>
              {recipe.ingredients
                .filter((ing) => ing.status !== 'AVAILABLE')
                .map((ing) => (
                  <li key={ing.ingredient}>
                    {ing.status === 'MISSING' ? '✗' : '⚠'} {ing.ingredient} — {ing.missing_grams}g
                  </li>
                ))}
            </ul>
          </div>
        )}
      </div>
      <div className="recipe-card-footer">
        <Link to={`/recipes/${recipe.recipe_id || recipe.id}`} className="btn btn-primary">
          View Details
        </Link>
      </div>
    </div>
  );
}
