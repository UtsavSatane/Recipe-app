const pool = require('../db');

// Priority weights for pantry score calculation
const PRIORITY_WEIGHTS = {
  CORE: 3,
  SUPPORTING: 2,
  OPTIONAL: 1,
};

// -------------------------------------------------------------
// GET /api/recipes/match
// -------------------------------------------------------------
async function matchRecipes(req, res) {
  try {
    const userId = req.userId;

    // 1. Get user's macro targets
    const userResult = await pool.query(
      'SELECT target_calories, target_protein, target_carbs, target_fat FROM users WHERE id = $1',
      [userId]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found.' });
    }

    const targets = userResult.rows[0];

    // 2. Get user's pantry
    const pantryResult = await pool.query(
      `SELECT ingredient_id, quantity_grams
       FROM user_pantry
       WHERE user_id = $1`,
      [userId]
    );

    // Build pantry map: ingredient_id -> quantity_grams
    const pantryMap = {};
    for (const row of pantryResult.rows) {
      pantryMap[row.ingredient_id] = parseFloat(row.quantity_grams);
    }

    // 3. Get all recipes with their ingredients
    const recipesResult = await pool.query(
      `SELECT
         r.id AS recipe_id,
         r.name,
         r.servings,
         i.id AS ingredient_id,
         i.name AS ingredient_name,
         i.calories_per_100g,
         i.protein_per_100g,
         i.carbs_per_100g,
         i.fat_per_100g,
         ri.quantity_grams AS required_grams,
         ri.priority
       FROM recipes r
       JOIN recipe_ingredients ri ON ri.recipe_id = r.id
       JOIN ingredients i ON i.id = ri.ingredient_id
       ORDER BY r.id, i.name`
    );

    // Group by recipe
    const recipeMap = {};
    for (const row of recipesResult.rows) {
      if (!recipeMap[row.recipe_id]) {
        recipeMap[row.recipe_id] = {
          recipe_id: row.recipe_id,
          name: row.name,
          servings: row.servings,
          ingredients: [],
        };
      }
      recipeMap[row.recipe_id].ingredients.push({
        ingredient_id: row.ingredient_id,
        ingredient_name: row.ingredient_name,
        calories_per_100g: parseFloat(row.calories_per_100g),
        protein_per_100g: parseFloat(row.protein_per_100g),
        carbs_per_100g: parseFloat(row.carbs_per_100g),
        fat_per_100g: parseFloat(row.fat_per_100g),
        required_grams: parseFloat(row.required_grams),
        priority: row.priority,
      });
    }

    // 4. Process each recipe
    const processedRecipes = [];

    for (const recipe of Object.values(recipeMap)) {
      const ingredientDetails = [];
      let totalCalories = 0;
      let totalProtein = 0;
      let totalCarbs = 0;
      let totalFat = 0;

      let coreComplete = true;
      let weightedAvailabilitySum = 0;
      let totalWeight = 0;

      for (const ing of recipe.ingredients) {
        const availableGrams = pantryMap[ing.ingredient_id] || 0;
        const requiredGrams = ing.required_grams;
        const missingGrams = Math.max(requiredGrams - availableGrams, 0);

        let status;
        if (availableGrams === 0) {
          status = 'MISSING';
        } else if (availableGrams < requiredGrams) {
          status = 'INSUFFICIENT';
        } else {
          status = 'AVAILABLE';
        }

        // Track CORE completeness
        if (ing.priority === 'CORE' && status !== 'AVAILABLE') {
          coreComplete = false;
        }

        // Calculate nutrition contribution
        const ratio = ing.required_grams / 100;
        totalCalories += ratio * ing.calories_per_100g;
        totalProtein += ratio * ing.protein_per_100g;
        totalCarbs += ratio * ing.carbs_per_100g;
        totalFat += ratio * ing.fat_per_100g;

        // Calculate weighted availability for pantry score
        const availabilityRatio = Math.min(availableGrams / requiredGrams, 1);
        const weight = PRIORITY_WEIGHTS[ing.priority] || 1;
        weightedAvailabilitySum += availabilityRatio * weight;
        totalWeight += weight;

        ingredientDetails.push({
          ingredient: ing.ingredient_name,
          priority: ing.priority,
          required_grams: requiredGrams,
          available_grams: availableGrams,
          status: status,
          missing_grams: missingGrams,
        });
      }

      // Calculate pantry score (0-100)
      const pantryScore = totalWeight > 0
        ? (weightedAvailabilitySum / totalWeight) * 100
        : 0;

      // Calculate nutrition per serving
      const servings = recipe.servings;
      const perServing = {
        calories: totalCalories / servings,
        protein: totalProtein / servings,
        carbs: totalCarbs / servings,
        fat: totalFat / servings,
      };

      // Calculate macro fit score (0-100)
      const macroFitScore = calculateMacroFit(perServing, targets);

      // Calculate final score
      const finalScore = (pantryScore * 0.7) + (macroFitScore * 0.3);

      // Determine availability group
      const availabilityGroup = coreComplete ? 'FULLY_AVAILABLE' : 'PARTIALLY_AVAILABLE';

      // Generate shopping suggestions
      const shoppingSuggestions = ingredientDetails
        .filter((ing) => ing.status !== 'AVAILABLE')
        .map((ing) => ({
          ingredient: ing.ingredient,
          required_grams: ing.required_grams,
          available_grams: ing.available_grams,
          suggested_purchase_grams: ing.missing_grams,
        }));

      processedRecipes.push({
        recipe_id: recipe.recipe_id,
        name: recipe.name,
        servings: recipe.servings,
        availability: {
          group: availabilityGroup,
          core_complete: coreComplete,
        },
        scores: {
          pantry_score: Math.round(pantryScore * 100) / 100,
          macro_fit_score: Math.round(macroFitScore * 100) / 100,
          final_score: Math.round(finalScore * 100) / 100,
        },
        ingredients: ingredientDetails,
        nutrition: {
          total: {
            calories: Math.round(totalCalories * 100) / 100,
            protein: Math.round(totalProtein * 100) / 100,
            carbs: Math.round(totalCarbs * 100) / 100,
            fat: Math.round(totalFat * 100) / 100,
          },
          per_serving: {
            calories: Math.round(perServing.calories * 100) / 100,
            protein: Math.round(perServing.protein * 100) / 100,
            carbs: Math.round(perServing.carbs * 100) / 100,
            fat: Math.round(perServing.fat * 100) / 100,
          },
        },
        shopping_suggestions: shoppingSuggestions,
      });
    }

    // 5. Sort: FULLY_AVAILABLE first, then PARTIALLY_AVAILABLE
    // Within each group, sort by final_score descending
    processedRecipes.sort((a, b) => {
      if (a.availability.group !== b.availability.group) {
        return a.availability.group === 'FULLY_AVAILABLE' ? -1 : 1;
      }
      return b.scores.final_score - a.scores.final_score;
    });

    return res.json({ recipes: processedRecipes });

  } catch (err) {
    console.error('Recipe match error:', err.message);
    return res.status(500).json({ error: 'Internal server error.' });
  }
}

