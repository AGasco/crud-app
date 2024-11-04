const User = require('../models/user');

/**
 * @desc Middleware to get user by ID and ensure proper authorization
 */
async function getUser(req, res, next) {
  let user;

  try {
    user = await User.findById(req.params.id).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found.' });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }

  if (req.user.id !== user.id && req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Access denied.' });
  }

  res.user = user;
  next();
}

module.exports = getUser;
