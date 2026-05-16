const { registerUser, loginUser } = require('../services/authService');
const { AppError, asyncHandler } = require('../middleware/errorHandler');

const register = asyncHandler(async (req, res) => {
  try {
    const result = await registerUser(req.body);
    res.status(201).json(result);
  } catch (error) {
    if (error.isOperational) throw error;
    throw new AppError('Registration failed', 500, true, error.message);
  }
});

const login = asyncHandler(async (req, res) => {
  try {
    const result = await loginUser(req.body);
    res.status(200).json(result);
  } catch (error) {
    if (error.isOperational) throw error;
    throw new AppError('Login failed', 500, true, error.message);
  }
});

const getMe = (req, res) => {
  res.status(200).json({
    user: { _id: req.user._id, name: req.user.name, email: req.user.email },
  });
};

module.exports = { register, login, getMe };
