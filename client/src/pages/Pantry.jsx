import React, { useState, useEffect, useRef } from 'react';
import { api } from '../api/api';
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

export default function Pantry() {
  const [pantry, setPantry] = useState([]);
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
    loadPantry();
  }, []);

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
      setLoading(true);
      const data = await api.getPantry();
      setPantry(data.pantry || []);
    } catch (err) {
      setError(err.message || 'Failed to load pantry');
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

    // Optimistic update
    setPantry((prev) =>
      prev.map((p) => (p.ingredient_id === ingredientId ? { ...p, quantity_grams: newQty } : p))
    );
    setUpdatingId(ingredientId);

    try {
      await api.updatePantryItem(ingredientId, newQty);
    } catch (err) {
      // Revert on failure
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

    // Optimistic update
    setPantry((prev) =>
      prev.map((p) => (p.ingredient_id === ingredientId ? { ...p, quantity_grams: newQty } : p))
    );
    setUpdatingId(ingredientId);

    try {
      await api.updatePantryItem(ingredientId, newQty);
    } catch (err) {
      // Revert on failure
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

    // Optimistic update
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

  if (loading) return <LoadingState />;
  if (error) return <ErrorMessage message={error} />;

  return (
    <div className="pantry-page">
      <h1>Your Pantry</h1>
      <p className="subtitle">Manage your ingredients and quantities</p>

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

      <div className="pantry-grid">
        {pantry.length === 0 ? (
          <div className="empty-state">
            <h3>Your pantry is empty</h3>
            <p>Add ingredients to start discovering recipes.</p>
          </div>
        ) : (
          pantry.map((item) => {
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
          })
        )}
      </div>
    </div>
  );
}
