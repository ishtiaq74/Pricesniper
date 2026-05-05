const express = require('express');
const router = express.Router();
const { register, login, getMe } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

// @route   POST /api/auth/register
// @desc    Register a new user and return JWT
router.post('/register', register);

// @route   POST /api/auth/login
// @desc    Login with email/password and return JWT
router.post('/login', login);

// @route   GET  /api/auth/me
// @desc    Get logged-in user profile
// @access  Private
router.get('/me', protect, getMe);

module.exports = router;
