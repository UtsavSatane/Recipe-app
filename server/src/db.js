const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: process.env.PGHOST || 'localhost',
  port: parseInt(process.env.PGPORT, 10) || 5432,
  database: process.env.PGDATABASE || 'recipe_app',
  user: process.env.PGUSER || 'postgres',
  password: process.env.PGPASSWORD,
});

module.exports = pool;