// -------------------------------------------------------------
// MACRO FIT CALCULATION
// -------------------------------------------------------------
// Formula:
// For each macro (calories, protein, carbs, fat):
//   If target > 0:
//     fit = max(0, 1 - |actual - target| / target)
//   If target == 0:
//     fit = 1 if actual == 0, else 0
//
// Macro Fit Score = average of all 4 fits * 100
// -------------------------------------------------------------
function calculateMacroFit(perServing, targets) {
  const macros = [
    { actual: perServing.calories, target: parseFloat(targets.target_calories) || 0 },
    { actual: perServing.protein, target: parseFloat(targets.target_protein) || 0 },
    { actual: perServing.carbs, target: parseFloat(targets.target_carbs) || 0 },
    { actual: perServing.fat, target: parseFloat(targets.target_fat) || 0 },
  ];

  let totalFit = 0;

  for (const macro of macros) {
    if (macro.target === 0) {
      // If target is 0, perfect match only if actual is also 0
      totalFit += macro.actual === 0 ? 1 : 0;
    } else {
      const deviation = Math.abs(macro.actual - macro.target) / macro.target;
      totalFit += Math.max(0, 1 - deviation);
    }
  }

  return (totalFit / macros.length) * 100;
}

// -------------------------------------------------------------
// GET /api/recipes  (public — list all recipes)
// -------------------------------------------------------------
async function listRecipes(req, res) {
  try {
    const recipesResult = await pool.query(
      `SELECT
         r.id AS recipe_id,
         r.name,
         r.servings,
         i.calories_per_100g,
         i.protein_per_100g,
         i.carbs_per_100g,
         i.fat_per_100g,
         ri.quantity_grams AS required_grams
       FROM recipes r
       JOIN recipe_ingredients ri ON ri.recipe_id = r.id
       JOIN ingredients i ON i.id = ri.ingredient_id
       ORDER BY r.id ASC, i.name ASC`
    );

    // Group by recipe
    const recipeMap = {};
    for (const row of recipesResult.rows) {
      if (!recipeMap[row.recipe_id]) {
        recipeMap[row.recipe_id] = {
          recipe_id: row.recipe_id,
          name: row.name,
          servings: row.servings,
          totalCalories: 0,
          totalProtein: 0,
          totalCarbs: 0,
          totalFat: 0,
        };
      }
      const ratio = parseFloat(row.required_grams) / 100;
      recipeMap[row.recipe_id].totalCalories += ratio * parseFloat(row.calories_per_100g);
      recipeMap[row.recipe_id].totalProtein += ratio * parseFloat(row.protein_per_100g);
      recipeMap[row.recipe_id].totalCarbs += ratio * parseFloat(row.carbs_per_100g);
      recipeMap[row.recipe_id].totalFat += ratio * parseFloat(row.fat_per_100g);
    }

    const recipes = Object.values(recipeMap).map((r) => ({
      recipe_id: r.recipe_id,
      name: r.name,
      servings: r.servings,
      nutrition: {
        calories: Math.round((r.totalCalories / r.servings) * 100) / 100,
        protein: Math.round((r.totalProtein / r.servings) * 100) / 100,
        carbs: Math.round((r.totalCarbs / r.servings) * 100) / 100,
        fat: Math.round((r.totalFat / r.servings) * 100) / 100,
      },
    }));

    return res.json({ recipes });

  } catch (err) {
    console.error('List recipes error:', err.message);
    return res.status(500).json({ error: 'Internal server error.' });
  }
}

