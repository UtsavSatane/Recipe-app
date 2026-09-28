import React, { useState, useEffect, useRef } from 'react';
import { api } from '../api/api';
import RecipeCard from '../components/RecipeCard';
import LoadingState from '../components/LoadingState';
import ErrorMessage from '../components/ErrorMessage';

const DEFAULT_QUANTITY = 200;

export default function Dashboard() {
  const [pantry, setPantry] = useState([]);
  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [searching, setSearching] = useState(false);
  const [addingId, setAddingId] = useState(null);
  const [success, setSuccess] = useState('');
  const debounceRef = useRef(null);
  const dropdownRef = useRef(null);

  useEffect(() => {
    loadPantry();
  }, []);

  useEffect(() => {
    if (pantry.length > 0) {
      loadRecipes();
    } else {
      setRecipes([]);
      setLoading(false);
    }
  }, [pantry.length]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const loadPantry = async () => {
    try {
      const data = await api.getPantry();
      setPantry(data.pantry || []);
    } catch (err) {
      setError(err.message || 'Failed to load pantry');
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

  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchQuery(value);
    setSuccess('');

    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (!value.trim()) {
      setSuggestions([]);
      setShowDropdown(false);
      return;
    }

    setSearching(true);
    setShowDropdown(true);

    debounceRef.current = setTimeout(async () => {
      try {
        const data = await api.searchIngredients(value);
        setSuggestions(data.ingredients || []);
      } catch (err) {
        setSuggestions([]);
      } finally {
        setSearching(false);
      }
    }, 300);
  };

  const handleQuickAdd = async (ing) => {
    try {
      setAddingId(ing.id);
      const existing = pantry.find((p) => p.ingredient_id === ing.id);

      if (existing) {
        await api.updatePantryItem(ing.id, existing.quantity_grams + DEFAULT_QUANTITY);
        setSuccess(`${ing.name} quantity increased by ${DEFAULT_QUANTITY}g`);
      } else {
        await api.addPantryItem({
          ingredient_id: ing.id,
          quantity_grams: DEFAULT_QUANTITY,
        });
        setSuccess(`${ing.name} added to pantry`);
      }

      setSearchQuery('');
      setSuggestions([]);
      setShowDropdown(false);
      await loadPantry();
    } catch (err) {
      setError(err.message || 'Failed to add ingredient');
    } finally {
      setAddingId(null);
    }
  };

  const fullyAvailable = recipes.filter((r) => r.availability?.group === 'FULLY_AVAILABLE');
  const partiallyAvailable = recipes.filter((r) => r.availability?.group === 'PARTIALLY_AVAILABLE');

  if (loading && pantry.length === 0) return <LoadingState />;

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h1>What's in your pantry?</h1>
        <p className="subtitle">Add ingredients you have and discover recipes you can make.</p>
      </div>

      <div className="pantry-search-section">
        <h2>Add Ingredients</h2>
        <p className="help-text">Search for ingredients and add them to your pantry to get recipe recommendations.</p>

        <div className="ingredient-autocomplete" ref={dropdownRef}>
          <div className="autocomplete-input-wrapper">
            <input
              type="text"
              placeholder="Search ingredients (e.g., chicken, rice, oats)..."
              value={searchQuery}
              onChange={handleSearchChange}
              onFocus={() => searchQuery && setShowDropdown(true)}
            />
          </div>

          {showDropdown && (
            <div className="autocomplete-dropdown">
              {searching && <div className="autocomplete-loading">Searching...</div>}
              {!searching && suggestions.length === 0 && (
                <div className="autocomplete-empty">No ingredients found</div>
              )}
              {!searching && suggestions.map((ing) => (
                <div key={ing.id} className="autocomplete-item">
                  <div className="autocomplete-item-info">
                    <span className="item-name">{ing.name}</span>
                    <span className="item-nutrition">
                      {ing.calories_per_100g} kcal · {ing.protein_per_100g}g protein · {ing.carbs_per_100g}g carbs · {ing.fat_per_100g}g fat
                    </span>
                  </div>
                  <button
                    className="btn btn-primary btn-sm add-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleQuickAdd(ing);
                    }}
                    disabled={addingId === ing.id}
                  >
                    {addingId === ing.id ? '...' : '+'}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {success && <div className="success-message">{success}</div>}
        {error && <ErrorMessage message={error} />}
      </div>

      {pantry.length === 0 ? (
        <div className="empty-state">
          <h3>Your pantry is empty</h3>
          <p>Add some ingredients to discover recipes you can make.</p>
        </div>
      ) : (
        <>
          {fullyAvailable.length > 0 && (
            <section>
              <div className="recipe-section-header">
                <h2>Recipes You Can Make</h2>
                <span className="recipe-count">{fullyAvailable.length} recipes</span>
              </div>
              <div className="recipe-grid">
                {fullyAvailable.map((recipe) => (
                  <RecipeCard key={recipe.recipe_id} recipe={recipe} />
                ))}
              </div>
            </section>
          )}

          {partiallyAvailable.length > 0 && (
            <section>
              <div className="recipe-section-header">
                <h2>Recipes You Almost Have</h2>
                <span className="recipe-count">{partiallyAvailable.length} recipes</span>
              </div>
              <div className="recipe-grid">
                {partiallyAvailable.map((recipe) => (
                  <RecipeCard key={recipe.recipe_id} recipe={recipe} />
                ))}
              </div>
            </section>
          )}

          {recipes.length === 0 && !loading && (
            <div className="empty-state">
              <h3>Not enough ingredients yet</h3>
              <p>Add more ingredients to unlock more recipes.</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
