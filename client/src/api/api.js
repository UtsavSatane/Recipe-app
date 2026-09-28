const API_BASE = '/api';

class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.status = status;
  }
}

async function request(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;
  const token = localStorage.getItem('token');

  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const config = {
    ...options,
    headers,
  };

  const response = await fetch(url, config);

  if (response.status === 401) {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login';
    throw new ApiError('Unauthorized', 401);
  }

  const data = await response.json();

  if (!response.ok) {
    throw new ApiError(data.error || 'An error occurred', response.status);
  }

  return data;
}

export const api = {
  // Auth
  register: (userData) => request('/users/register', {
    method: 'POST',
    body: JSON.stringify(userData),
  }),

  login: (credentials) => request('/users/login', {
    method: 'POST',
    body: JSON.stringify(credentials),
  }),

  // Macro Goals
  updateGoals: (goals) => request('/users/me/goals', {
    method: 'PUT',
    body: JSON.stringify(goals),
  }),

  // Pantry
  getPantry: () => request('/pantry'),

  addPantryItem: (item) => request('/pantry', {
    method: 'POST',
    body: JSON.stringify(item),
  }),

  updatePantryItem: (ingredientId, quantity) => request(`/pantry/${ingredientId}`, {
    method: 'PUT',
    body: JSON.stringify({ quantity_grams: quantity }),
  }),

  deletePantryItem: (ingredientId) => request(`/pantry/${ingredientId}`, {
    method: 'DELETE',
  }),

  // Ingredients
  searchIngredients: (query) => request(`/ingredients/search?q=${encodeURIComponent(query)}`),

  // Recipes
  getRecipes: () => request('/recipes'),

  getRecipe: (id) => request(`/recipes/${id}`),

  matchRecipes: () => request('/recipes/match'),
};

export { ApiError };
