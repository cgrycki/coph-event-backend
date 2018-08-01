/* model testing */
const Joi = require("joi");


var schema = Joi.object().options({ abortEarly: false }).keys({
  // Workflow
  package_id       : Joi.number().required(),

  // Contact information
  user_email       : Joi.string().email().regex(/uiowa\.edu$/).required(),
  contact_email    : Joi.string().email(),
  coph_email       : Joi.string().email().regex(/uiowa\.edu$/),

  // Event information
  event_name       : Joi.string().min(3).max(75).trim().required(),
  comments         : Joi.string().trim().max(3000).default(""),
  date             : Joi.date().iso().required(),
  start_time       : Joi.string().trim().min(7).max(8).required(),
  end_time         : Joi.string().trim().min(7).max(8).required(),
  room_number      : Joi.string().alphanum().required(),
  num_people       : Joi.number().min(1).max(206).required().default(1),

  // Auxillary information
  references_course: Joi.boolean().required().default(false),
  referenced_course: Joi.string().default("").when("references_course", {
      is: true,
      then: Joi.string().required()
  }),

  setup_required: Joi.boolean().required().default(false),
  setup_mfk     : Joi.string().alphanum().allow("").when("setup_required", {
    is  : true,
    then: Joi.string().alphanum().required()
  }),

  food_drink_required: Joi.boolean().required().default(false),
  food_provider      : Joi.string().trim().default("").when("food_drink_required", {
    is: true,
    then: Joi.string().min(5)
  }),
  alcohol_provider   : Joi.string().trim().default("").when("food_drink_required", {
    is: true,
    then: Joi.string().min(5)
  })
});

// When food_drink are 
var alternate_schemas = Joi.alternatives([
  schema.with('food_drink_required', 'food_provider'),
  schema.with('food_drink_required', 'alcohol_provider')
]);



var fauxStore = {
  package_id         : 1,
  user_email         : "testing@uiowa.edu",
  contact_email      : "event@planning.com",
  coph_email         : "cgrycki@uiowa.edu",
  event_name         : "Curing Cancer",
  comments           : "         Please add all of your tables and chairs to the atrium, then tear them down again.         ",
  date               : "2018-08-20",
  start_time         : "8:30 AM",
  end_time           : "12:00 PM",
  room_number        : "XC100",
  num_people         : 50,
  references_course  : true,
  referenced_course  : "Introduction to Public Health",
  setup_required     : false,
  setup_mfk          : "",
  food_drink_required: false
};

console.log(Joi.assert(fauxStore, schema));