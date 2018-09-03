/**
 * Layout Utilities: middleware functions mapping HTTP requests to our REST 
 * classes and DynamoDB models. Includes validation and error catching.
 */


/* Dependencies -------------------------------------------------------------*/
const LayoutModel       = require('./layout.model');
const { layoutSchema }  = require('./layout.schema');



function validateLayout(request, response, next) {
  // Get layout information from JSON body
  let layout_info = { ...request.body.layout };
  let { error, value } = layoutSchema.validate(layout_info, {abortEarly: false});

  // Return the error if the layout info is not valid
  if (error !== null) return response.status(400).json({ error, layout_info });
  else next();
}


async function getLayoutMiddleware(request, response, next) {}


async function postLayoutMiddleware(request, response, next) {}


async function patchLayoutMiddleware(request, response, next) {}


async function deleteLayoutMiddleware(request, response, next) {}


module.exports = {
  validateLayout,
  getLayoutMiddleware,
  postLayoutMiddleware,
  patchLayoutMiddleware,
  deleteLayoutMiddleware
}