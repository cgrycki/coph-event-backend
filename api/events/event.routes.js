/**
 * Express Router to mount Event related functions.
 * @module events/EventRouter
 * @requires express
 */

// Router dependencies ------------------------------------------------------*/
/**
 * @type {object}
 * @const
 * @alias module:events/EventRouter
 */
const router      = require('express').Router();
const { session } = require('../auth/auth.session');


/* Middlewares  -------------------------------------------------------------*/
const {
  checkSessionExistsMiddleware,
  retrieveSessionInfoMiddleware
}                               = require('../auth/auth.utils');
const {
  validateEvent,
  getDynamoEventMiddleware,
  getDynamoEventsMiddleware,
  postDynamoEventMiddleware,
  patchDynamoEventMiddleware,
  deleteDynamoEventMiddleware
}                               = require('./event.utils');
const {
  getWorkflowPermissionsMiddleware,
  postWorkflowEventMiddleware,
  deleteWorkflowEventMiddleware,
  patchWorkflowEventMiddleware
}                               = require('../workflow/workflow.utils');
const {
  validateLayout,
  getEventLayoutMiddleware,
  getLayoutsMiddleware,
  postLayoutMiddleware,
  patchLayoutMiddleware,
  deleteLayoutMiddleware
}                               = require('../layouts/layout.utils');
const Sharepoint                = require('../utils/Sharepoint');


// Parameters + Sessions ----------------------------------------------------*/
router.use(session);
router.use(checkSessionExistsMiddleware);
router.use(retrieveSessionInfoMiddleware);


// Routes -------------------------------------------------------------------*/

/**
 * Creates an new entry in Event system.
 * @function
 * @name POST
 * @param {object} req Incoming HTTP Request
 * @param [req.body.info] {object} Object containing field information filled by user.
 * @param [req.body.layout] {object} Object containing user furniture layout info
 * @param {object} res Outgoing HTTP response
 * @returns {object} RESTful response - Object with DynamoDB + Workflow responses
 */
router.post('/',
  validateEvent,
  postWorkflowEventMiddleware,
  postDynamoEventMiddleware,
  validateLayout,
  postLayoutMiddleware,
  Sharepoint.sharepointMiddleware,
  (req, res) => res.status(201).json({ 
    event      : req.events[0],
    permissions: req.permissions,
    layout     : req.layout
  }));


/**
 * Returns a list of events created by requesting user's hawkid.
 * @function
 * @name GET/my
 * @alias module:events/EventRouter.GET/my
 * @param {object} req Incoming HTTP request
 * @param [req.session] {object} Authenticated Session cookie
 * @param {object} res Outgoing HTTP Response
 * @returns {object[]}
 */
router.get('/my',
  getDynamoEventsMiddleware,
  getWorkflowPermissionsMiddleware,
  getLayoutsMiddleware,
  (req, res) => res.status(200).json(req.events));


/**
 * Returns a specfic package's event information, furniture, and user Workflow permissions
 * @function
 * @name GET/:package_id
 * @alias module:events/EventRouter.GET/:package_id
 * @param {object} req Incoming HTTP request
 * @param [req.session] {object} Authenticated Session cookie
 * @param [req.package_id] {number} Package ID of event
 * @param {object} res Outgoing HTTP Response
 * @returns {object}
 */
router.get('/:package_id',
  getDynamoEventMiddleware,
  getWorkflowPermissionsMiddleware,
  getEventLayoutMiddleware,
  (req, res) => res.status(200).json(req.events[0]));


/**
 * Deletes a specfic package's event information, furniture, and Workflow entry
 * @function
 * @name DELETE/:package_id
 * @alias module:events/EventRouter.DELETE/:package_id
 * @param {object} req Incoming HTTP request
 * @param [req.session] {object} Authenticated Session cookie
 * @param [req.package_id] {number} Package ID of event
 * @param {object} res Outgoing HTTP Response
 * @returns {string}
 */
router.delete('/:package_id',
  deleteWorkflowEventMiddleware,
  deleteDynamoEventMiddleware,
  deleteLayoutMiddleware,
  (req, res) => res.status(200).json({ package_id: req.params.package_id }));


/**
 * Updates a specfic package's event information and layout information.
 * @function
 * @name PATCH/:package_id
 * @alias module:events/EventRouter.PATCH/:package_id
 * @param {object} req Incoming HTTP Request
 * @param [req.body.info] {object} Object containing field information filled by user.
 * @param [req.body.layout] {object} Object containing user furniture layout info
 * @param {object} res Outgoing HTTP Response
 * @returns {object}
 */
router.patch('/:package_id',
  validateEvent,
  //getDynamoEventMiddleware,
  //patchWorkflowEventMiddleware,
  patchDynamoEventMiddleware,
  getWorkflowPermissionsMiddleware,
  validateLayout,
  patchLayoutMiddleware,
  (req, res) => res.status(200).json({
    event      : req.events[0].event,
    permissions: req.events[0].permissions,
    layout     : req.layout
  }));


module.exports = router;