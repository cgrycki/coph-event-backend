/**
 * Event Schema for DynamoDB
 */

const Joi = require('joi');
const options_time = require('../utils/time.constants');

/* BASE --------------------------------------------------------------------*/
const jString = Joi.string();
const jBool   = Joi.boolean().required();
const email   = jString.allow("").email();
const date    = Joi.date().iso().required();
const time    = jString.allow(options_time).required();


/* SCHEMA + CASES ------------------------------------------------------------*/
const package_id    = Joi.number().integer().required();
const approved      = Joi.boolean().optional().default(false);
const user_email    = email.regex(/uiowa\.edu$/).required();
const contact_email = email;
const coph_email    = email.regex(/uiowa\.edu$/).default("");
const event_name    = jString.min(5).max(75).trim().required();
const comments      = jString.allow("").max(3000).required();
const room_number   = jString.alphanum().max(10).required();
const num_people    = Joi.number().min(1).max(206).required();

const course = Joi.object().keys({
  references_course: Joi.boolean().required(),
  referenced_course: jString
    .when('references_course', {
      is  : false,
      then: jString.allow("").required()
    })
    .when('references_course', {
      is  : true,
      then: jString.min(5).required()
    })
});

const setup = Joi.object().keys({
  setup_required: jBool,
  setup_mfk     : jString
    .when('setup_required', {
      is  : false,
      then: jString.allow("").required()
    })
    .when('setup_required', {
      is  : true,
      then: jString.required()
    })
});

const ModelSchema = {
  // Workflow attributes
  //package_id Added in the DynamoDB definition, so that we can
  // validate objects before they're POSTed to Workflow
  approved    : approved,

  // Contact information
  user_email   : user_email,
  contact_email: contact_email,
  coph_email   : coph_email,

  // Event information
  event_name : event_name,
  comments   : comments,
  date       : date,
  start_time : time,
  end_time   : time,
  room_number: room_number,
  num_people : num_people,

  // Auxillary information
  references_course   : jBool,
  referenced_course   : jString.allow("").required(),

  setup_required      : jBool,
  setup_mfk           : jString.allow("").required(),

  food_drink_required : jBool,
  food_provider       : jString.allow("").required(),
  alcohol_provider    : jString.allow("").required()
};


exports.package_id    = package_id;
exports.user_email    = user_email;
exports.contact_email = contact_email;
exports.coph_email    = coph_email;
exports.date          = date;
exports.time          = time;
exports.comments      = comments;
exports.num_people    = num_people;
exports.course        = course;
exports.setup         = setup;
exports.ModelSchema   = ModelSchema;