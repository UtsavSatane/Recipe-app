const pool = require('../db');

async function migratePriority() {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // 1. Create enum type if it doesn't exist
    await client.query(`
      DO $$
      BEGIN
          IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'ingredient_priority') THEN
              CREATE TYPE ingredient_priority AS ENUM ('CORE', 'SUPPORTING', 'OPTIONAL');
          END IF;
      END
      $$;
    `);

    // 2. Add priority column if it doesn't exist
    await client.query(`
      ALTER TABLE recipe_ingredients
      ADD COLUMN IF NOT EXISTS priority ingredient_priority;
    `);

    // 3. Set default priority for existing rows
    await client.query(`
      UPDATE recipe_ingredients
      SET priority = 'SUPPORTING'
      WHERE priority IS NULL;
    `);

    // 4. Make column NOT NULL
    await client.query(`
      ALTER TABLE recipe_ingredients
      ALTER COLUMN priority SET NOT NULL;
    `);

    // 5. Update priorities based on recipe + ingredient combinations
    const priorityUpdates = [
      // Recipe 1 — Chicken Rice Bowl
      { recipe: 'Chicken Rice Bowl', ingredient: 'Chicken Breast', priority: 'CORE' },
      { recipe: 'Chicken Rice Bowl', ingredient: 'White Rice', priority: 'CORE' },
      { recipe: 'Chicken Rice Bowl', ingredient: 'Broccoli', priority: 'SUPPORTING' },
      { recipe: 'Chicken Rice Bowl', ingredient: 'Olive Oil', priority: 'OPTIONAL' },

      // Recipe 2 — High Protein Oats
      { recipe: 'High Protein Oats', ingredient: 'Oats', priority: 'CORE' },
      { recipe: 'High Protein Oats', ingredient: 'Milk', priority: 'CORE' },
      { recipe: 'High Protein Oats', ingredient: 'Whey Protein', priority: 'CORE' },
      { recipe: 'High Protein Oats', ingredient: 'Banana', priority: 'SUPPORTING' },

      // Recipe 3 — Chicken and Broccoli
      { recipe: 'Chicken and Broccoli', ingredient: 'Chicken Breast', priority: 'CORE' },
      { recipe: 'Chicken and Broccoli', ingredient: 'Broccoli', priority: 'CORE' },
      { recipe: 'Chicken and Broccoli', ingredient: 'Onion', priority: 'SUPPORTING' },
      { recipe: 'Chicken and Broccoli', ingredient: 'Olive Oil', priority: 'OPTIONAL' },

      // Recipe 4 — Protein Pancakes
      { recipe: 'Protein Pancakes', ingredient: 'Oats', priority: 'CORE' },
      { recipe: 'Protein Pancakes', ingredient: 'Eggs', priority: 'CORE' },
      { recipe: 'Protein Pancakes', ingredient: 'Egg Whites', priority: 'CORE' },
      { recipe: 'Protein Pancakes', ingredient: 'Whey Protein', priority: 'CORE' },
      { recipe: 'Protein Pancakes', ingredient: 'Banana', priority: 'SUPPORTING' },

      // Recipe 5 — Paneer Rice Bowl
      { recipe: 'Paneer Rice Bowl', ingredient: 'Paneer', priority: 'CORE' },
      { recipe: 'Paneer Rice Bowl', ingredient: 'Brown Rice', priority: 'CORE' },
      { recipe: 'Paneer Rice Bowl', ingredient: 'Onion', priority: 'SUPPORTING' },
      { recipe: 'Paneer Rice Bowl', ingredient: 'Bell Pepper', priority: 'SUPPORTING' },
      { recipe: 'Paneer Rice Bowl', ingredient: 'Olive Oil', priority: 'OPTIONAL' },

      // Recipe 6 — Tuna Sandwich
      { recipe: 'Tuna Sandwich', ingredient: 'Tuna', priority: 'CORE' },
      { recipe: 'Tuna Sandwich', ingredient: 'Greek Yogurt', priority: 'SUPPORTING' },
      { recipe: 'Tuna Sandwich', ingredient: 'Tomato', priority: 'SUPPORTING' },
      { recipe: 'Tuna Sandwich', ingredient: 'Onion', priority: 'SUPPORTING' },

      // Recipe 7 — Greek Yogurt Protein Bowl
      { recipe: 'Greek Yogurt Protein Bowl', ingredient: 'Greek Yogurt', priority: 'CORE' },
      { recipe: 'Greek Yogurt Protein Bowl', ingredient: 'Whey Protein', priority: 'CORE' },
      { recipe: 'Greek Yogurt Protein Bowl', ingredient: 'Apple', priority: 'SUPPORTING' },
      { recipe: 'Greek Yogurt Protein Bowl', ingredient: 'Almonds', priority: 'SUPPORTING' },

      // Recipe 8 — Salmon Sweet Potato Bowl
      { recipe: 'Salmon Sweet Potato Bowl', ingredient: 'Salmon', priority: 'CORE' },
      { recipe: 'Salmon Sweet Potato Bowl', ingredient: 'Sweet Potato', priority: 'CORE' },
      { recipe: 'Salmon Sweet Potato Bowl', ingredient: 'Spinach', priority: 'SUPPORTING' },
      { recipe: 'Salmon Sweet Potato Bowl', ingredient: 'Olive Oil', priority: 'OPTIONAL' },
    ];

    for (const update of priorityUpdates) {
      await client.query(
        `UPDATE recipe_ingredients ri
         SET priority = $1::ingredient_priority
         FROM recipes r, ingredients i
         WHERE ri.recipe_id = r.id
           AND ri.ingredient_id = i.id
           AND r.name = $2
           AND i.name = $3`,
        [update.priority, update.recipe, update.ingredient]
      );
    }

    await client.query('COMMIT');
    console.log('Priority migration completed successfully.');

  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Priority migration failed:', err.message);
    process.exitCode = 1;
  } finally {
    client.release();
    await pool.end();
  }
}

migratePriority();
