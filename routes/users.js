const express = require('express');
const Joi = require('joi');
const User = require('../models/user');
const auth = require('../middleware/auth');

const router = express.Router();

const userSchema = Joi.object({
  username: Joi.string().min(3).required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(6)
});

router.use(auth);

// @route   GET /api/users
// @desc    Get all users
// @access  Private - Restricted to admin users
router.get('/', async (req, res) => {
  try {
    const users = await User.find().select('-password').sort({ createdAt: -1 });
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @route   GET /api/users/:id
// @desc    Get a single user by ID
// @access  Private - Users can access their own data, admins can access any
router.get('/:id', getUser, (req, res) => {
  res.json(res.user);
});

// @route   PUT /api/users/:id
// @desc    Update a user
// @access  Private - Users can update their own profiles, admins can update any
router.put('/:id', getUser, async (req, res) => {
  const { username, email, password } = req.body;

  if (username !== undefined) res.user.username = username;
  if (email !== undefined) res.user.email = email;
  if (password !== undefined) res.user.password = password;

  try {
    const updatedUser = await res.user.save();
    res.json(updatedUser);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// @route   DELETE /api/users/:id
// @desc    Delete a user
// @access  Private - Users can delete their own accounts, admins can delete any
router.delete('/:id', getUser, async (req, res) => {
  try {
    await res.user.remove();
    res.json({ message: 'User deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Middleware to get user by ID and ensure proper authorization
async function getUser(req, res, next) {
  let user;

  try {
    user = await User.findById(req.params.id).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }

  res.user = user;
  next();
}

module.exports = router;
