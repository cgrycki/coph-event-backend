/**
 * Authentication API, RESTful endpoints.
 */

/* Dependencies -------------------------------------------------------------*/
const router = require('express').Router();
const {
  validParamCode,
  authUserCodeMiddleware,
  checkSessionExistsMiddleware,
  retrieveSessionInfoMiddleware,
  clearTokensFromSessionMiddleware
}            = require('./auth.utils');


/* Parameters ---------------------------------------------------------------*/
router.param('code', validParamCode);


/* RESTful Endpoints --------------------------------------------------------*/
// GET /auth/:code -- Authenticates code sent from Campus Login tools
router.get('/', 
  authUserCodeMiddleware, 
  (req, res) => res.status(200).redirect(process.env.FRONTEND_URI));

// GET /auth/logout -- Ends a user's session and redirects them to the login URL.
router.get('/logout', 
  clearTokensFromSessionMiddleware, 
  (req, res) => res.status(200).redirect(process.env.FRONTEND_URI));

// GET /auth/validate -- Returns a boolean indicating if the user is logged in
router.get('/validate', 
  checkSessionExistsMiddleware, retrieveSessionInfoMiddleware, 
  (req, res) => {
    let session = req.session;

    if ((req.get('origin') === 'http://localhost:3000') || 
        (session && session.uiowa_access_token)) {
          let hawkid = session.hawkid || 'LOCALHOST';

          res.status(200).json({ 
            loggedIn: true,
            hawkid: hawkid
          });
    }
    else res.status(200).json({ loggedIn: false });
  });


/* Exports ------------------------------------------------------------------*/
module.exports = router;