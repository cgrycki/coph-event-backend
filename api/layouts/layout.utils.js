/**
 * Layout Utilities: middleware functions mapping HTTP requests to our REST 
 * classes and DynamoDB models. Includes validation and error catching.
 * @module layouts/LayoutUtils
 */

// Dependencies -------------------------------------------------------------*/
const LayoutModel              = require('./layout.model');
const {layoutValidation}       = require('./layout.schema');
const {zipperEventsAndLayouts} = require('../utils');

/**
 * Stub layout for empty/invalid layouts
 * @type {object}
 * @const
 * @alias module:layouts/LayoutUtils.stub
 */
const stub = { items: [], chairs_per_table: 6 };


/**
 * Validates a layout object, as either public or private.
 * @function
 * @returns {object}
 */
function validateLayout(request, response, next) {
  // Before we go any further, check if layout even has items
  if ((!request.body.hasOwnProperty('layout')) ||
      (!request.body.layout.hasOwnProperty('items')) ||
      (request.body.layout.items.length === 0)) return next();

  // Create object that we will validate against
  let layout_info = {
    items           : request.body.layout.items,
    chairs_per_table: request.body.layout.chairs_per_table
  };
  
  // Check if request came from user (private layout) to assign type
  if (!request.body.layout.id) {
    // POST and PATCH
    const pid = (request.method === 'POST') ? request.package_id : request.params.package_id;
    layout_info.package_id = +pid;
    layout_info.id         = pid.toString();
    layout_info.user_email = `${request.hawkid}@uiowa.edu`;
  } else {
    layout_info.id    = request.body.layout.id;
  };

  // Validate and return if response fails
  const { error, value } = layoutValidation(layout_info);
  if (error !== null) return response.status(400).json({ error, layout_info });
  else {
    // Attach the formatted layout to the request
    request.validLayout = value;
    next();
  }
}


/**
 * Creates a new layout in DynamoDB `layouts` table.
 * @function
 * @returns {object}
 */
async function postLayoutMiddleware(request, response, next) {
  // Attach stub for events without a layout
  if (!request.hasOwnProperty('validLayout')) {
    request.layout = stub;
    return next();
  }

  // Get validated information passed from validateLayout()
  const layout = request.validLayout;
  try {
    const result  = await LayoutModel.postLayout(layout);
    request.layout = {
      items           : result.items,
      chairs_per_table: result.chairs_per_table
    };
    next();
  } catch (err) {
    return response.status(400).json({ error: err, layout });
  }
}


/**
 * Updates a layout object in DynamoDB table. 
 * @function
 * @returns {object}
 */
async function patchLayoutMiddleware(request, response, next) {
  // Get id of event from request, don't coerce to number because layout hashkey
  const package_id = request.params.package_id;

  // Get current request's layout information from layout validation
  const currentlayout = request.validLayout;
  
  // Keep a variable for the database operations
  let result;
  try {

    // Get current request's call to the layout table to see if this event 
    // had a layout. GET layout returns an empty array if not found
    const oldLayout = await LayoutModel.getLayout(package_id);

    // CASE 0: neither iteration of this event had furniture items => PASS
    if (currentlayout === undefined && oldLayout.length === 0) {
      request.layout = stub;
      return next();
    }

    // CASE 1: old event didn't have furniture and now it does => POST
    else if (currentlayout !== undefined && oldLayout.length === 0) {
      result = await LayoutModel.postLayout(currentlayout);
      request.layout = {
        items           : result.items,
        chairs_per_table: result.chairs_per_table
      };
    }

    // CASE 2: Old event had furniture and current request layout is empty => DELETE
    else if (currentlayout === undefined && oldLayout.length > 0) {
      result = await LayoutModel.deleteLayout(package_id);
    }

    // CASE 3: Old event had furniture and so does this one: => Overwrite via PATCH
    else if (currentlayout !== undefined && oldLayout.length > 0) {
      result = await LayoutModel.patchLayout(currentlayout);
      request.layout = {
        items           : result.items,
        chairs_per_table: result.chairs_per_table
      };
    }

    // CASE: ERROR
    else {
      return response.status(400).json({
        error: true,
        currentlayout,
        oldLayout,
        package_id,
        message: 'Something went wrong in your conditional expressions'
      });
    };



    next();
  } catch(err) {
    return response.status(400).json({
      error: err,
      oldLayout,
      currentlayout
    });
  }
}


/**
 * Queries DyanmoDB `layouts` table for a layout object and zips with events in request.
 * @function
 * @returns {object}
 */
async function getEventLayoutMiddleware(request, response, next) {
  // Middleware could be called from /layouts OR /events
  const id = request.params.id || request.params.package_id;
  
  try {
    // Result should be an array with a single object
    const result     = await LayoutModel.getLayout(id);

    // Zip with our util function
    const events_with_layouts = zipperEventsAndLayouts(request.events, result);
    request.events = events_with_layouts;
    
    return next();
  } catch (err) {
    return response.status(400).json({ error: err, id });
  }
}


/**
 * Queries DynamoDB table for a layout
 * @function
 * @returns {object}
 */
async function getLayoutMiddleware(request, response, next) {
  const id = request.params.id;

  try {
    const result  = await LayoutModel.getLayout(id);
    request.layout = result;
    return next();
  } catch(err) {
    return response.status(400).json({ error: err, id });
  }
}




/**
 * Deletes a layout object with hashKey `${package_id}` from DynamoDB.
 * @function
 * @returns {object}
 */
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


/**
 * Queries layouts table for either user's or public layouts.
 * @function
 * @returns {object}
 */
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

  let lays;

  try {
    const { layouts } = await LayoutModel.getLayouts(field, value);

    // Zipper layout and events if any events are present
    // Events are present when this middleware is called from event (private) endpoint
    if ("events" in request) {
      try {
        const events_with_layouts = zipperEventsAndLayouts(request.events, layouts);
        request.events  = events_with_layouts;
      } catch (zipErr) {
        console.log('got a zip error');
        console.log(zipErr);
        console.log(events_with_layouts);
        return response.status(400).json({ err: zipErr, layouts, events: request.events, lays });
      }
    }
    // Events aren't present when calling for public events => No need to zip
    else {
      request.layouts = layouts;
    }

    return next();
  } catch(err) {
    return response.status(400).json({
      where: 'initial layoutmodel getLayouts',
      lays,
      error: err,
      path: request.path,
      events: request.events
    });
  }
}


module.exports = {
  validateLayout,
  getEventLayoutMiddleware,
  getLayoutMiddleware,
  getLayoutsMiddleware,
  postLayoutMiddleware,
  patchLayoutMiddleware,
  deleteLayoutMiddleware
}