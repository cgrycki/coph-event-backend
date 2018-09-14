/** Layout schema for DynamoDB */
// Dependencies
const Joi             = require('joi');
const furniture_types = ['chair', 'circle', 'cocktail', 'rect', 'display', 'trash'];



/** Schema for a single furniture item object, all fields required. */
const furnitureItemSchema = Joi.object().keys({
  x   : Joi.number().min(0).max(1920).required(),
  y   : Joi.number().min(0).max(1500).required(),
  rot : Joi.number().min(0).max(360).required(),
  id  : Joi.string().alphanum().required(),
  furn: Joi.string().valid(furniture_types).required()
});


/** Schema for furniture items array, empty or filled with furniture items AND unique IDs. */
const furnitureItemsSchema = Joi.array().required().min(0).items(furnitureItemSchema).unique('id');


/** Schema for Public layouts */
const publicLayoutSchema = Joi.object().keys({
  id   : Joi.string().required(),
  type : Joi.string().optional().default('public'),
  items: furnitureItemsSchema,
  chairs_per_table: Joi.number().required().valid([6, 8])
});


/** Schema for Private layouts */
const privateLayoutSchema = Joi.object().keys({
  id: Joi.string().default(function(context) {
    return context.package_id.toString();
  }, 'Convert package id to string'),
  type            : Joi.string().default('private'),
  package_id      : Joi.number().required(),
  user_email      : Joi.string().email(),
  items           : furnitureItemsSchema,
  chairs_per_table: Joi.number().required().valid([6, 8])
});


/** Schema for DynamoDB model */
const layoutSchema = Joi.object().keys({
  id              : Joi.string().required(),
  type            : Joi.string().required().valid(['public', 'private']),
  package_id      : Joi.number().optional(),
  user_email      : Joi.string().email().optional(),
  chairs_per_table: Joi.number().required().valid([6, 8]),
  items           : furnitureItemsSchema
});



/**
 * Validates a layout, assigning layout type and casting ID if necc.
 * @param {object} layout Layout object to validate against.
 * @param [layout.id] {string} Hash Key of object, optional.
 * @param [layout.package_id] {number} Package ID of layout, if created for an event.
 * @param [layout.user_email] {string} Email of user, if created for an event.
 * @returns {object} Validation result
 * @returns {object.error} Null if valid, containing errors otherwise.
 * @returns {object.value} Input cast to correct layout shape.
 */
const layoutValidation = layout => Joi.validate(
  layout, 
  Joi.alternatives().try(publicLayoutSchema, privateLayoutSchema),
  {abortEarly: false}
);



module.exports = {
  furnitureItemSchema,
  furnitureItemsSchema,
  publicLayoutSchema,
  privateLayoutSchema,
  layoutSchema,
  layoutValidation
};