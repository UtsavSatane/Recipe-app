import React from 'react';

export default function NutritionCard({ nutrition }) {
  if (!nutrition) return null;

  return (
    <div className="nutrition-card">
      <div className="nutrition-item">
        <span className="label">Calories</span>
        <span className="value">{Math.round(nutrition.calories)}</span>
      </div>
      <div className="nutrition-item">
        <span className="label">Protein</span>
        <span className="value">{Math.round(nutrition.protein)}g</span>
      </div>
      <div className="nutrition-item">
        <span className="label">Carbs</span>
        <span className="value">{Math.round(nutrition.carbs)}g</span>
      </div>
      <div className="nutrition-item">
        <span className="label">Fat</span>
        <span className="value">{Math.round(nutrition.fat)}g</span>
      </div>
    </div>
  );
}
