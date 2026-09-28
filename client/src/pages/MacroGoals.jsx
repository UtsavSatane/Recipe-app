import React, { useState } from 'react';
import { api } from '../api/api';
import ErrorMessage from '../components/ErrorMessage';

export default function MacroGoals() {
  const [calories, setCalories] = useState('');
  const [protein, setProtein] = useState('');
  const [carbs, setCarbs] = useState('');
  const [fat, setFat] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      await api.updateGoals({
        target_calories: parseFloat(calories),
        target_protein: parseFloat(protein),
        target_carbs: parseFloat(carbs),
        target_fat: parseFloat(fat),
      });
      setSuccess('Macro goals updated successfully');
    } catch (err) {
      setError(err.message || 'Failed to update goals');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="macro-goals-page">
      <h1>Macro Goals</h1>
      <form onSubmit={handleSubmit} className="goals-form">
        <ErrorMessage message={error} />
        {success && <div className="success-message">{success}</div>}
        <div className="form-group">
          <label htmlFor="calories">Target Calories</label>
          <input
            type="number"
            id="calories"
            value={calories}
            onChange={(e) => setCalories(e.target.value)}
            required
            min="1"
          />
        </div>
        <div className="form-group">
          <label htmlFor="protein">Target Protein (g)</label>
          <input
            type="number"
            id="protein"
            value={protein}
            onChange={(e) => setProtein(e.target.value)}
            required
            min="0"
          />
        </div>
        <div className="form-group">
          <label htmlFor="carbs">Target Carbs (g)</label>
          <input
            type="number"
            id="carbs"
            value={carbs}
            onChange={(e) => setCarbs(e.target.value)}
            required
            min="0"
          />
        </div>
        <div className="form-group">
          <label htmlFor="fat">Target Fat (g)</label>
          <input
            type="number"
            id="fat"
            value={fat}
            onChange={(e) => setFat(e.target.value)}
            required
            min="0"
          />
        </div>
        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading ? 'Saving...' : 'Save Goals'}
        </button>
      </form>
    </div>
  );
}
