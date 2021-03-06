/**
 * Event Information Schemas for DynamoDB
 * @module events/EventSchema
 * @requires joi
 */

const Joi           = require('joi');
const options_time  = require('../utils/time.constants');


// BASE --------------------------------------------------------------------*/
const jString = Joi.string();
const jBool   = Joi.boolean().required();
const email   = jString.allow("").email();
const dateReg = Joi.string()
  .regex(/^\d{4}\-(0[1-9]|1[012])\-(0[1-9]|[12][0-9]|3[01])$/)
  .required();
const time    = jString.allow(options_time).required();


// SCHEMA + CASES ------------------------------------------------------------*/
const package_id    = Joi.number().integer().allow(null);
// Approved is actually a boolean, but we cast it to string because DynamoDB 
// has weird attribute types for it's indices
const approved      = Joi.string().optional().allow(["true", "void", "false"]).default("false");
const user_email    = email.regex(/uiowa\.edu$/).required();
const contact_email = email;
const coph_email    = email.regex(/uiowa\.edu$/).default("");
const event_name    = jString.min(5).max(75).trim().required();
const comments      = jString.allow("").max(3000).required();
const room_number   = jString.alphanum().max(10).required();
const num_people    = Joi.number().min(1).max(206).required();


/**
 * MAUI Course Schema
 * @type {object}
 * @constant
 * @alias module:events/EventSchema.courseSchema
 */
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


/**
 * MFK Accounting Schema
 * @type {object}
 * @constant
 * @alias module:events/EventSchema.setup_mfk
 */
const setup_mfk = Joi.object().keys({
  setup_required: jBool,
  setup_mfk: Joi.object()
    .keys({
      FUND    : jString.allow(''),
      ORG     : jString.allow(''),
      DEPT    : jString.allow(''),
      SUBDEPT : jString.allow(''),
      GRANT   : jString.allow(''),
      INSTACCT: jString.allow(''),
      ORGACCT : jString.allow(''),
      DEPTACCT: jString.allow(''),
      FUNC    : jString.allow(''),
      COSTCNTR: jString.allow(''),
    })
    .when('setup_required', {
      is: true,
      then: Joi.object({
        FUND    : jString.required().length(3),
        ORG     : jString.required().length(2),
        DEPT    : jString.required().length(4),
        SUBDEPT : jString.optional().length(5),
        GRANT   : jString.optional().length(8),
        INSTACCT: jString.optional().length(4),
        ORGACCT : jString.optional().length(3),
        DEPTACCT: jString.optional().length(5),
        FUNC    : jString.required().length(2),
        COSTCNTR: jString.optional().length(4)
      })
    })
});




/**
 * Event Schema for DynamoDB Model
 * @type {object}
 * @const
 * @alias module:events/EventSchema.ModelSchema
 */
const ModelSchema = {
  // Workflow attributes
  // hashKey 'package_id' Added in the DynamoDB definition, so that we can
  // validate objects before they're POSTed to Workflow
  approved    : approved,

  // Contact information
  user_email   : user_email,
  contact_email: contact_email,
  coph_email   : coph_email,

  // Event information
  event_name : event_name,
  comments   : comments,
  date       : dateReg,
  start_time : time,
  end_time   : time,
  room_number: room_number,
  num_people : num_people,

  // Auxillary information
  references_course   : jBool,
  referenced_course   : jString.allow("").required(),

  food_drink_required : jBool,
  food_provider       : jString.allow("").required(),
  alcohol_provider    : jString.allow("").required(),

  setup_required      : jBool,
  setup_mfk: Joi.object()
    .keys({
      FUND    : jString.allow(''),
      ORG     : jString.allow(''),
      DEPT    : jString.allow(''),
      SUBDEPT : jString.allow(''),
      GRANT   : jString.allow(''),
      INSTACCT: jString.allow(''),
      ORGACCT : jString.allow(''),
      DEPTACCT: jString.allow(''),
      FUNC    : jString.allow(''),
      COSTCNTR: jString.allow(''),
    })
    .when('setup_required', {
      is: true,
      then: Joi.object({
        FUND    : jString.required().length(3),
        ORG     : jString.required().length(2),
        DEPT    : jString.required().length(4),
        SUBDEPT : jString.allow('').optional().length(5),
        GRANT   : jString.allow('').optional().length(8),
        INSTACCT: jString.allow('').optional().length(4),
        ORGACCT : jString.allow('').optional().length(3),
        DEPTACCT: jString.allow('').optional().length(5),
        FUNC    : jString.required().length(2),
        COSTCNTR: jString.allow('').optional().length(4)
      })
    })
};


exports.package_id    = package_id;
exports.user_email    = user_email;
exports.contact_email = contact_email;
exports.coph_email    = coph_email;
exports.date          = dateReg;
exports.time          = time;
exports.comments      = comments;
exports.num_people    = num_people;
exports.course        = course;
exports.approved      = approved;
exports.ModelSchema   = ModelSchema;
exports.setup_mfk     = setup_mfk;