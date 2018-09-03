/**
 * Layout schema for DynamoDB
 */
const Joi = require('joi');
const furniture_types = ['chair', 'circle', 'cocktail', 'rect', 'display', 'trash'];


/** Schema for furniture counts and 'Heads Up Display'. */
const countSchema = Joi.object().keys({
  chairs_per_table  : Joi.number().required().allow([6, 8]).default(6),
  num_chairs        : Joi.number().required().default(0),
  num_chair_racks   : Joi.number().required().default(0),
  num_circles       : Joi.number().required().default(0),
  num_circle_racks  : Joi.number().required().default(0),
  num_rects         : Joi.number().required().default(0),
  num_rect_racks    : Joi.number().required().default(0),
  num_cocktails     : Joi.number().required().default(0),
  num_cockrail_racks: Joi.number().required().default(0),
  num_displays      : Joi.number().required().default(0),
  num_trashs        : Joi.number().required().default(0)
});

/** Schema for a single furniture item object, all fields required. */
const furnitureItemSchema = Joi.object().keys({
  x   : Joi.number().min(0).max(3000).required(),
  y   : Joi.number().min(0).max(3000).required(),
  id  : Joi.string().alphanum().required(),
  type: Joi.string().valid(furniture_types).required()
});

/** Schema for furniture items array, empty or filled with furniture items AND unique IDs. */
const furnitureItemsSchema = Joi.array().required().min(0).items(furnitureItemSchema).unique('id');

/** Schema for the complete layout object. Package ID is not constrained to number because we have public layouts too. */
const layoutSchema = Joi.object().keys({
  package_id: Joi.required(),
  count     : countSchema,
  items     : furnitureItemsSchema
});


module.exports = {
  countSchema,
  furnitureItemSchema,
  furnitureItemsSchema,
  layoutSchema
};
