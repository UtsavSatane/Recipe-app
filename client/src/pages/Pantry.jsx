import React, { useState, useEffect, useRef } from 'react';
import { api } from '../api/api';
import LoadingState from '../components/LoadingState';
import ErrorMessage from '../components/ErrorMessage';

const DEFAULT_QUANTITY = 50;
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
  const [allIngredients, setAllIngredients] = useState([]);
  const [pantry, setPantry] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [addingId, setAddingId] = useState(null);
  const [updatingId, setUpdatingId] = useState(null);
  const [editValues, setEditValues] = useState({});
  const [validationErrors, setValidationErrors] = useState({});
  const [success, setSuccess] = useState('');
  const debounceRef = useRef(null);

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      const [ingredientsData, pantryData] = await Promise.all([
        api.getAllIngredients(),
        api.getPantry(),
      ]);
      setAllIngredients(ingredientsData.ingredients || []);
      setPantry(pantryData.pantry || []);
    } catch (err) {
      setError(err.message || 'Failed to load pantry');
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

  const handleAddNew = async (ing) => {
    try {
      setAddingId(ing.id);
      await api.addPantryItem({
        ingredient_id: ing.id,
        quantity_grams: DEFAULT_QUANTITY,
      });
      setSuccess(`${ing.name} added to pantry`);
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

    if (newQty <= 0) {
      // Remove from pantry when quantity reaches 0
      try {
        setUpdatingId(ingredientId);
        await api.deletePantryItem(ingredientId);
        await loadPantry();
      } catch (err) {
        await loadPantry();
        setError(err.message || 'Failed to remove ingredient');
      } finally {
        setUpdatingId(null);
      }
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

    const existing = pantry.find((p) => p.ingredient_id === ingredientId);

    setPantry((prev) =>
      prev.map((p) => (p.ingredient_id === ingredientId ? { ...p, quantity_grams: normalized } : p))
    );
    setUpdatingId(ingredientId);

    try {
      if (existing) {
        await api.updatePantryItem(ingredientId, normalized);
      } else {
        await api.addPantryItem({
          ingredient_id: ingredientId,
          quantity_grams: normalized,
        });
      }
      setEditValues((prev) => {
        const next = { ...prev };
        delete next[ingredientId];
        return next;
      });
      await loadPantry();
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

  const filteredIngredients = searchQuery
    ? allIngredients.filter((ing) =>
        ing.name.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : allIngredients;

  if (loading) return <LoadingState />;
  if (error) return <ErrorMessage message={error} />;

  return (
    <div className="pantry-page">
      <h1>Your Pantry</h1>
      <p className="subtitle">Build your pantry by adding ingredients you commonly use.</p>

      <div className="ingredient-search-box">
        <input
          type="text"
          placeholder="Search ingredients..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {success && <div className="success-message">{success}</div>}

      <div className="ingredient-grid">
        {filteredIngredients.map((ing) => {
          const pantryItem = pantry.find((p) => p.ingredient_id === ing.id);
          const isInPantry = !!pantryItem;
          const isAdding = addingId === ing.id;
          const isUpdating = updatingId === ing.id;
          const displayValue = editValues[ing.id] ?? (pantryItem ? formatQuantity(pantryItem.quantity_grams) : '');
          const validationError = validationErrors[ing.id];

          return (
            <div key={ing.id} className={`ingredient-card ${isInPantry ? 'in-pantry' : ''}`}>
              <div className="ingredient-card-image">
                <img
                  src={ing.image_url}
                  alt={ing.name}
                  onError={(e) => {
                    e.target.style.display = 'none';
                    e.target.nextSibling.style.display = 'flex';
                  }}
                />
                <div className="ingredient-image-fallback" style={{ display: 'none' }}>
                  <span>🍽</span>
                </div>
              </div>
              <h3 className="ingredient-card-name">{ing.name}</h3>
              <p className="ingredient-card-calories">{ing.calories_per_100g} kcal/100g</p>

              {isInPantry ? (
                <>
                  <div className="quantity-controls">
                    <button
                      className="qty-btn qty-decrease"
                      onClick={() => handleDecrease(ing.id, pantryItem.quantity_grams)}
                      disabled={isUpdating}
                      aria-label="Decrease quantity"
                    >
                      −
                    </button>
                    <input
                      type="text"
                      className="qty-input"
                      value={displayValue}
                      onChange={(e) => handleEditChange(ing.id, e.target.value)}
                      onKeyDown={(e) => handleEditKeyDown(e, ing.id)}
                      onBlur={() => handleEditBlur(ing.id)}
                      disabled={isUpdating}
                      aria-label="Quantity in grams"
                    />
                    <span className="qty-unit">g</span>
                    <button
                      className="qty-btn qty-increase"
                      onClick={() => handleIncrease(ing.id, pantryItem.quantity_grams)}
                      disabled={isUpdating}
                      aria-label="Increase quantity"
                    >
                      +
                    </button>
                  </div>
                  {validationError && <p className="validation-error">{validationError}</p>}
                  <button
                    onClick={() => handleDelete(ing.id)}
                    className="btn btn-danger btn-sm remove-btn"
                    disabled={isUpdating}
                  >
                    Remove
                  </button>
                </>
              ) : (
                <button
                  className="btn btn-primary add-ingredient-btn"
                  onClick={() => handleAddNew(ing)}
                  disabled={isAdding}
                >
                  {isAdding ? 'Adding...' : '+ Add'}
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
