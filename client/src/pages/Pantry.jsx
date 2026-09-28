import React, { useState, useEffect } from 'react';
import { api } from '../api/api';
import LoadingState from '../components/LoadingState';
import ErrorMessage from '../components/ErrorMessage';

export default function Pantry() {
  const [pantry, setPantry] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedIngredient, setSelectedIngredient] = useState(null);
  const [quantity, setQuantity] = useState('');

  useEffect(() => {
    loadPantry();
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

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    try {
      const data = await api.searchIngredients(searchQuery);
      setSearchResults(data.ingredients || []);
    } catch (err) {
      setError(err.message || 'Search failed');
    }
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!selectedIngredient || !quantity) return;

    try {
      await api.addPantryItem({
        ingredient_id: selectedIngredient,
        quantity_grams: parseFloat(quantity),
      });
      setShowAddForm(false);
      setSelectedIngredient(null);
      setQuantity('');
      setSearchQuery('');
      setSearchResults([]);
      loadPantry();
    } catch (err) {
      setError(err.message || 'Failed to add ingredient');
    }
  };

  const handleUpdate = async (ingredientId, newQuantity) => {
    try {
      await api.updatePantryItem(ingredientId, parseFloat(newQuantity));
      loadPantry();
    } catch (err) {
      setError(err.message || 'Failed to update quantity');
    }
  };

  const handleDelete = async (ingredientId) => {
    try {
      await api.deletePantryItem(ingredientId);
      loadPantry();
    } catch (err) {
      setError(err.message || 'Failed to delete ingredient');
    }
  };

  if (loading) return <LoadingState />;
  if (error) return <ErrorMessage message={error} />;

  return (
    <div className="pantry-page">
      <h1>My Pantry</h1>

      <div className="pantry-actions">
        <button onClick={() => setShowAddForm(!showAddForm)} className="btn btn-primary">
          {showAddForm ? 'Cancel' : 'Add Ingredient'}
        </button>
      </div>

      {showAddForm && (
        <div className="add-ingredient-form">
          <form onSubmit={handleSearch}>
            <input
              type="text"
              placeholder="Search ingredients..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <button type="submit" className="btn btn-secondary">Search</button>
          </form>

          {searchResults.length > 0 && (
            <div className="search-results">
              {searchResults.map((ing) => (
                <div
                  key={ing.id}
                  className="search-result-item"
                  onClick={() => setSelectedIngredient(ing.id)}
                >
                  {ing.name}
                </div>
              ))}
            </div>
          )}

          {selectedIngredient && (
            <form onSubmit={handleAdd} className="add-form">
              <input
                type="number"
                placeholder="Quantity (grams)"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                required
                min="1"
              />
              <button type="submit" className="btn btn-primary">Add to Pantry</button>
            </form>
          )}
        </div>
      )}

      <div className="pantry-list">
        {pantry.length === 0 ? (
          <p>Your pantry is empty. Add some ingredients to get started.</p>
        ) : (
          pantry.map((item) => (
            <div key={item.ingredient_id} className="pantry-item">
              <div className="pantry-item-info">
                <h3>{item.name}</h3>
                <p>{item.quantity_grams}g</p>
                <p className="nutrition-info">
                  {item.calories_per_100g} cal | {item.protein_per_100g}g protein | {item.carbs_per_100g}g carbs | {item.fat_per_100g}g fat (per 100g)
                </p>
              </div>
              <div className="pantry-item-actions">
                <input
                  type="number"
                  defaultValue={item.quantity_grams}
                  min="1"
                  onChange={(e) => handleUpdate(item.ingredient_id, e.target.value)}
                />
                <button onClick={() => handleDelete(item.ingredient_id)} className="btn btn-danger">
                  Delete
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
