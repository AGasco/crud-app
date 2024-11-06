const Joi = require('joi');

const createPlantSchema = Joi.object({
  name: Joi.string().min(3).required(),
  species: Joi.string().min(3).required(),
  imageUrl: Joi.string().uri().required()
});

const updatePlantSchema = Joi.object({
  name: Joi.string().min(3),
  species: Joi.string().min(3),
  positionX: Joi.number().allow(null),
  positionY: Joi.number().allow(null),
  status: Joi.string().valid('garden', 'vault'),
  imageUrl: Joi.string().uri()
}).min(1);

module.exports = { createPlantSchema, updatePlantSchema };
