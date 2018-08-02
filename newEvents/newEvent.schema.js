/**
 * Event Schema for DynamoDB
 */

const Joi = require('joi');

/* BASE --------------------------------------------------------------------*/
const string = Joi.string().allow("");
const email = Joi.string().allow("").email();
const date = Joi.date().iso().required();
const time = Joi.string().regex(/^(1[0-2]|0?[1-9]):([0-5]?[0-9])(●?[AP]M)?$/).required();





/* SCHEMA + CASES ------------------------------------------------------------*/
const user_email = email.regex(/uiowa\.edu$/).required();
const contact_email = email;
const coph_email = email.regex(/uiowa\.edu$/);




/* CASES --------------------------------------------------------------------*/
const test_cases = {
  user_email: [
    null,
    undefined,
    "",
    "test@gmail",
    "test@gmail.com",
    "test@uiowa.edu"
  ],
  contact_email: [
    null,
    undefined,
    "",
    "event@planner",
    "event@planner.com",
    "event@uiowa.edu"
  ],
  coph_email: [
    null,
    undefined,
    "",
    "test@gmail",
    "test@gmail.com",
    "test@uiowa.edu"
  ]
};






exports.user_email = user_email;
exports.contact_email = contact_email;
exports.coph_email = coph_email;