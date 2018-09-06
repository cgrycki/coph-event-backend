/**
 * Layout Utilities: middleware functions mapping HTTP requests to our REST 
 * classes and DynamoDB models. Includes validation and error catching.
 */


/* Dependencies -------------------------------------------------------------*/
const LayoutModel              = require('./layout.model');
const {layoutValidation}       = require('./layout.schema');
const {zipperEventsAndLayouts} = require('../utils');


/** Validates a layout object */
function validateLayout(request, response, next) {
  // Before we go any further, check if layout even has items
  if ((!request.body.hasOwnProperty('layout')) ||
      (!request.body.layout.hasOwnProperty('items')) ||
      (request.body.layout.items.length === 0)) return next();

  // Create object that we will validate against
  let layout_info = { items: request.body.layout.items };
  
  // Check if request came from user (private layout) to assign type
  if (!request.body.layout.id) {
    layout_info.package_id = request.package_id;
    layout_info.user_email = `${request.hawkid}@uiowa.edu`;
  } else layout_info.id    = request.body.layout.id;

  // Validate and return if response fails
  let { error, value } = layoutValidation(layout_info);
  if (error !== null) return response.status(400).json({ error, layout_info });
  else {
    // Attach the formatted layout to the request
    request.validLayout = value;
    next();
  }
}


/** Creates a new layout in DynamoDB `layouts` table. */
async function postLayoutMiddleware(request, response, next) {
  if (!request.hasOwnProperty('validLayout')) return next();

  // Get validated information passed from validateLayout()
  const layout = request.validLayout;
  try {
    const result  = await LayoutModel.postLayout(layout);
    request.items = layout.items;
    next();
  } catch (err) {
    return response.status(400).json({ error: err, layout });
  }
}


/**
 * Updates a layout object in DynamoDB table. 
 * 
 * Cases:
    Prior event HAD a layout (1 >= items.length)
      this request has 0 items => DELETE layout
      this request has 1 >= items => PATCH AND OVERWRITE

    Prior event DIDNT have a layout
      this request has 0 items => do nothing, `next()`
      this request has 1 >= items => POST
 */
async function patchLayoutMiddleware(request, response, next) {
  // Get validated information passed from validateLayout()
  const layout = request.validLayout;

  try {
    const result        = await LayoutModel.patchLayout(layout);
    request.validLayout = result;
    next();

  } catch(err) {
    return response.status(400).json({ error: err, layout: layout });
  }
}


/** Queries DyanmoDB `layouts` table for a layout object. */
async function getLayoutMiddleware(request, response, next) {
  // Middleware could be called from /layouts OR /events
  const id = request.params.id || request.params.package_id;
  
  try {
    // Result should be an array with a single object
    let result     = await LayoutModel.getLayout(id);

    // So if DDB didn't return a layout, assign an empty list
    if (result.length === 0) request.items = result;
    else request.items = result[0];

    return next();
  } catch (err) {
    return response.status(400).json({ error: err, id });
  }
}


/** Deletes a layout object with hashKey ${package_id} from DynamoDB. */
async function deleteLayoutMiddleware(request, response, next) {
  // Middleware could be called from /layouts OR /events
  const id = request.params.id || request.params.package_id;

  try {
    const result = await LayoutModel.deleteLayout(id);
    next();
  } catch(err) {
    return response.status(400).json({error: err, id: id});
  }
}


/** Queries layouts table for either user's or public layouts. */
async function getLayoutsMiddleware(request, response, next) {
  // Infer index attributes from request path
  const path_to_field = {
    "/filter/my"    : "user_email", // from layouts
    "/my"           : "user_email", // from events
    "/filter/public": "type"
  };
  const path_to_value = {
    "/filter/my"    : `${request.hawkid}@uiowa.edu`,
    "/my"           : `${request.hawkid}@uiowa.edu`,
    "/filter/public": "public"
  };

  // Make request
  const field = path_to_field[request.path];
  const value = path_to_value[request.path];

  try {
    const {layouts} = await LayoutModel.getLayouts(field, value);
    request.layouts = layouts;

    // Zipper layout and events if any events are present
    // Events are present when this middleware is called from event (private) endpoint
    // Events aren't present when calling for public events
    if ("events" in request) request.events = zipperEventsAndLayouts(request.events, layouts);

    next();
  } catch(err) {
    return response.status(400).json({error: err, field, value, path: request.path});
  }
}


module.exports = {
  validateLayout,
  getLayoutMiddleware,
  getLayoutsMiddleware,
  postLayoutMiddleware,
  patchLayoutMiddleware,
  deleteLayoutMiddleware
}