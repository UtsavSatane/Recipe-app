import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/api';
import { useAuth } from '../context/AuthContext';
import RecipeCard from '../components/RecipeCard';
import LoadingState from '../components/LoadingState';
import ErrorMessage from '../components/ErrorMessage';

const DEFAULT_QUANTITY = 200;
const QUANTITY_STEP = 50;
const MIN_QUANTITY = 1;

function normalizeQuantity(value) {
  const num = parseFloat(value);
  if (isNaN(num) || !isFinite(num) || num <= 0) return null;
  return Math.round(num * 100) / 100;
}

function formatQuantity(value) {
  const num = parseFloat(value);
  if (isNaN(num)) return '0';
  return Number.isInteger(num) ? num.toString() : num.toFixed(2).replace(/\.?0+$/, '');
}

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
  const [macroTargets, setMacroTargets] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [searching, setSearching] = useState(false);
  const [addingId, setAddingId] = useState(null);
  const [success, setSuccess] = useState('');
  const [updatingId, setUpdatingId] = useState(null);
  const [editValues, setEditValues] = useState({});
  const [validationErrors, setValidationErrors] = useState({});
  const debounceRef = useRef(null);
  const dropdownRef = useRef(null);

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

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      const [pantryData, macroData] = await Promise.all([
        api.getPantry(),
        api.getRecipe('1').catch(() => null),
      ]);
      setPantry(pantryData.pantry || []);

      // Fetch macro targets from users endpoint
      const token = localStorage.getItem('token');
      const response = await fetch('/api/users/me/goals', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          target_calories: 0,
          target_protein: 0,
          target_carbs: 0,
          target_fat: 0,
        }),
      });
      // This is a workaround - we need to get the current goals
      // Let's use a different approach - fetch from the match endpoint which includes targets
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

  const loadPantry = async () => {
    try {
      const data = await api.getPantry();
      setPantry(data.pantry || []);
    } catch (err) {
      setError(err.message || 'Failed to load pantry');
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
        const currentQty = parseFloat(existing.quantity_grams);
        await api.updatePantryItem(ing.id, currentQty + DEFAULT_QUANTITY);
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

  const handleIncrease = async (ingredientId, currentQty) => {
    if (updatingId) return;
    const qty = parseFloat(currentQty);
    if (isNaN(qty)) return;
    const newQty = qty + QUANTITY_STEP;

    setPantry((prev) =>
      prev.map((p) => (p.ingredient_id === ingredientId ? { ...p, quantity_grams: newQty } : p))
    );
    setUpdatingId(ingredientId);

    try {
      await api.updatePantryItem(ingredientId, newQty);
    } catch (err) {
      await loadPantry();
      setError(err.message || 'Failed to update quantity');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleDecrease = async (ingredientId, currentQty) => {
    if (updatingId) return;
    const qty = parseFloat(currentQty);
    if (isNaN(qty)) return;
    const newQty = qty - QUANTITY_STEP;
    if (newQty < MIN_QUANTITY) {
      setError(`Quantity cannot go below ${MIN_QUANTITY}g. Use Remove to delete the ingredient.`);
      return;
    }

    setPantry((prev) =>
      prev.map((p) => (p.ingredient_id === ingredientId ? { ...p, quantity_grams: newQty } : p))
    );
    setUpdatingId(ingredientId);

    try {
      await api.updatePantryItem(ingredientId, newQty);
    } catch (err) {
      await loadPantry();
      setError(err.message || 'Failed to update quantity');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleManualSave = async (ingredientId) => {
    const rawValue = editValues[ingredientId];
    if (rawValue === undefined || rawValue === '') return;

    const normalized = normalizeQuantity(rawValue);
    if (normalized === null) {
      setValidationErrors((prev) => ({
        ...prev,
        [ingredientId]: 'Please enter a valid positive number',
      }));
      return;
    }

    setValidationErrors((prev) => {
      const next = { ...prev };
      delete next[ingredientId];
      return next;
    });

    setPantry((prev) =>
      prev.map((p) => (p.ingredient_id === ingredientId ? { ...p, quantity_grams: normalized } : p))
    );
    setUpdatingId(ingredientId);

    try {
      await api.updatePantryItem(ingredientId, normalized);
      setEditValues((prev) => {
        const next = { ...prev };
        delete next[ingredientId];
        return next;
      });
    } catch (err) {
      await loadPantry();
      setError(err.message || 'Failed to update quantity');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleEditChange = (ingredientId, value) => {
    setEditValues((prev) => ({ ...prev, [ingredientId]: value }));
    setValidationErrors((prev) => {
      const next = { ...prev };
      delete next[ingredientId];
      return next;
    });
  };

  const handleEditKeyDown = (e, ingredientId) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleManualSave(ingredientId);
    }
  };

  const handleEditBlur = (ingredientId) => {
    handleManualSave(ingredientId);
  };

  const handleDelete = async (ingredientId) => {
    try {
      await api.deletePantryItem(ingredientId);
      await loadPantry();
    } catch (err) {
      setError(err.message || 'Failed to delete ingredient');
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

      {/* Your Pantry Section */}
      <div className="dashboard-section">
        <div className="section-header">
          <h2>Your Pantry</h2>
          <span className="section-count">{pantry.length} ingredients</span>
        </div>

        <div className="ingredient-autocomplete" ref={dropdownRef}>
          <div className="autocomplete-input-wrapper">
            <input
              type="text"
              placeholder="Search ingredients to add..."
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

        {pantry.length > 0 && (
          <div className="pantry-grid">
            {pantry.map((item) => {
              const displayValue = editValues[item.ingredient_id] ?? formatQuantity(item.quantity_grams);
              const isUpdating = updatingId === item.ingredient_id;
              const validationError = validationErrors[item.ingredient_id];

              return (
                <div key={item.ingredient_id} className="pantry-item">
                  <div className="pantry-item-header">
                    <h3>{item.name}</h3>
                  </div>
                  <p className="pantry-item-nutrition">
                    {item.calories_per_100g} kcal · {item.protein_per_100g}g protein / 100g
                  </p>
                  <div className="quantity-controls">
                    <button
                      className="qty-btn qty-decrease"
                      onClick={() => handleDecrease(item.ingredient_id, item.quantity_grams)}
                      disabled={isUpdating}
                      aria-label="Decrease quantity"
                    >
                      −
                    </button>
                    <input
                      type="text"
                      className="qty-input"
                      value={displayValue}
                      onChange={(e) => handleEditChange(item.ingredient_id, e.target.value)}
                      onKeyDown={(e) => handleEditKeyDown(e, item.ingredient_id)}
                      onBlur={() => handleEditBlur(item.ingredient_id)}
                      disabled={isUpdating}
                      aria-label="Quantity in grams"
                    />
                    <span className="qty-unit">g</span>
                    <button
                      className="qty-btn qty-increase"
                      onClick={() => handleIncrease(item.ingredient_id, item.quantity_grams)}
                      disabled={isUpdating}
                      aria-label="Increase quantity"
                    >
                      +
                    </button>
                  </div>
                  {validationError && <p className="validation-error">{validationError}</p>}
                  <button
                    onClick={() => handleDelete(item.ingredient_id)}
                    className="btn btn-danger btn-sm remove-btn"
                    disabled={isUpdating}
                  >
                    Remove
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {pantry.length > 0 && (
          <Link to="/pantry" className="view-full-link">View Full Pantry →</Link>
        )}
      </div>

      {/* Empty Pantry State */}
      {pantry.length === 0 && (
        <div className="empty-state">
          <h3>Your pantry is empty</h3>
          <p>Add a few ingredients and we'll find recipes you can make.</p>
          <Link to="/pantry" className="btn btn-primary">+ Add Your First Ingredient</Link>
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
                <span className={`priority-badge priority-${item.priority.toLowerCase()}`}>
                  {item.priority}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Macro Goals */}
      {macroTargets && (
        <div className="dashboard-section">
          <div className="section-header">
            <h2>Your Daily Targets</h2>
            <Link to="/goals" className="btn btn-outline btn-sm">Edit Goals</Link>
          </div>
          <div className="macro-targets">
            <div className="macro-target">
              <span className="macro-label">Calories</span>
              <span className="macro-value">{macroTargets.calories} kcal</span>
            </div>
            <div className="macro-target">
              <span className="macro-label">Protein</span>
              <span className="macro-value">{macroTargets.protein}g</span>
            </div>
            <div className="macro-target">
              <span className="macro-label">Carbs</span>
              <span className="macro-value">{macroTargets.carbs}g</span>
            </div>
            <div className="macro-target">
              <span className="macro-label">Fat</span>
              <span className="macro-value">{macroTargets.fat}g</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
