const express = require('express');
const { searchIngredients } = require('../controllers/ingredientController');

const router = express.Router();

// Public endpoint — no authentication required
router.get('/search', searchIngredients);

module.exports = router;
