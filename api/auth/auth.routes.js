/**
 * Authentication API, RESTful endpoints.
 */

/* Dependencies -------------------------------------------------------------*/
const router = require('express').Router();
const {
  validParamCode,
  authenticateCode,
  clearTokensFromSession
}            = require('./auth.utils');


/* Parameters ---------------------------------------------------------------*/
router.param('code', validParamCode);


/* RESTful Endpoints --------------------------------------------------------*/
// GET /auth/:code -- Authenticates code sent from Campus Login tools
router.get('/', authenticateCode, 
  (request, response) => response.status(200).redirect(process.env.FRONTEND_URI));

// GET /auth/logout -- Ends a user's session and redirects them to the login URL.
router.get('/logout', clearTokensFromSession, 
  (request, response) => response.status(200).redirect(process.env.FRONTEND_URI));

// GET /auth/validate -- Returns a boolean indicating if the user is logged in
router.get('/validate', (request, response) => {
  let session = request.session;

  if ((request.get('origin') === 'http://localhost:3000') || 
      (session && session.uiowa_access_token)) {
    response.status(200).json({ loggedIn: true });
  }
  else response.status(200).json({ loggedIn: false });
});


/* Exports ------------------------------------------------------------------*/
module.exports = router;