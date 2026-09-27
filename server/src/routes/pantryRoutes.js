const express = require('express');
const {
  addIngredient,
  getPantry,
  updatePantryItem,
  removePantryItem,
} = require('../controllers/pantryController');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/', authMiddleware, addIngredient);
router.get('/', authMiddleware, getPantry);
router.put('/:ingredientId', authMiddleware, updatePantryItem);
router.delete('/:ingredientId', authMiddleware, removePantryItem);

module.exports = router;
