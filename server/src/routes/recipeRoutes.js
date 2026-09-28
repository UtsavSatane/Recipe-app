const express = require('express');
const { matchRecipes, listRecipes, getRecipeDetails } = require('../controllers/recipeController');
const authMiddleware = require('../middleware/authMiddleware');
const pool = require('../db');

const router = express.Router();

// Validation middleware for recipe ID (runs before auth)
async function validateRecipeId(req, res, next) {
  const recipeId = Number(req.params.id);
  if (!Number.isInteger(recipeId) || recipeId <= 0) {
    return res.status(400).json({ error: 'Invalid recipe ID.' });
  }

  // Check if recipe exists
  const result = await pool.query('SELECT id FROM recipes WHERE id = $1', [recipeId]);
  if (result.rows.length === 0) {
    return res.status(404).json({ error: 'Recipe not found.' });
  }

  next();
}

router.get('/match', authMiddleware, matchRecipes);
router.get('/', listRecipes);
router.get('/:id', validateRecipeId, authMiddleware, getRecipeDetails);

module.exports = router;
