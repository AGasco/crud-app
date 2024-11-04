const express = require('express');
const Joi = require('joi');
const User = require('../models/user');
const auth = require('../middleware/auth');
const authorizeRoles = require('../middleware/role');
const getUser = require('../middleware/getUser');

const router = express.Router();

const userSchema = Joi.object({
  username: Joi.string().min(3).required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(6),
  role: Joi.string().valid('user', 'admin')
});

router.use(auth);

/**
 * @route   GET /api/users
 * @desc    Get all users
 * @access  Private - Restricted to admin users
 */
router.get('/', authorizeRoles('admin'), async (req, res) => {
  try {
    const users = await User.find().select('-password').sort({ createdAt: -1 });
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/**
 * @route   GET /api/users/:id
 * @desc    Get a single user by ID
 * @access  Private - Users can access their own data, admins can access any
 */
router.get('/:id', getUser, (req, res) => {
  res.json(res.user);
});

/**
 * @route   PUT /api/users/:id
 * @desc    Update a user
 * @access  Private - Users can update their own profiles, admins can update any
 */
router.put('/:id', getUser, async (req, res) => {
  const { error } = userSchema.validate(req.body);
  if (error) return res.status(400).json({ message: error.details[0].message });

  const { username, email, password } = req.body;

  try {
    if (username !== undefined) res.user.username = username;
    if (email !== undefined) res.user.email = email;
    if (password !== undefined) res.user.password = password;

    if (role && req.user.role === 'admin') {
      res.user.role = role;
    }

    const updatedUser = await res.user.save();
    res.json({
      id: updatedUser._id,
      username: updatedUser.username,
      email: updatedUser.email,
      role: updatedUser.role,
      createdAt: updatedUser.createdAt,
      updatedAt: updatedUser.updatedAt
    });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

/**
 * @route   DELETE /api/users/:id
 * @desc    Delete a user
 * @access  Private - Users can delete their own accounts, admins can delete any
 */
router.delete('/:id', getUser, async (req, res) => {
  try {
    await res.user.remove();
    res.json({ message: 'User deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
