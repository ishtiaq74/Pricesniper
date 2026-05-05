const jwt = require('jsonwebtoken');
const User = require('../models/User');

// ── Helper: sign a JWT for a user ID ────────────────────────────────────────
const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });

// ---------------------------------------------------------------------------
// Controller – Register a new user
// POST /api/auth/register
// Body: { name, email, password }
// ---------------------------------------------------------------------------
const register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email and password are required' });
    }

    const existing = await User.findOne({ email: email.toLowerCase().trim() });
    if (existing) {
      return res.status(409).json({ message: 'An account with that email already exists' });
    }

    const user = await User.create({ name, email, password });
    const token = signToken(user._id);

    res.status(201).json({
      token,
      user: { _id: user._id, name: user.name, email: user.email },
    });
  } catch (error) {
    console.error('register error:', error.message);
    res.status(500).json({ message: 'Registration failed', error: error.message });
  }
};

// ---------------------------------------------------------------------------
// Controller – Login an existing user
// POST /api/auth/login
// Body: { email, password }
// ---------------------------------------------------------------------------
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    // Explicitly select password since the field has select:false
    const user = await User.findOne({ email: email.toLowerCase().trim() }).select('+password');
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const token = signToken(user._id);

    res.status(200).json({
      token,
      user: { _id: user._id, name: user.name, email: user.email },
    });
  } catch (error) {
    console.error('login error:', error.message);
    res.status(500).json({ message: 'Login failed', error: error.message });
  }
};

// ---------------------------------------------------------------------------
// Controller – Get current user profile (protected)
// GET /api/auth/me
// ---------------------------------------------------------------------------
const getMe = async (req, res) => {
  res.status(200).json({
    user: { _id: req.user._id, name: req.user.name, email: req.user.email },
  });
};

module.exports = { register, login, getMe };
