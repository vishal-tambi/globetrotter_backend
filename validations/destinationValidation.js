const Joi = require('joi');

const clueSchema = Joi.object({
  text: Joi.string().required().min(10).max(200),
  difficulty: Joi.number().integer().min(1).max(3).default(2)
});

const factSchema = Joi.object({
  text: Joi.string().required().min(20).max(500),
  category: Joi.string().valid('history', 'culture', 'nature', 'fun').default('fun')
});

const destinationSchema = Joi.object({
  name: Joi.string().required().min(3).max(100),
  country: Joi.string().required().min(3).max(50),
  continent: Joi.string().required().valid(
    'Africa', 'Antarctica', 'Asia', 'Europe', 
    'North America', 'Oceania', 'South America'
  ),
  clues: Joi.array().items(clueSchema).min(3).max(10).required(),
  facts: Joi.array().items(factSchema).min(5).max(15).required(),
  imageQuery: Joi.string().required().min(5),
  verified: Joi.boolean().default(false),
  popularity: Joi.number().integer().min(1).max(5).default(3)
});

function validateDestination(data) {
  return destinationSchema.validate(data, { abortEarly: false });
}

module.exports = {
  validateDestination
};