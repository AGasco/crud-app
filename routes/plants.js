const express = require('express');
const Joi = require('joi');
const User = require('../models/User');
const Plant = require('../models/Plant');
const auth = require('../middleware/auth');
const getPlant = require('../middleware/getPlant');
const {
  createPlantSchema,
  updatePlantSchema
} = require('../validators/plantValidators');

const router = express.Router();

router.use(auth);

/**
 * @route   GET /api/plants
 * @desc    Get all plants (admins get all, users get their own)
 * @access  Private
 */
router.get('/', async (req, res) => {
  try {
    let plants;
    if (req.user.role === 'admin') {
      plants = await Plant.find().sort({ createdAt: -1 });
    } else {
      plants = await Plant.find({ userId: req.user.id }).sort({
        createdAt: -1
      });
    }

    res.json(plants);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/**
 * @route   GET /api/plants/:id
 * @desc    Get a single plant by ID
 * @access  Private - Users can access their own plants, admins can access any
 */
router.get('/:id', getPlant, (req, res) => {
  res.json(res.plant);
});

/**
 * @route   POST /api/plants
 * @desc    Create a new plant (planting)
 * @access  Private
 */
router.post('/', async (req, res) => {
  const { error } = createPlantSchema.validate(req.body);
  if (error) return res.status(400).json({ message: error.details[0].message });

  const { name, species, imageUrl } = req.body;

  try {
    const plant = new Plant({
      userId: req.user.id,
      name,
      species,
      positionX: -1,
      positionY: -1,
      status: 'vault',
      imageUrl
    });

    const newPlant = await plant.save();
    res.status(201).json(newPlant);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

/**
 * @route   PUT /api/plants/:id
 * @desc    Update a plant (e.g., moving or editing details)
 * @access  Private - Users can update their own plants, admins can update any
 */
router.put('/:id', getPlant, async (req, res) => {
  const { error } = updatePlantSchema.validate(req.body);
  if (error) return res.status(400).json({ message: error.details[0].message });

  const { name, species, positionX, positionY, status, imageUrl } = req.body;

  try {
    if (name !== undefined) res.plant.name = name;
    if (species !== undefined) res.plant.species = species;
    if (positionX !== undefined) res.plant.positionX = positionX;
    if (positionY !== undefined) res.plant.positionY = positionY;
    if (status !== undefined) res.plant.status = status;
    if (imageUrl !== undefined) res.plant.imageUrl = imageUrl;

    const updatedPlant = await res.plant.save();
    res.json(updatedPlant);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

/**
 * @route   DELETE /api/plants/:id
 * @desc    Delete a plant
 * @access  Private - Users can delete their own plants, admins can delete any
 */
router.delete('/:id', getPlant, async (req, res) => {
  try {
    await res.plant.deleteOne();
    res.json({ message: 'Plant deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
