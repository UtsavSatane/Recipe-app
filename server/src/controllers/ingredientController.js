const pool = require('../db');

const SEARCH_LIMIT = 20;

// -------------------------------------------------------------
// GET /api/ingredients/search?q=...
// -------------------------------------------------------------
async function searchIngredients(req, res) {
  try {
    const { q } = req.query;

    // Validate query parameter
    if (q === undefined || q === null) {
      return res.status(400).json({ error: 'Search query is required.' });
    }

    // Trim whitespace
    const trimmedQuery = q.trim();
    if (trimmedQuery === '') {
      return res.status(400).json({ error: 'Search query is required.' });
    }

    // Search with parameterized SQL (case-insensitive partial match)
    const result = await pool.query(
      `SELECT
         id,
         name,
         calories_per_100g,
         protein_per_100g,
         carbs_per_100g,
         fat_per_100g
       FROM ingredients
       WHERE name ILIKE $1
       ORDER BY name ASC
       LIMIT $2`,
      [`%${trimmedQuery}%`, SEARCH_LIMIT]
    );

    const ingredients = result.rows.map((row) => ({
      id: row.id,
      name: row.name,
      calories_per_100g: row.calories_per_100g,
      protein_per_100g: row.protein_per_100g,
      carbs_per_100g: row.carbs_per_100g,
      fat_per_100g: row.fat_per_100g,
    }));

    return res.json({ ingredients });

  } catch (err) {
    console.error('Ingredient search error:', err.message);
    return res.status(500).json({ error: 'Internal server error.' });
  }
}

module.exports = { searchIngredients };
