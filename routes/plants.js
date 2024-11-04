const express = require('express');
const Joi = require('joi');
const User = require('../models/user');
const Plant = require('../models/plant');

const router = express.Router();

const plantSchema = Joi.object({
  userId: Joi.string().required(),
  name: Joi.string().min(3).required(),
  species: Joi.string().min(3).required(),
  positionX: Joi.number().allow(null),
  positionY: Joi.number().allow(null),
  status: Joi.string().valid('garden', 'vault').default('vault'),
  imageUrl: Joi.string().uri().required()
});

// @route   GET /api/plants
// @desc    Get all plants (optionally filter by userId)
router.get('/', async (req, res) => {
  try {
    const { userId } = req.query;
    let filter = {};
    if (userId) {
      filter.userId = userId;
    }

    const plants = await Plant.find(filter).sort({ createdAt: -1 });
    res.json(plants);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @route   GET /api/plants/:id
// @desc    Get a single plant by ID
router.get('/:id', getPlant, (req, res) => {
  res.json(res.plant);
});

// @route   POST /api/plants
// @desc    Create a new plant (planting)
router.post('/', async (req, res) => {
  const { error } = plantSchema.validate(req.body);
  if (error) return res.status(400).json({ message: error.details[0].message });

  const { userId, name, species, positionX, positionY, status, imageUrl } =
    req.body;

  try {
    const user = await User.findById(userId);

    if (!user)
      return res
        .status(400)
        .json({ message: 'Invalid userId. User does not exist.' });

    const plant = new Plant({
      userId,
      name,
      species,
      positionX,
      positionY,
      status,
      imageUrl
    });

    const newPlant = await plant.save();
    res.status(201).json(newPlant);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// @route   PUT /api/plants/:id
// @desc    Update a plant (e.g., moving or editing details)
router.put('/:id', getPlant, async (req, res) => {
  const { name, species, positionX, positionY, status, imageUrl } = req.body;

  if (name !== undefined) res.plant.name = name;
  if (species !== undefined) res.plant.species = species;
  if (positionX !== undefined) res.plant.positionX = positionX;
  if (positionY !== undefined) res.plant.positionY = positionY;
  if (status !== undefined) res.plant.status = status;
  if (imageUrl !== undefined) res.plant.imageUrl = imageUrl;

  try {
    const updatedPlant = await res.plant.save();
    res.json(updatedPlant);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// @route   DELETE /api/plants/:id
// @desc    Delete a plant
router.delete('./:id', getPlant, async (req, res) => {
  try {
    await res.plant.remove();
    res.json({ message: 'Plant deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

async function getPlant(req, res, next) {
  let plant;

  try {
    plant = await Plant.findById(req.params.id);
    if (!plant) {
      return res.status(404).json({ message: 'Plant not found.' });
    }
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }

  res.plant = plant;
  next();
}
