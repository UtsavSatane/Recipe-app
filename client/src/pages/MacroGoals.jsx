import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
  const navigate = useNavigate();

  useEffect(() => {
    // Pre-fill with saved goals from localStorage
    const savedGoals = localStorage.getItem('macroGoals');
    if (savedGoals) {
      const goals = JSON.parse(savedGoals);
      setCalories(goals.target_calories || '');
      setProtein(goals.target_protein || '');
      setCarbs(goals.target_carbs || '');
      setFat(goals.target_fat || '');
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Validate inputs
    const cal = parseFloat(calories);
    const pro = parseFloat(protein);
    const carb = parseFloat(carbs);
    const f = parseFloat(fat);

    if (isNaN(cal) || cal <= 0) {
      setError('Calories must be a positive number');
      return;
    }
    if (isNaN(pro) || pro < 0) {
      setError('Protein must be a non-negative number');
      return;
    }
    if (isNaN(carb) || carb < 0) {
      setError('Carbs must be a non-negative number');
      return;
    }
    if (isNaN(f) || f < 0) {
      setError('Fat must be a non-negative number');
      return;
    }

    setLoading(true);

    try {
      await api.updateGoals({
        target_calories: cal,
        target_protein: pro,
        target_carbs: carb,
        target_fat: f,
      });

      // Save to localStorage
      localStorage.setItem('macroGoals', JSON.stringify({
        target_calories: cal,
        target_protein: pro,
        target_carbs: carb,
        target_fat: f,
      }));

      setSuccess('Macro goals updated successfully');
    } catch (err) {
      setError(err.message || 'Failed to update goals');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    navigate('/');
  };

  return (
    <div className="macro-goals-page">
      <h1>Update Your Macro Goals</h1>
      <p className="subtitle">Set your daily nutrition targets</p>
      <form onSubmit={handleSubmit} className="goals-form">
        <ErrorMessage message={error} />
        {success && <div className="success-message">{success}</div>}
        <div className="form-group">
          <label htmlFor="calories">Calories Goal</label>
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
          <label htmlFor="protein">Protein Goal (g)</label>
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
          <label htmlFor="carbs">Carbohydrates Goal (g)</label>
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
          <label htmlFor="fat">Fat Goal (g)</label>
          <input
            type="number"
            id="fat"
            value={fat}
            onChange={(e) => setFat(e.target.value)}
            required
            min="0"
          />
        </div>
        <div className="form-actions">
          <button type="button" className="btn btn-outline" onClick={handleCancel}>
            Cancel
          </button>
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'Saving...' : 'Save Goals'}
          </button>
        </div>
      </form>
    </div>
  );
}
