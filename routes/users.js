const express = require('express');
const Joi = require('joi');
const User = require('../models/user');

const router = express.Router();

const userSchema = Joi.object({
  username: Joi.string().min(3).required(),
  email: Joi.string().email().required()
});

// @route   GET /api/users
// @desc    Get all users
router.get('/', async (req, res) => {
  try {
    const users = await User.find().sort({ createdAt: -1 });
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @route   GET /api/users/:id
// @desc    Get a single user by ID
router.get('/:id', getUser, (req, res) => {
  res.json(res.user);
});

// @route   POST /api/users
// @desc    Create a new user
router.post('/', async (req, res) => {
  const { error } = userSchema.validate(req.body);
  if (error) return res.status(400).json({ message: error.details[0].message });

  const { username, email } = req.body;

  try {
    const existingUser = await User.findOne({ $or: [{ username }, { email }] });
    if (existingUser) {
      return res
        .status(400)
        .json({ message: 'Username or email already exists.' });
    }

    const user = new User({
      username,
      email
    });

    const newUser = await user.save();
    res.status(201).json(newUser);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// @route   PUT /api/users/:id
// @desc    Update a user
router.put('/:id', getUser, async (req, res) => {
  const { username, email } = req.body;

  if (username !== undefined) res.user.username = username;
  if (email !== undefined) res.user.email = email;

  try {
    const updatedUser = await res.user.save();
    res.json(updatedUser);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// @route   DELETE /api/users/:id
// @desc    Delete a user
router.delete('/:id', getUser, async (req, res) => {
  try {
    await res.user.remove();
    res.json({ message: 'User deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

async function getUser(req, res, next) {
  let user;

  try {
    user = await User.findById(req.params.id);
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
