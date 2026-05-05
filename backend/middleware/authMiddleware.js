const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * protect — Express middleware that validates a Bearer JWT.
 * Attaches the authenticated user to req.user on success.
 * Returns 401 if token is missing, invalid, or expired.
 */
const protect = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Not authorised – no token provided' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Attach user to request (without password field)
    const user = await User.findById(decoded.id).select('-password');
    if (!user) {
      return res.status(401).json({ message: 'Not authorised – user not found' });
    }

    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Not authorised – token invalid or expired' });
  }
};

module.exports = { protect };
