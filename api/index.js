/**
 * Router Entry point
 */

// Dependencies
const router        = require('express').Router();
const url           = require('url');

// Our routes
const authRoute     = require('./auth/auth.routes');
const eventRoute    = require('./events/event.routes');
const mauiRoute     = require('./maui/maui.routes');
const workflowRoute = require('./workflow/workflow.routes');


router.use('/auth',       authRoute);
router.use('/events',     eventRoute);
router.use('/maui',       mauiRoute);
router.use('/workflow',   workflowRoute);

/**
 *  GET home page. Behavior is as follows:
 *  - If we find an access token in the session => valid, send to frontend
 *  - If theres no token, check for a code => valid, send to /auth to authenticate
 *  - Otherwise no code/access_token => invalid, still send to /auth to redirect
 */
router.get('/', function(req, res) {
  // If the user has an access token, we've already authenticated them
  const accessToken = req.session.uiowa_access_token;
  if (accessToken) res.status(302).redirect(process.env.FRONTEND_URI);

  // Otherwise send them to auth. If the request contains a code it will
  // be validated by our auth route. If it doesn't it will send them to login
  res.redirect(url.format({ pathname: '/auth', query: req.query }));
});

module.exports = router;