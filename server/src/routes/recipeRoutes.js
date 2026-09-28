const express = require('express');
const { matchRecipes } = require('../controllers/recipeController');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/match', authMiddleware, matchRecipes);

module.exports = router;
