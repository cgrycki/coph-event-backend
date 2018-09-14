/**
 * Layout Utilities: middleware functions mapping HTTP requests to our REST 
 * classes and DynamoDB models. Includes validation and error catching.
 */


/* Dependencies -------------------------------------------------------------*/
const LayoutModel              = require('./layout.model');
const {layoutValidation}       = require('./layout.schema');
const {zipperEventsAndLayouts} = require('../utils');


// Stub layout
const stub = {
  items: [],
  chairs_per_table: 6
};


/** Validates a layout object */
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
    layout_info.package_id = request.dynamo_data.get('package_id');
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
  // Get id of event from request, don't coerce to number because layout hashkey
  const package_id = request.params.package_id;

  // Get current request's layout information from layout validation
  const currentlayout = request.validLayout;

  // Get current request's call to the layout table to see if this event 
  // had a layout. GET layout returns an empty array if not found 
  const oldLayout = request.layout.items;
  
  // Keep a variable for the database operations
  let result;
  try {

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


/** Queries DyanmoDB `layouts` table for a layout object. */
async function getLayoutMiddleware(request, response, next) {
  // Middleware could be called from /layouts OR /events
  const id = request.params.id || request.params.package_id;
  
  try {
    // Result should be an array with a single object
    let result     = await LayoutModel.getLayout(id);

    // So if DDB didn't return a layout, assign an empty list
    if (result.length === 0) request.layout = stub;
    else {
      request.layout = {
        items           : result[0].get('items'),
        chairs_per_table: result[0].get('chairs_per_table')
      };
    }
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

    // Zipper layout and events if any events are present
    // Events are present when this middleware is called from event (private) endpoint
    if ("events" in request) {
      const events_with_items = zipperEventsAndLayouts(request.events, layouts);
      request.events  = events_with_items;
    }
    // Events aren't present when calling for public events => No need to zip
    else {
      request.layouts = layouts;
    }

    next();
  } catch(err) {
    return response.status(400).json({
      error: err,
      path: request.path
    });
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