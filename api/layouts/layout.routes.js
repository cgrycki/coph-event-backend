/**
 * Layout ExpressJS Route
 * @module layouts/LayoutRoute
 * @requires express
 */

// Router dependencies ------------------------------------------------------*/
/**
 * ExpressJS Route mounting furniture Layout functions
 * @type {object}
 * @const
 * @alias module:layouts/LayoutRoute
 */
const router      = require('express/lib/router')();
//const { session } = require('../auth/auth.session');


// Middlewares  -------------------------------------------------------------*/
const { 
  checkSessionExistsMiddleware, 
  retrieveSessionInfoMiddleware 
}  = require('../auth/auth.utils');

const { 
  validateLayout,
  postLayoutMiddleware,
  getLayoutMiddleware,
  getLayoutsMiddleware,
  deleteLayoutMiddleware,
  patchLayoutMiddleware
} = require('./layout.utils');


// Parameters + Sessions ----------------------------------------------------*/
//router.use(session);
//router.use(checkSessionExistsMiddleware);
//router.use(retrieveSessionInfoMiddleware);


/ Routes -------------------------------------------------------------------*/
/**
 * Creates a new layout in DynamoDB
 * @function
 * @name POST
 * @param {object} req Incoming HTTP request
 * @returns {object}
 */
router.post('/',
  validateLayout,
  postLayoutMiddleware,
  (req, res) => res.status(200).json({ layout: req.validLayout }));


/**
 * Returns a layout with matching `id` from DynamoDB
 * @function
 * @name GET/:id
 * @param {object} req Incoming HTTP request
 * @param [req.id] {string} Hash Key of Layout
 * @returns {object}
 */
router.get('/:id',
  getLayoutMiddleware, 
  (req, res) => res.status(200).json(req.layout));


/**
 * Deletes a layout from DynamoDB
 * @function
 * @name DELETE/:id
 * @param {object} req Incoming HTTP request
 * @param [req.id] {string} Hash Key of Layout
 * @returns {string}
 */
router.delete('/:id',
  deleteLayoutMiddleware,
  (req, res) => res.status(200).json({ id: req.params.id }));


/**
 * Updates a layout in DynamoDB.
 * @function
 * @name PATCH 
 * @param {object} req Incoming HTTP request
 * @param [req.id] {string} Hash Key of Layout to update
 * @param [req.body.layou] {object} New layout information
 * @returns {object}
 */
router.patch('/:id',
  validateLayout,
  patchLayoutMiddleware,
  (req, res) => res.status(200).json({ layout: req.layout }));


/**
 * Returns a filtered list of user's layouts.
 * @function
 * @name filter/my
 * @param {object} req Incoming HTTP request
 * @returns {object[]}
 */
router.get('/filter/my',
  getLayoutsMiddleware,
  (req, res) => res.status(200).json({ layouts: req.layouts }));


/**
 * Returns public layouts accessible to all users.
 * @function
 * @name filter/public
 * @param {object} req Incoming HTTP request
 * @returns {object[]}
 */
router.get('/filter/public',
  getLayoutsMiddleware,
  (req, res) => res.status(200).json({ layouts: req.layouts }));


module.exports = router;