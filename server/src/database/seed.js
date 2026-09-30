const pool = require('../db');

// =============================================================
// INGREDIENTS — nutritional values per 100g (development seed data)
// =============================================================
const ingredients = [
  { name: 'Chicken Breast',        calories: 165,  protein: 31.0, carbs: 0.0,  fat: 3.6,  image_url: 'https://images.unsplash.com/photo-1604503468506-a8da13d82791?w=100&h=100&fit=crop' },
  { name: 'White Rice',            calories: 130,  protein: 2.7,  carbs: 28.0, fat: 0.3,  image_url: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=100&h=100&fit=crop' },
  { name: 'Brown Rice',            calories: 123,  protein: 2.7,  carbs: 25.6, fat: 1.0,  image_url: 'https://images.unsplash.com/photo-1536304929831-ee1ca9d44906?w=100&h=100&fit=crop' },
  { name: 'Broccoli',              calories: 34,   protein: 2.8,  carbs: 7.0,  fat: 0.4,  image_url: 'https://images.unsplash.com/photo-1459411621453-7b03977f4bfc?w=100&h=100&fit=crop' },
  { name: 'Eggs',                  calories: 155,  protein: 13.0, carbs: 1.1,  fat: 11.0, image_url: 'https://images.unsplash.com/photo-1582722872445-44dc5f7e3c8f?w=100&h=100&fit=crop' },
  { name: 'Egg Whites',            calories: 52,   protein: 11.0, carbs: 0.7,  fat: 0.2,  image_url: 'https://images.unsplash.com/photo-1582722872445-44dc5f7e3c8f?w=100&h=100&fit=crop' },
  { name: 'Oats',                  calories: 389,  protein: 16.9, carbs: 66.3, fat: 6.9,  image_url: 'https://images.unsplash.com/photo-1610725664285-7c57e6eeac3f?w=100&h=100&fit=crop' },
  { name: 'Whey Protein',          calories: 400,  protein: 80.0, carbs: 8.0,  fat: 6.0,  image_url: 'https://images.unsplash.com/photo-1593095948071-474c5cc2989d?w=100&h=100&fit=crop' },
  { name: 'Greek Yogurt',          calories: 59,   protein: 10.0, carbs: 3.6,  fat: 0.4,  image_url: 'https://images.unsplash.com/photo-1488477181946-6428a0291777?w=100&h=100&fit=crop' },
  { name: 'Milk',                  calories: 42,   protein: 3.4,  carbs: 5.0,  fat: 1.0,  image_url: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=100&h=100&fit=crop' },
  { name: 'Banana',                calories: 89,   protein: 1.1,  carbs: 22.8, fat: 0.3,  image_url: 'https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?w=100&h=100&fit=crop' },
  { name: 'Apple',                 calories: 52,   protein: 0.3,  carbs: 13.8, fat: 0.2,  image_url: 'https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?w=100&h=100&fit=crop' },
  { name: 'Potato',                calories: 77,   protein: 2.0,  carbs: 17.5, fat: 0.1,  image_url: 'https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=100&h=100&fit=crop' },
  { name: 'Sweet Potato',          calories: 86,   protein: 1.6,  carbs: 20.1, fat: 0.1,  image_url: 'https://images.unsplash.com/photo-1596097635121-14b63b7a0c19?w=100&h=100&fit=crop' },
  { name: 'Spinach',               calories: 23,   protein: 2.9,  carbs: 3.6,  fat: 0.4,  image_url: 'https://images.unsplash.com/photo-1576045057995-568f588f82fb?w=100&h=100&fit=crop' },
  { name: 'Carrot',                calories: 41,   protein: 0.9,  carbs: 9.6,  fat: 0.2,  image_url: 'https://images.unsplash.com/photo-1598170845058-32b9d6a5da37?w=100&h=100&fit=crop' },
  { name: 'Tomato',                calories: 18,   protein: 0.9,  carbs: 3.9,  fat: 0.2,  image_url: 'https://images.unsplash.com/photo-1546094096-0df4bcaaa337?w=100&h=100&fit=crop' },
  { name: 'Onion',                 calories: 40,   protein: 1.1,  carbs: 9.3,  fat: 0.1,  image_url: 'https://images.unsplash.com/photo-1518977956812-cd3dbadaaf31?w=100&h=100&fit=crop' },
  { name: 'Bell Pepper',           calories: 31,   protein: 1.0,  carbs: 6.0,  fat: 0.3,  image_url: 'https://images.unsplash.com/photo-1563565375-f3fdfdbefa83?w=100&h=100&fit=crop' },
  { name: 'Olive Oil',             calories: 884,  protein: 0.0,  carbs: 0.0,  fat: 100.0,image_url: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=100&h=100&fit=crop' },
  { name: 'Peanut Butter',         calories: 588,  protein: 25.0, carbs: 20.0, fat: 50.0, image_url: 'https://images.unsplash.com/photo-1582176604856-e824b4736522?w=100&h=100&fit=crop' },
  { name: 'Almonds',               calories: 579,  protein: 21.2, carbs: 21.6, fat: 49.9, image_url: 'https://images.unsplash.com/photo-1508061253366-f7da158b6d46?w=100&h=100&fit=crop' },
  { name: 'Tuna',                  calories: 132,  protein: 28.0, carbs: 0.0,  fat: 1.0,  image_url: 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?w=100&h=100&fit=crop' },
  { name: 'Salmon',                calories: 208,  protein: 20.0, carbs: 0.0,  fat: 13.0, image_url: 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?w=100&h=100&fit=crop' },
  { name: 'Paneer',                calories: 265,  protein: 18.3, carbs: 3.6,  fat: 20.5, image_url: 'https://images.unsplash.com/photo-1631452180519-c014fe946bc7?w=100&h=100&fit=crop' },
];

// =============================================================
// RECIPES
// =============================================================
const recipes = [
  {
    name: 'Chicken Rice Bowl',
    description: 'A classic high-protein chicken and rice bowl with steamed broccoli.',
    instructions: '1. Cook white rice according to package instructions.\n2. Season chicken breast with salt and pepper.\n3. Heat olive oil in a pan over medium-high heat.\n4. Cook chicken for 6-7 minutes per side until fully cooked.\n5. Steam broccoli for 4-5 minutes.\n6. Slice chicken and serve over rice with broccoli on the side.',
    servings: 2,
    ingredients: [
      { name: 'Chicken Breast', quantity_grams: 200, priority: 'CORE' },
      { name: 'White Rice',     quantity_grams: 150, priority: 'CORE' },
      { name: 'Broccoli',       quantity_grams: 100, priority: 'SUPPORTING' },
      { name: 'Olive Oil',      quantity_grams: 10,  priority: 'OPTIONAL' },
    ],
  },
  {
    name: 'High Protein Oats',
    description: 'Creamy oatmeal boosted with whey protein and fresh banana.',
    instructions: '1. Combine oats and milk in a saucepan.\n2. Cook over medium heat for 5 minutes, stirring occasionally.\n3. Remove from heat and stir in whey protein.\n4. Top with sliced banana and serve.',
    servings: 1,
    ingredients: [
      { name: 'Oats',         quantity_grams: 80,  priority: 'CORE' },
      { name: 'Whey Protein', quantity_grams: 30,  priority: 'CORE' },
      { name: 'Milk',         quantity_grams: 200, priority: 'CORE' },
      { name: 'Banana',       quantity_grams: 100, priority: 'SUPPORTING' },
    ],
  },
  {
    name: 'Chicken and Broccoli',
    description: 'Simple and lean chicken breast with sauteed broccoli and onions.',
    instructions: '1. Cut chicken breast into bite-sized pieces.\n2. Heat olive oil in a skillet over medium heat.\n3. Add onion and cook until translucent.\n4. Add chicken and cook until no longer pink.\n5. Add broccoli and cook for 5 more minutes.\n6. Season with salt, pepper, and garlic powder.',
    servings: 2,
    ingredients: [
      { name: 'Chicken Breast', quantity_grams: 200, priority: 'CORE' },
      { name: 'Broccoli',       quantity_grams: 150, priority: 'CORE' },
      { name: 'Olive Oil',      quantity_grams: 10,  priority: 'OPTIONAL' },
      { name: 'Onion',          quantity_grams: 50,  priority: 'SUPPORTING' },
    ],
  },
  {
    name: 'Protein Pancakes',
    description: 'Fluffy protein-packed pancakes made with oats, eggs, and whey.',
    instructions: '1. Blend oats into a fine flour.\n2. In a bowl, whisk eggs and egg whites.\n3. Add oat flour, whey protein, and mashed banana. Mix until smooth.\n4. Heat a non-stick pan over medium heat.\n5. Pour batter to form pancakes.\n6. Cook 2-3 minutes per side until golden brown.',
    servings: 2,
    ingredients: [
      { name: 'Oats',         quantity_grams: 60,  priority: 'CORE' },
      { name: 'Eggs',         quantity_grams: 100, priority: 'CORE' },
      { name: 'Egg Whites',   quantity_grams: 100, priority: 'CORE' },
      { name: 'Whey Protein', quantity_grams: 30,  priority: 'CORE' },
      { name: 'Banana',       quantity_grams: 80,  priority: 'SUPPORTING' },
    ],
  },
  {
    name: 'Paneer Rice Bowl',
    description: 'A vegetarian-friendly bowl with paneer, brown rice, and bell peppers.',
    instructions: '1. Cook brown rice according to package instructions.\n2. Cut paneer into cubes.\n3. Heat olive oil in a pan over medium heat.\n4. Add onion and bell pepper, cook for 3 minutes.\n5. Add paneer cubes and cook until golden on all sides.\n6. Serve paneer and vegetables over brown rice.',
    servings: 2,
    ingredients: [
      { name: 'Paneer',        quantity_grams: 150, priority: 'CORE' },
      { name: 'Brown Rice',    quantity_grams: 150, priority: 'CORE' },
      { name: 'Bell Pepper',   quantity_grams: 80,  priority: 'SUPPORTING' },
      { name: 'Onion',         quantity_grams: 50,  priority: 'SUPPORTING' },
      { name: 'Olive Oil',     quantity_grams: 10,  priority: 'OPTIONAL' },
    ],
  },
  {
    name: 'Tuna Sandwich',
    description: 'A light and protein-rich tuna sandwich with Greek yogurt dressing.',
    instructions: '1. Drain tuna and place in a bowl.\n2. Add Greek yogurt and mix well.\n3. Finely chop tomato and onion.\n4. Add tomato and onion to the tuna mixture.\n5. Season with salt and pepper.\n6. Serve on whole grain bread or as a salad.',
    servings: 1,
    ingredients: [
      { name: 'Tuna',         quantity_grams: 120, priority: 'CORE' },
      { name: 'Greek Yogurt', quantity_grams: 50,  priority: 'SUPPORTING' },
      { name: 'Tomato',       quantity_grams: 50,  priority: 'SUPPORTING' },
      { name: 'Onion',        quantity_grams: 30,  priority: 'SUPPORTING' },
    ],
  },
  {
    name: 'Greek Yogurt Protein Bowl',
    description: 'A refreshing protein bowl with Greek yogurt, almonds, and fresh apple.',
    instructions: '1. Add Greek yogurt to a bowl.\n2. Top with whey protein and mix gently.\n3. Slice apple and arrange on top.\n4. Sprinkle almonds over the bowl.\n5. Serve immediately.',
    servings: 1,
    ingredients: [
      { name: 'Greek Yogurt', quantity_grams: 200, priority: 'CORE' },
      { name: 'Whey Protein', quantity_grams: 25,  priority: 'CORE' },
      { name: 'Almonds',      quantity_grams: 20,  priority: 'SUPPORTING' },
      { name: 'Apple',        quantity_grams: 100, priority: 'SUPPORTING' },
    ],
  },
  {
    name: 'Salmon Sweet Potato Bowl',
    description: 'Omega-3 rich salmon with roasted sweet potato and fresh spinach.',
    instructions: '1. Preheat oven to 200C (400F).\n2. Cut sweet potato into wedges, toss with olive oil.\n3. Roast sweet potato for 25 minutes.\n4. Season salmon with salt, pepper, and lemon juice.\n5. Pan-sear salmon for 4 minutes per side.\n6. Serve salmon over spinach with sweet potato wedges.',
    servings: 2,
    ingredients: [
      { name: 'Salmon',       quantity_grams: 180, priority: 'CORE' },
      { name: 'Sweet Potato', quantity_grams: 200, priority: 'CORE' },
      { name: 'Spinach',      quantity_grams: 50,  priority: 'SUPPORTING' },
      { name: 'Olive Oil',    quantity_grams: 10,  priority: 'OPTIONAL' },
    ],
  },
];

// =============================================================
// SEED LOGIC
// =============================================================
async function seed() {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // --- Insert ingredients ---
    const ingredientIds = {};
    for (const ing of ingredients) {
      const result = await client.query(
        `INSERT INTO ingredients (name, calories_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, image_url)
         VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT (name) DO UPDATE SET
           calories_per_100g = EXCLUDED.calories_per_100g,
           protein_per_100g  = EXCLUDED.protein_per_100g,
           carbs_per_100g    = EXCLUDED.carbs_per_100g,
           fat_per_100g      = EXCLUDED.fat_per_100g,
           image_url        = EXCLUDED.image_url
         RETURNING id`,
        [ing.name, ing.calories, ing.protein, ing.carbs, ing.fat, ing.image_url]
      );
      ingredientIds[ing.name] = result.rows[0].id;
    }

    // --- Insert recipes ---
    const recipeIds = {};
    for (const recipe of recipes) {
      const result = await client.query(
        `INSERT INTO recipes (name, description, instructions, servings)
         SELECT $1, $2, $3, $4
         WHERE NOT EXISTS (SELECT 1 FROM recipes WHERE name = $1)
         RETURNING id`,
        [recipe.name, recipe.description, recipe.instructions, recipe.servings]
      );

      if (result.rows.length > 0) {
        recipeIds[recipe.name] = result.rows[0].id;
      } else {
        // Recipe already exists — fetch its ID
        const existing = await client.query(
          'SELECT id FROM recipes WHERE name = $1',
          [recipe.name]
        );
        recipeIds[recipe.name] = existing.rows[0].id;
      }
    }

    // --- Insert recipe_ingredients ---
    for (const recipe of recipes) {
      const recipeId = recipeIds[recipe.name];
      for (const ing of recipe.ingredients) {
        const ingredientId = ingredientIds[ing.name];
        await client.query(
          `INSERT INTO recipe_ingredients (recipe_id, ingredient_id, quantity_grams, priority)
           VALUES ($1, $2, $3, $4::ingredient_priority)
           ON CONFLICT (recipe_id, ingredient_id) DO UPDATE SET
             quantity_grams = EXCLUDED.quantity_grams,
             priority = EXCLUDED.priority`,
          [recipeId, ingredientId, ing.quantity_grams, ing.priority]
        );
      }
    }

    await client.query('COMMIT');

    // --- Print summary ---
    const ingCount = await pool.query('SELECT COUNT(*) FROM ingredients');
    const recipeCount = await pool.query('SELECT COUNT(*) FROM recipes');
    const mappingCount = await pool.query('SELECT COUNT(*) FROM recipe_ingredients');

    console.log('Seed completed successfully.');
    console.log('');
    console.log(`Ingredients: ${ingCount.rows[0].count}`);
    console.log(`Recipes:     ${recipeCount.rows[0].count}`);
    console.log(`Mappings:    ${mappingCount.rows[0].count}`);
    console.log('');

  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Seed failed:', err.message);
    process.exitCode = 1;
  } finally {
    client.release();
    await pool.end();
  }
}

seed();
