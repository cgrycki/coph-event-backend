/**
 * Event DynamoDB model
 */
/* DEPENDENCIES -------------------------------------------------------------*/
const Joi   = require('joi');
var dynamo  = require('dynamodb');
dynamo.AWS.config.update({ region: process.env.AWS_DEFAULT_REGION });


// Create table names depending on environment
const createTableName = require('../utils/index').createTableName;
const client_id       = process.env.APP_NAME;
const env_type        = process.env.EENV;
const table_name      = 'events';


/* MODEL --------------------------------------------------------------------*/
const EventModel = dynamo.define('Event', {
  // Primary keys
  hashKey : 'package_id',
  rangeKey: 'date',

  // Timestamps
  timestamps: true,

  schema: {
    // Workflow and DynamoDB primary key
    package_id       : Joi.number().required(),

    // Contact information
    user_email       : Joi.string().email().regex(/uiowa\.edu$/).required(),
    contact_email    : Joi.string().email().allow("").default(""),
    coph_email       : Joi.string().email().regex(/uiowa\.edu$/).allow("").default(""),

    // Event Information
    event_name       : Joi.string().min(3).max(75).trim().required(),
    comments         : Joi.string().trim().max(3000).allow("").default(""),
    date             : Joi.date().iso().required(),
    start_time       : Joi.string().trim().min(7).max(8).required(),
    end_time         : Joi.string().trim().min(7).max(8).required(),
    room_number      : Joi.string().alphanum().max(10).required(),
    num_people       : Joi.number().min(1).max(206).required().default(1),

    // Auxillary information
    references_course: Joi.boolean().required().default(false),
    referenced_course: Joi.string().allow("").default("").when("references_course", {
        is: true,
        then: Joi.string().required()
    }),

    setup_required: Joi.boolean().required().default(false),
    setup_mfk     : Joi.string().alphanum().allow("").default("").when("setup_required", {
      is  : true,
      then: Joi.string().alphanum().required()
    }),

    food_drink_required: Joi.boolean().required().default(false),
    food_provider      : Joi.string().trim().allow("").default("").when("food_drink_required", {
      is: true,
      then: Joi.string().min(5)
    }),
    alcohol_provider   : Joi.string().trim().allow("").default("").when("food_drink_required", {
      is: true,
      then: Joi.string().min(5)
    })
  },

  // Dynamic table names depending on our Node environment
  tableName: createTableName(client_id, env_type, table_name),

  // Indices for faster queries
  indexes: [
    {hashKey: 'package_id', rangeKey: 'user_email', name: 'EventUserIndex', type: 'global'},
    {hashKey: 'package_id', rangeKey: 'room_number', name: 'EventRoomIndex', type: 'global'}
  ]
});


module.exports = EventModel;