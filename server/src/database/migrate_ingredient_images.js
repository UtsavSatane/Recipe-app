const pool = require('../db');

async function migrateIngredientImages() {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Add image_url column if it doesn't exist
    await client.query(`
      ALTER TABLE ingredients
      ADD COLUMN IF NOT EXISTS image_url TEXT;
    `);

    // Update existing ingredients with image URLs
    const imageUpdates = [
      { name: 'Chicken Breast', image_url: 'https://images.unsplash.com/photo-1604503468506-a8da13d82791?w=100&h=100&fit=crop' },
      { name: 'White Rice', image_url: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=100&h=100&fit=crop' },
      { name: 'Brown Rice', image_url: 'https://images.unsplash.com/photo-1536304929831-ee1ca9d44906?w=100&h=100&fit=crop' },
      { name: 'Broccoli', image_url: 'https://images.unsplash.com/photo-1459411621453-7b03977f4bfc?w=100&h=100&fit=crop' },
      { name: 'Eggs', image_url: 'https://images.unsplash.com/photo-1582722872445-44dc5f7e3c8f?w=100&h=100&fit=crop' },
      { name: 'Egg Whites', image_url: 'https://images.unsplash.com/photo-1582722872445-44dc5f7e3c8f?w=100&h=100&fit=crop' },
      { name: 'Oats', image_url: 'https://images.unsplash.com/photo-1610725664285-7c57e6eeac3f?w=100&h=100&fit=crop' },
      { name: 'Whey Protein', image_url: 'https://images.unsplash.com/photo-1593095948071-474c5cc2989d?w=100&h=100&fit=crop' },
      { name: 'Greek Yogurt', image_url: 'https://images.unsplash.com/photo-1488477181946-6428a0291777?w=100&h=100&fit=crop' },
      { name: 'Milk', image_url: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=100&h=100&fit=crop' },
      { name: 'Banana', image_url: 'https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?w=100&h=100&fit=crop' },
      { name: 'Apple', image_url: 'https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?w=100&h=100&fit=crop' },
      { name: 'Potato', image_url: 'https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=100&h=100&fit=crop' },
      { name: 'Sweet Potato', image_url: 'https://images.unsplash.com/photo-1596097635121-14b63b7a0c19?w=100&h=100&fit=crop' },
      { name: 'Spinach', image_url: 'https://images.unsplash.com/photo-1576045057995-568f588f82fb?w=100&h=100&fit=crop' },
      { name: 'Carrot', image_url: 'https://images.unsplash.com/photo-1598170845058-32b9d6a5da37?w=100&h=100&fit=crop' },
      { name: 'Tomato', image_url: 'https://images.unsplash.com/photo-1546094096-0df4bcaaa337?w=100&h=100&fit=crop' },
      { name: 'Onion', image_url: 'https://images.unsplash.com/photo-1518977956812-cd3dbadaaf31?w=100&h=100&fit=crop' },
      { name: 'Bell Pepper', image_url: 'https://images.unsplash.com/photo-1563565375-f3fdfdbefa83?w=100&h=100&fit=crop' },
      { name: 'Olive Oil', image_url: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=100&h=100&fit=crop' },
      { name: 'Peanut Butter', image_url: 'https://images.unsplash.com/photo-1582176604856-e824b4736522?w=100&h=100&fit=crop' },
      { name: 'Almonds', image_url: 'https://images.unsplash.com/photo-1508061253366-f7da158b6d46?w=100&h=100&fit=crop' },
      { name: 'Tuna', image_url: 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?w=100&h=100&fit=crop' },
      { name: 'Salmon', image_url: 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?w=100&h=100&fit=crop' },
      { name: 'Paneer', image_url: 'https://images.unsplash.com/photo-1631452180519-c014fe946bc7?w=100&h=100&fit=crop' },
    ];

    for (const update of imageUpdates) {
      await client.query(
        'UPDATE ingredients SET image_url = $1 WHERE name = $2',
        [update.image_url, update.name]
      );
    }

    await client.query('COMMIT');
    console.log('Ingredient images migration completed successfully.');
    console.log(`Updated ${imageUpdates.length} ingredients with image URLs.`);

  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Migration failed:', err.message);
    process.exitCode = 1;
  } finally {
    client.release();
    await pool.end();
  }
}

migrateIngredientImages();
