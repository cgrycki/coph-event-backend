/**
 * Layout Utilities: middleware functions mapping HTTP requests to our REST 
 * classes and DynamoDB models. Includes validation and error catching.
 */


/* Dependencies -------------------------------------------------------------*/
const LayoutModel         = require('./layout.model');
const {layoutValidation}  = require('./layout.schema');


/** Validates a layout object */
function validateLayout(request, response, next) {
  // Create object that we will validate against
  let layout_info = { items: request.body.layout.items };
  
  // Check if request came from user (private layout)
  if (!request.body.layout.id) {
    layout_info.package_id = request.package_id;
    layout_info.user_email = `${request.hawkid}@uiowa.edu`;
  } 
  else layout_info.id = request.body.layout.id;

  // Validate and return if response fails
  let { error, value } = layoutValidation(layout_info);
  if (error !== null) return response.status(400).json({ error, layout_info });
  else {
    request.validLayout = value;
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
  const id = request.params.id;
  
  try {
    const result = await LayoutModel.getLayout(id);
    request.layout = result[0];
    return next();
  } catch (err) {
    return response.status(400).json({ error: err, id: pid });
  }
}


/** Deletes a layout object with hashKey ${package_id} from DynamoDB. */
async function deleteLayoutMiddleware(request, response, next) {
  const id = request.params.id;

  try {
    const result = LayoutModel.deleteLayout(id);
    next();
  } catch(err) {
    return response.status(400).json({error: err, id: id});
  }
}


module.exports = {
  validateLayout,
  getLayoutMiddleware,
  postLayoutMiddleware,
  patchLayoutMiddleware,
  deleteLayoutMiddleware
}