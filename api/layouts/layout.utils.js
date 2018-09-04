/**
 * Layout Utilities: middleware functions mapping HTTP requests to our REST 
 * classes and DynamoDB models. Includes validation and error catching.
 */


/* Dependencies -------------------------------------------------------------*/
const LayoutModel       = require('./layout.model');
const { layoutSchema }  = require('./layout.schema');


/** Validates a layout object */
function validateLayout(request, response, next) {
  // Get Package ID from prior middleware and layout information from JSON body
  let layout_info = { 
    count: request.body.layout.count,
    items: request.body.layout.items,
    id   : request.params.package_id || request.package_id.toString()
  };
  let { error, value } = layoutSchema.validate(layout_info, {abortEarly: false});

  // Return the error if the layout info is not valid
  if (error !== null) return response.status(400).json({ error, layout_info });
  else {
    request.validLayout = layout_info;
    next();
  }
}


/** Creates a new layout in DynamoDB `layouts` table. */
async function postLayoutMiddleware(request, response, next) {
  // Get validated information passed from validateLayout()
  const layout = request.validLayout;

  // Check if we need to create a layout: some (most?) events won't have one
  if (layout.items.length !== 0) {
    try {
      const result        = await LayoutModel.postLayout(layout);
      request.validLayout = result;
      next();

    } catch (err) {
      return response.status(400).json({ error: err, layout });
    }
  }

  request.layout = layout;
  next();
}


/** Updates a layout object in DynamoDB table. */
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
  const pid = request.params.package_id;
  
  try {
    const result = await LayoutModel.getLayout(pid);
    request.layout = result[0];
    return next();
  } catch (err) {
    return response.status(400).json({ error: err, package_id: pid });
  }
}


/** Deletes a layout object with hashKey ${package_id} from DynamoDB. */
async function deleteLayoutMiddleware(request, response, next) {
  const pid = request.params.package_id;

  try {
    const result = LayoutModel.deleteLayout(pid);
    next();
  } catch(err) {
    return response.status(400).json({error: err, package_id: pid});
  }
}


module.exports = {
  validateLayout,
  getLayoutMiddleware,
  postLayoutMiddleware,
  patchLayoutMiddleware,
  deleteLayoutMiddleware
}