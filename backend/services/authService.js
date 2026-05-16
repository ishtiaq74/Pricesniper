const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { JWT_SECRET, JWT_EXPIRES_IN } = require('../config/env');
const { AppError } = require('../middleware/errorHandler');

const signToken = (id) =>
  jwt.sign({ id }, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
  });

const toPublicUser = (user) => ({
  _id: user._id,
  name: user.name,
  email: user.email,
});

const registerUser = async ({ name, email, password }) => {
  if (!name || !email || !password) {
    throw new AppError('Name, email and password are required', 400);
  }

  const existing = await User.findOne({ email: email.toLowerCase().trim() });
  if (existing) {
    throw new AppError('An account with that email already exists', 409);
  }

  const user = await User.create({ name, email, password });
  const token = signToken(user._id);

  return { token, user: toPublicUser(user) };
};

const loginUser = async ({ email, password }) => {
  if (!email || !password) {
    throw new AppError('Email and password are required', 400);
  }

  const user = await User.findOne({ email: email.toLowerCase().trim() }).select('+password');
  if (!user || !(await user.comparePassword(password))) {
    throw new AppError('Invalid email or password', 401);
  }

  const token = signToken(user._id);

  return { token, user: toPublicUser(user) };
};

module.exports = { registerUser, loginUser };
