const pool = require('../db');

// -------------------------------------------------------------
// POST /api/pantry
// -------------------------------------------------------------
async function addIngredient(req, res) {
  try {
    const { ingredient_id, quantity_grams } = req.body;
    const userId = req.userId;

    // Validate ingredient_id
    if (ingredient_id === undefined || ingredient_id === null) {
      return res.status(400).json({ error: 'ingredient_id is required.' });
    }
    const ingredientId = Number(ingredient_id);
    if (!Number.isInteger(ingredientId) || ingredientId <= 0) {
      return res.status(400).json({ error: 'ingredient_id must be a positive integer.' });
    }

    // Validate quantity_grams
    if (quantity_grams === undefined || quantity_grams === null) {
      return res.status(400).json({ error: 'quantity_grams is required.' });
    }
    const quantityGrams = Number(quantity_grams);
    if (isNaN(quantityGrams) || quantityGrams <= 0) {
      return res.status(400).json({ error: 'quantity_grams must be a number greater than 0.' });
    }

    // Verify ingredient exists
    const ingredientCheck = await pool.query(
      'SELECT id FROM ingredients WHERE id = $1',
      [ingredientId]
    );
    if (ingredientCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Ingredient not found.' });
    }

    // Insert into pantry (handle duplicate gracefully)
    const result = await pool.query(
      `INSERT INTO user_pantry (user_id, ingredient_id, quantity_grams)
       VALUES ($1, $2, $3)
       ON CONFLICT (user_id, ingredient_id) DO NOTHING
       RETURNING user_id, ingredient_id, quantity_grams`,
      [userId, ingredientId, quantityGrams]
    );

    if (result.rows.length === 0) {
      return res.status(409).json({ error: 'Ingredient already exists in pantry.' });
    }

    const item = result.rows[0];

    return res.status(201).json({
      message: 'Ingredient added to pantry',
      pantryItem: {
        ingredient_id: item.ingredient_id,
        quantity_grams: item.quantity_grams,
      },
    });

  } catch (err) {
    console.error('Add pantry ingredient error:', err.message);
    return res.status(500).json({ error: 'Internal server error.' });
  }
}

// -------------------------------------------------------------
// GET /api/pantry
// -------------------------------------------------------------
async function getPantry(req, res) {
  try {
    const userId = req.userId;

    const result = await pool.query(
      `SELECT
         i.id AS ingredient_id,
         i.name,
         up.quantity_grams,
         i.calories_per_100g,
         i.protein_per_100g,
         i.carbs_per_100g,
         i.fat_per_100g
       FROM user_pantry up
       JOIN ingredients i ON i.id = up.ingredient_id
       WHERE up.user_id = $1
       ORDER BY i.name`,
      [userId]
    );

    const pantry = result.rows.map((row) => ({
      ingredient_id: row.ingredient_id,
      name: row.name,
      quantity_grams: row.quantity_grams,
      calories_per_100g: row.calories_per_100g,
      protein_per_100g: row.protein_per_100g,
      carbs_per_100g: row.carbs_per_100g,
      fat_per_100g: row.fat_per_100g,
    }));

    return res.json({ pantry });

  } catch (err) {
    console.error('Get pantry error:', err.message);
    return res.status(500).json({ error: 'Internal server error.' });
  }
}

// -------------------------------------------------------------
// PUT /api/pantry/:ingredientId
// -------------------------------------------------------------
async function updatePantryItem(req, res) {
  try {
    const { ingredientId } = req.params;
    const { quantity_grams } = req.body;
    const userId = req.userId;

    // Validate ingredientId from URL
    const ingId = Number(ingredientId);
    if (!Number.isInteger(ingId) || ingId <= 0) {
      return res.status(400).json({ error: 'ingredientId must be a positive integer.' });
    }

    // Validate quantity_grams
    if (quantity_grams === undefined || quantity_grams === null) {
      return res.status(400).json({ error: 'quantity_grams is required.' });
    }
    const quantityGrams = Number(quantity_grams);
    if (isNaN(quantityGrams) || quantityGrams <= 0) {
      return res.status(400).json({ error: 'quantity_grams must be a number greater than 0.' });
    }

    // Update only the authenticated user's pantry item
    const result = await pool.query(
      `UPDATE user_pantry
       SET quantity_grams = $1
       WHERE user_id = $2 AND ingredient_id = $3
       RETURNING user_id, ingredient_id, quantity_grams`,
      [quantityGrams, userId, ingId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Pantry item not found.' });
    }

    const item = result.rows[0];

    return res.json({
      message: 'Pantry item updated',
      pantryItem: {
        ingredient_id: item.ingredient_id,
        quantity_grams: item.quantity_grams,
      },
    });

  } catch (err) {
    console.error('Update pantry item error:', err.message);
    return res.status(500).json({ error: 'Internal server error.' });
  }
}

// -------------------------------------------------------------
// DELETE /api/pantry/:ingredientId
// -------------------------------------------------------------
async function removePantryItem(req, res) {
  try {
    const { ingredientId } = req.params;
    const userId = req.userId;

    // Validate ingredientId from URL
    const ingId = Number(ingredientId);
    if (!Number.isInteger(ingId) || ingId <= 0) {
      return res.status(400).json({ error: 'ingredientId must be a positive integer.' });
    }

    // Delete only the authenticated user's pantry item
    const result = await pool.query(
      `DELETE FROM user_pantry
       WHERE user_id = $1 AND ingredient_id = $2
       RETURNING user_id, ingredient_id`,
      [userId, ingId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Pantry item not found.' });
    }

    return res.json({ message: 'Ingredient removed from pantry' });

  } catch (err) {
    console.error('Remove pantry item error:', err.message);
    return res.status(500).json({ error: 'Internal server error.' });
  }
}

module.exports = { addIngredient, getPantry, updatePantryItem, removePantryItem };
