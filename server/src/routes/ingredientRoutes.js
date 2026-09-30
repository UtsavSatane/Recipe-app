const express = require('express');
const { getAllIngredients, searchIngredients } = require('../controllers/ingredientController');

const router = express.Router();

// Public endpoints — no authentication required
// Use a specific path to avoid conflicts with /search
router.get('/search', searchIngredients);
router.get('/all-ingredients', getAllIngredients);

module.exports = router;