// -------------------------------------------------------------
// GET /api/recipes/:id  (protected — recipe details)
// -------------------------------------------------------------
async function getRecipeDetails(req, res) {
  try {
    const recipeId = Number(req.params.id);

    // Validate recipe ID
    if (!Number.isInteger(recipeId) || recipeId <= 0) {
      return res.status(400).json({ error: 'Invalid recipe ID.' });
    }

    const userId = req.userId;

    // 1. Get recipe info
    const recipeResult = await pool.query(
      'SELECT id, name, servings, instructions FROM recipes WHERE id = $1',
      [recipeId]
    );

    if (recipeResult.rows.length === 0) {
      return res.status(404).json({ error: 'Recipe not found.' });
    }

    const recipe = recipeResult.rows[0];

    // 2. Get user's macro targets
    const userResult = await pool.query(
      'SELECT target_calories, target_protein, target_carbs, target_fat FROM users WHERE id = $1',
      [userId]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found.' });
    }

    const targets = userResult.rows[0];

    // 3. Get user's pantry
    const pantryResult = await pool.query(
      'SELECT ingredient_id, quantity_grams FROM user_pantry WHERE user_id = $1',
      [userId]
    );

    const pantryMap = {};
    for (const row of pantryResult.rows) {
      pantryMap[row.ingredient_id] = parseFloat(row.quantity_grams);
    }

    // 4. Get recipe ingredients with details
    const ingredientsResult = await pool.query(
      `SELECT
         i.id AS ingredient_id,
         i.name,
         i.calories_per_100g,
         i.protein_per_100g,
         i.carbs_per_100g,
         i.fat_per_100g,
         ri.quantity_grams AS required_grams,
         ri.priority
       FROM recipe_ingredients ri
       JOIN ingredients i ON i.id = ri.ingredient_id
       WHERE ri.recipe_id = $1`,
      [recipeId]
    );

    // 5. Process ingredients
    const PRIORITY_ORDER = { CORE: 0, SUPPORTING: 1, OPTIONAL: 2 };

    const ingredients = [];
    let totalCalories = 0;
    let totalProtein = 0;
    let totalCarbs = 0;
    let totalFat = 0;
    let coreComplete = true;

    for (const row of ingredientsResult.rows) {
      const requiredGrams = parseFloat(row.required_grams);
      const availableGrams = pantryMap[row.ingredient_id] || 0;
      const missingGrams = Math.max(requiredGrams - availableGrams, 0);

      let status;
      if (availableGrams === 0) {
        status = 'MISSING';
      } else if (availableGrams < requiredGrams) {
        status = 'INSUFFICIENT';
      } else {
        status = 'AVAILABLE';
      }

      if (row.priority === 'CORE' && status !== 'AVAILABLE') {
        coreComplete = false;
      }

      // Nutrition contribution
      const ratio = requiredGrams / 100;
      totalCalories += ratio * parseFloat(row.calories_per_100g);
      totalProtein += ratio * parseFloat(row.protein_per_100g);
      totalCarbs += ratio * parseFloat(row.carbs_per_100g);
      totalFat += ratio * parseFloat(row.fat_per_100g);

      ingredients.push({
        ingredient_id: row.ingredient_id,
        name: row.name,
        required_grams: requiredGrams,
        priority: row.priority,
        available_grams: availableGrams,
        status: status,
        missing_grams: missingGrams,
        nutrition_per_100g: {
          calories: parseFloat(row.calories_per_100g),
          protein: parseFloat(row.protein_per_100g),
          carbs: parseFloat(row.carbs_per_100g),
          fat: parseFloat(row.fat_per_100g),
        },
      });
    }

    // Sort ingredients: CORE first, then SUPPORTING, then OPTIONAL; alphabetically within each
    ingredients.sort((a, b) => {
      const pDiff = PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority];
      if (pDiff !== 0) return pDiff;
      return a.name.localeCompare(b.name);
    });

    // 6. Calculate nutrition per serving
    const servings = recipe.servings;
    const perServing = {
      calories: totalCalories / servings,
      protein: totalProtein / servings,
      carbs: totalCarbs / servings,
      fat: totalFat / servings,
    };

    // 7. Calculate macro fit score (reuse Phase 3 helper)
    const macroFitScore = calculateMacroFit(perServing, targets);

    // 8. Determine availability
    const availabilityGroup = coreComplete ? 'FULLY_AVAILABLE' : 'PARTIALLY_AVAILABLE';

    // 9. Generate shopping suggestions
    const shoppingSuggestions = ingredients
      .filter((ing) => ing.status !== 'AVAILABLE')
      .map((ing) => ({
        ingredient_id: ing.ingredient_id,
        ingredient: ing.name,
        priority: ing.priority,
        suggested_purchase_grams: ing.missing_grams,
      }));

    // Sort shopping suggestions by priority
    shoppingSuggestions.sort((a, b) => PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority]);

    return res.json({
      recipe: {
        id: recipe.id,
        name: recipe.name,
        servings: recipe.servings,
        instructions: recipe.instructions,
      },
      availability: {
        group: availabilityGroup,
        core_complete: coreComplete,
      },
      ingredients,
      nutrition: {
        total: {
          calories: Math.round(totalCalories * 100) / 100,
          protein: Math.round(totalProtein * 100) / 100,
          carbs: Math.round(totalCarbs * 100) / 100,
          fat: Math.round(totalFat * 100) / 100,
        },
        per_serving: {
          calories: Math.round(perServing.calories * 100) / 100,
          protein: Math.round(perServing.protein * 100) / 100,
          carbs: Math.round(perServing.carbs * 100) / 100,
          fat: Math.round(perServing.fat * 100) / 100,
        },
      },
      user_macro_targets: {
        calories: parseFloat(targets.target_calories) || 0,
        protein: parseFloat(targets.target_protein) || 0,
        carbs: parseFloat(targets.target_carbs) || 0,
        fat: parseFloat(targets.target_fat) || 0,
      },
      macro_fit_score: Math.round(macroFitScore * 100) / 100,
      shopping_suggestions: shoppingSuggestions,
    });

  } catch (err) {
    console.error('Get recipe details error:', err.message);
    return res.status(500).json({ error: 'Internal server error.' });
  }
}

module.exports = { matchRecipes, listRecipes, getRecipeDetails };
