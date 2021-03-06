/**
 * Utilty functions shared by our API routes.
 */
/* Dependencies -------------------------------------------------------------*/
const { validationResult } = require('express-validator/check');
const stubLayout = {
  items           : [],
  chairs_per_table: 6
};


/* Utilities ----------------------------------------------------------------*/
/**
 * Formates express-validator errors gracefully.
 * @param {validationResult} error Return value from express-validator's 
 * validationResult() function. 
 */
const errorFormatter = ({ location, msg, param, value, nestedErrors }) => {
  // Create human readable strings for our errors.
  return `${location}[${param}]: ${msg}`;
}


/**
 * Ensures an incoming HTTP request has passed all parameter validations.
 * @param {XMLHttpRequest} request Incoming HTTP request passed by Express serv.
 * @param {XMLHttpRequest} response HTTP response sent to client.
 * @param {Function} next Next function to run, if there are no errors.
 */
const validateParams = (request, response, next) => {
  // Gather errors accumulated from prior middleware.
  const errors = validationResult(request).formatWith(errorFormatter);

  // If we have any errors, stop routing and return them in HTTP response.
  if (!errors.isEmpty()) {
    // Response will contain something like
    // { errors: [ "body[password]: must be at least 10 chars long" ] }
    return response.status(400).json({ errors: errors.array() });
  };

  // We have no errors! Move on to the next function in our middleware.
  next();
};


/**
 * Creates a table name from our environment and a table param.
 * @param {string} table Which table should we create this for?
 * @returns {string} table_name Formatted DynamoDB table name for our environment.
 */
const createTableName = (table) => {
  // Describes the application client_id and name from our schema
  let app = process.env.UIOWA_ACCESS_KEY_ID;

  // Environment: {test, dev, prod}
  let env = process.env.WF_ENV;
  
  const table_name = `${app}-${table}-${env}`;
  return table_name;
};


/**
 * Extracts submitted data from an User's event for their Workflow entry.
 * @param {Object} form_info Form Data submitted via a user's POST request.
 * @returns {Object} Workflow information: a subset of total information *required* for Workflow's inbox.
 */
const extractWorkflowInfo = (form_info) => ({
  // We're keeping approved as a string because of the DynamoDB index
  approved      : form_info.approved,
  date          : form_info.date,
  // ... but converting this boolean to string because Workflow doesn't accept booleans
  setup_required: form_info.setup_required.toString(),
  user_email    : form_info.user_email,
  // ... And conditionally assigning a string because not every event will have a
  // contact email, but it's important to have in the Workflow inbox (and required).
  contact_email : form_info.contact_email || "",
  room_number   : form_info.room_number
});


/**
 * Deep compares two objects' properties and returns a boolean if they are inequal.
 * @param {Object} old_data Old event info data from DynamoDB and slimmed down.
 * @param {Object} new_data New event info data from user update.
 * @returns {boolean} Indicates equality of objects.
 */
const shouldUpdateEvent = (old_data, new_data) => {
  for (var key in old_data) {
    // If dynamo object has key and new object doesn't, they are inequal
    if (!(key in new_data)) return true;

    // If any of the objects properties are different, return true
    if (old_data[key] !== new_data[key]) return true;
  };

  // Otherwise we made it through all object keys, objects are functionally same
  return false;
};


/**
 * Removes keys with empty string values from an object. Useful for posting to DynamoDB.
 * @param {object} obj Object to remove empty values from
 */
const removeEmptyKeys = obj => {
  Object.keys(obj).forEach(key => (obj[key] === '') && delete obj[key]);
}


/**
 * Combines events and their permissions from Workflow.
 * @param {object[]} events List of event's information returned from DynamoDB
 * @param {object[]} permissions List of permissions returned from Workflow.
 * @returns {object[]} Array of nested object.
 */
function zipperEventsAndPermissions(events, permissions) {
  const events_with_permissions = events.map((evt, idx) => ({
    event: evt,
    permissions: {
      canEdit         : permissions[idx].canEdit,
      canInitiatorVoid: permissions[idx].canInitiatorVoid,
      canVoid         : permissions[idx].canVoid,
      canVoidAfter    : permissions[idx].canVoidAfter,
      canSign         : permissions[idx].canSign,
      signatureId     : permissions[idx].signatureId
    }
  }));

  return events_with_permissions;
}


/**
 * Zips events to their respective layouts. If no layout exists for an event,
 * an empty array will be assigned to it's items.
 * @param {object[]} events List of events returned by DynamoDB.
 * @param {object[]} layouts List of layouts returned by DynamoDB.
 * @returns {events} Events array with an `items` list assigned to each event obj.
 */
function zipperEventsAndLayouts(events, layouts) {
  // Case: no events and thus no layouts to assign
  if (!events || events.length === 0) return [];

  // Case: All layouts have an event, but not all events have a layout.
  if (!layouts || layouts.length > events.length) throw new Error('Invalid number of layouts');

  // Create a lookup table for layouts based on their package_ids
  const layoutLookup = layouts.reduce((lookupObj, layout) => {
    // Layout it a DynamoDB model object
    lookupObj[layout.get('package_id')] = {
      items           : layout.get('items'),
      chairs_per_table: layout.get('chairs_per_table')
    };
    return lookupObj;
  }, {});

  // Iterate through the events, and check if the event's ID is in the lookup.
  let events_with_items = events.map(evt => {
    // Event is a DynamoDB model object
    const event_pid = evt.event.get('package_id');
    let layout = layoutLookup.hasOwnProperty(event_pid) ? layoutLookup[event_pid] : stubLayout;
    return {
      event      : evt.event,
      permissions: evt.permissions,
      layout
    };
  });
  
  return events_with_items;
}



module.exports = {
  errorFormatter,
  validateParams,
  createTableName,
  extractWorkflowInfo,
  shouldUpdateEvent,
  removeEmptyKeys,
  zipperEventsAndPermissions,
  zipperEventsAndLayouts
};