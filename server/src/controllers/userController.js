const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const pool = require('../db');

const SALT_ROUNDS = 10;
const MIN_PASSWORD_LENGTH = 6;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// -------------------------------------------------------------
// POST /api/users/register
// -------------------------------------------------------------
async function register(req, res) {
  try {
    const { name, email, password } = req.body;

    // Validate required fields
    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Name is required.' });
    }
    if (!email || !email.trim()) {
      return res.status(400).json({ error: 'Email is required.' });
    }
    if (!password) {
      return res.status(400).json({ error: 'Password is required.' });
    }

    // Normalize email
    const normalizedEmail = email.trim().toLowerCase();

    // Validate email format
    if (!EMAIL_REGEX.test(normalizedEmail)) {
      return res.status(400).json({ error: 'Invalid email format.' });
    }

    // Validate password length
    if (password.length < MIN_PASSWORD_LENGTH) {
      return res.status(400).json({ error: `Password must be at least ${MIN_PASSWORD_LENGTH} characters.` });
    }

    // Check for duplicate email
    const existingUser = await pool.query(
      'SELECT id FROM users WHERE email = $1',
      [normalizedEmail]
    );
    if (existingUser.rows.length > 0) {
      return res.status(409).json({ error: 'Email already registered.' });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

    // Insert user
    const result = await pool.query(
      `INSERT INTO users (name, email, password_hash)
       VALUES ($1, $2, $3)
       RETURNING id, name, email`,
      [name.trim(), normalizedEmail, passwordHash]
    );

    const user = result.rows[0];

    return res.status(201).json({
      message: 'User registered successfully',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
    });

  } catch (err) {
    console.error('Registration error:', err.message);
    return res.status(500).json({ error: 'Internal server error.' });
  }
}

// -------------------------------------------------------------
// POST /api/users/login
// -------------------------------------------------------------
async function login(req, res) {
  try {
    const { email, password } = req.body;

    // Validate required fields
    if (!email || !email.trim()) {
      return res.status(400).json({ error: 'Email is required.' });
    }
    if (!password) {
      return res.status(400).json({ error: 'Password is required.' });
    }

    // Normalize email
    const normalizedEmail = email.trim().toLowerCase();

    // Find user by email
    const result = await pool.query(
      'SELECT id, name, email, password_hash FROM users WHERE email = $1',
      [normalizedEmail]
    );

    // Generic error message to avoid leaking whether email exists
    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const user = result.rows[0];

    // Compare password with stored hash
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    // Generate JWT
    const token = jwt.sign(
      { userId: user.id },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '1d' }
    );

    return res.json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
    });

  } catch (err) {
    console.error('Login error:', err.message);
    return res.status(500).json({ error: 'Internal server error.' });
  }
}

// -------------------------------------------------------------
// PUT /api/users/me/goals
// -------------------------------------------------------------
async function updateMacroGoals(req, res) {
  try {
    const { target_calories, target_protein, target_carbs, target_fat } = req.body;
    const userId = req.userId;

    // Validate all fields are present and not null
    if (target_calories === undefined || target_calories === null) {
      return res.status(400).json({ error: 'target_calories is required.' });
    }
    if (target_protein === undefined || target_protein === null) {
      return res.status(400).json({ error: 'target_protein is required.' });
    }
    if (target_carbs === undefined || target_carbs === null) {
      return res.status(400).json({ error: 'target_carbs is required.' });
    }
    if (target_fat === undefined || target_fat === null) {
      return res.status(400).json({ error: 'target_fat is required.' });
    }

    // Validate numeric values
    if (isNaN(Number(target_calories))) {
      return res.status(400).json({ error: 'target_calories must be a number.' });
    }
    if (isNaN(Number(target_protein))) {
      return res.status(400).json({ error: 'target_protein must be a number.' });
    }
    if (isNaN(Number(target_carbs))) {
      return res.status(400).json({ error: 'target_carbs must be a number.' });
    }
    if (isNaN(Number(target_fat))) {
      return res.status(400).json({ error: 'target_fat must be a number.' });
    }

    // Convert to numbers
    const calories = Number(target_calories);
    const protein = Number(target_protein);
    const carbs = Number(target_carbs);
    const fat = Number(target_fat);

    // Validate value ranges
    if (calories <= 0) {
      return res.status(400).json({ error: 'target_calories must be greater than 0.' });
    }
    if (protein < 0) {
      return res.status(400).json({ error: 'target_protein must be greater than or equal to 0.' });
    }
    if (carbs < 0) {
      return res.status(400).json({ error: 'target_carbs must be greater than or equal to 0.' });
    }
    if (fat < 0) {
      return res.status(400).json({ error: 'target_fat must be greater than or equal to 0.' });
    }

    // Update the authenticated user's macro goals
    const result = await pool.query(
      `UPDATE users
       SET target_calories = $1,
           target_protein = $2,
           target_carbs = $3,
           target_fat = $4,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $5
       RETURNING id, name, email, target_calories, target_protein, target_carbs, target_fat, updated_at`,
      [calories, protein, carbs, fat, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found.' });
    }

    const user = result.rows[0];

    return res.json({
      message: 'Macro goals updated successfully',
      goals: {
        target_calories: user.target_calories,
        target_protein: user.target_protein,
        target_carbs: user.target_carbs,
        target_fat: user.target_fat,
      },
    });

  } catch (err) {
    console.error('Update macro goals error:', err.message);
    return res.status(500).json({ error: 'Internal server error.' });
  }
}

module.exports = { register, login, updateMacroGoals };
