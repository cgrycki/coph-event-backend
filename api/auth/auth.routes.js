/**
 * Authentication ExpressJS Route -- RESTful endpoints
 * @module AuthRoute
 */

/* Dependencies -------------------------------------------------------------*/
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


/* Parameters + Sessions ----------------------------------------------------*/
router.use(session);
router.param('code', validParamCode);


/* RESTful Endpoints --------------------------------------------------------*/
// GET /auth/:code -- Authenticates login from Campus Login tools 
router.get('/',
  authUserCodeMiddleware, 
  (req, res) => res.status(200).redirect(`${process.env.FRONTEND_URI}/dashboard`));


// GET /auth/logout -- Ends a user's session and redirects them to the login URL.
router.get('/logout', 
  clearTokensFromSessionMiddleware,
  (req, res) => res.status(200).redirect(process.env.FRONTEND_URI));


// GET /auth/validate -- Returns a boolean indicating if the user is logged in
router.get('/validate', 
  checkSessionExistsMiddleware, retrieveSessionInfoMiddleware, getUserAdminStatus,
  (req, res) => res.status(200).json({ 
    loggedIn: true,
    hawkid  : req.hawkid,
    isAdmin : req.isAdmin
  }));


/* Exports ------------------------------------------------------------------*/
module.exports = router;