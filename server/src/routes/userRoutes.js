const express = require('express');
const { register, login, updateMacroGoals } = require('../controllers/userController');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.put('/me/goals', authMiddleware, updateMacroGoals);

module.exports = router;
