import React from 'react';

export default function IngredientRow({ ingredient }) {
  const statusClass = {
    AVAILABLE: 'status-available',
    INSUFFICIENT: 'status-insufficient',
    MISSING: 'status-missing',
  }[ingredient.status] || '';

  const statusIcon = {
    AVAILABLE: '✓',
    INSUFFICIENT: '⚠',
    MISSING: '✗',
  }[ingredient.status] || '';

  return (
    <div className={`ingredient-row ${statusClass}`}>
      <div className="ingredient-info">
        <img
          src={ingredient.image_url}
          alt={ingredient.name || ingredient.ingredient}
          className="ingredient-image"
          onError={(e) => {
            e.target.style.display = 'none';
            e.target.nextSibling.style.display = 'flex';
          }}
        />
        <div className="ingredient-image-fallback" style={{ display: 'none' }}>
          <span>🍽</span>
        </div>
        <span className="ingredient-name">{ingredient.name || ingredient.ingredient}</span>
        <span className={`priority-badge priority-${(ingredient.priority || '').toLowerCase()}`}>
          {ingredient.priority}
        </span>
      </div>
      <div className="ingredient-details">
        <span>Required: {ingredient.required_grams}g</span>
        <span>Available: {ingredient.available_grams}g</span>
        {ingredient.missing_grams > 0 && (
          <span className="missing">Missing: {ingredient.missing_grams}g</span>
        )}
      </div>
      <div className="ingredient-status">
        <span className="status-icon">{statusIcon}</span>
        <span className="status-text">{ingredient.status}</span>
      </div>
    </div>
  );
}
