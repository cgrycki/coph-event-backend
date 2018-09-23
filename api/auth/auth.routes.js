/**
 * Authentication ExpressJS Route -- RESTful endpoints
 * @module auth/authroute
 * @requires express
 */

// Dependencies -------------------------------------------------------------*/
/**
 * @type {object}
 * @const
 * @alias module:auth/authroute
 */
const router      = require('express').Router();
const { session } = require('./auth.session');
const {
  validParamCode,
  authUserCodeMiddleware,
  checkSessionExistsMiddleware,
  retrieveSessionInfoMiddleware,
  clearTokensFromSessionMiddleware,
  getUserAdminStatus
}                = require('./auth.utils');


// Parameters + Sessions ----------------------------------------------------*/
router.use(session);
router.param('code', validParamCode);


// RESTful Endpoints --------------------------------------------------------*/
/**
 * Authenticates login from Campus Login tools
 * @function
 * @name GET/:code
 * @param {object} req Incoming HTTP Request
 * @returns {object}
 */
router.get('/',
  authUserCodeMiddleware, 
  (req, res) => res.status(200).redirect(`${process.env.FRONTEND_URI}/dashboard`));


/**
 * Ends a user's session and redirects them to the login URL.
 * @function
 * @name GET/logout
 * @param {object} req Incoming HTTP Request
 * @returns {object}
 */
router.get('/logout', 
  clearTokensFromSessionMiddleware,
  (req, res) => res.status(200).redirect(process.env.FRONTEND_URI));


/**
 * Returns a boolean indicating if the user is logged in
 * @function
 * @name GET/validate
 * @param {object} req Incoming HTTP Request
 * @returns {boolean}
 */
router.get('/validate', 
  checkSessionExistsMiddleware, retrieveSessionInfoMiddleware, getUserAdminStatus,
  (req, res) => res.status(200).json({ 
    loggedIn: true,
    hawkid  : req.hawkid,
    isAdmin : req.isAdmin
  }));


// Exports ------------------------------------------------------------------*/
module.exports = router;