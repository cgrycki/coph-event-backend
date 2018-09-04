/**
 * Layout schema for DynamoDB
 */
const Joi             = require('joi');
const jNum            = Joi.number().required();
const furniture_types = ['chair', 'circle', 'cocktail', 'rect', 'display', 'trash'];



/** Schema for furniture counts and 'Heads Up Display'. */
const countSchema = Joi.object().keys({
  chairs_per_table  : jNum.allow([6, 8]).default(6),
  num_chairs        : jNum.default(0),
  num_chair_racks   : jNum.default(0),
  num_circles       : jNum.default(0),
  num_circle_racks  : jNum.default(0),
  num_rects         : jNum.default(0),
  num_rect_racks    : jNum.default(0),
  num_cocktails     : jNum.default(0),
  num_cocktail_racks: jNum.default(0),
  num_displays      : jNum.default(0),
  num_trashs        : jNum.default(0)
});

/** Schema for a single furniture item object, all fields required. */
const furnitureItemSchema = Joi.object().keys({
  x   : Joi.number().min(0).max(3000).required(),
  y   : Joi.number().min(0).max(3000).required(),
  id  : Joi.string().alphanum().required(),
  furn: Joi.string().valid(furniture_types).required()
});

/** Schema for furniture items array, empty or filled with furniture items AND unique IDs. */
const furnitureItemsSchema = Joi.array().required().min(0).items(furnitureItemSchema).unique('id');

/** Schema for the complete layout object. Package ID is not constrained to number because we have public layouts too. */
const layoutSchema = Joi.object().keys({
  id   : Joi.string().required(),
  count: countSchema.required(),
  items: furnitureItemsSchema
});


const assignID = context => context.package_id.toString();
assignID.description = 'Assign ID or package_id';

const newLayoutSchema = Joi.object().when('package_id', {
  is: Joi.any(),
  then: Joi.object({
    id        : Joi.string().default(assignID),
    package_id: Joi.number().required(),
    user_email: Joi.string().email().required(),
    type      : Joi.string().valid('private'),
    items     : furnitureItemsSchema
  }),
  otherwise: Joi.object({
    id        : Joi.string().required(),
    package_id: Joi.number().optional(),
    user_email: Joi.string().email().optional(),
    type      : Joi.string().valid('private'),
    items     : furnitureItemsSchema
  })
});


module.exports = {
  countSchema,
  furnitureItemSchema,
  furnitureItemsSchema,
  layoutSchema,
  newLayoutSchema
};
