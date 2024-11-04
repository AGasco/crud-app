const Plant = require('../models/Plant');

/**
 * @desc Middleware to get plant by ID and ensure proper authorization
 */
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

  if (plant.userId.toString() !== req.user.id && req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Access denied.' });
  }

  res.plant = plant;
  next();
}

module.exports = getPlant;
