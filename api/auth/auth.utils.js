/**
 * Authentication middleware.
 */

/** Dependencies -------------------------------------------------------------*/
const { check } = require('express-validator/check');
const hawkids   = require('../../config/hawkids');
const {
  oauth_uiowa,
  getUserAuthURL,
  getUserAuthToken,
  setUserAuthToken,
  unsetUserAuthToken
} = require('./auth.app');


/** Parameters ---------------------------------------------------------------*/
const validParamCode = check('code').exists().isAlphanumeric();

/**
 * Quick helper function to test if a HawkID is in admin list
 * @param {string} hawkid HawkID of a user making a HTTP request.
 * @returns {boolean} isAdmin Weither or not the user is an admin.
 */
const isAdmin = hawkid => hawkids.has(hawkid);


/* Middlewares --------------------------------------------------------------*/

/**
 * Completes the authentication handshake with U. Iowa servers.
 * @param {object} request - Workflow callback HTTP request after successful user login. 
 * @param {object} response - HTTP response to return.
 * @param {function} next - Next function in our middleware stack. 
 */
async function authUserCodeMiddleware(request, response, next) {
  const code = request.query.code;

  if (code) {
    // We 'know' that the request came from a whitelisted domain
    // So use the authentication code to obtain an OAuth2 token
    let token;
    
    try {
      // This will also save our user's values to their session
      token = await getUserAuthToken(code);

      // Save token information to user session
      setUserAuthToken(token, request);
      
      // Token checks out, values are saved. Send them to fill form on client.
      next();
      
    } catch (error) {
      return response.status(500).json({ 
        error  : 'Error while authenticating token',
        message: error.message,
        stack  : error.stack,
      });
    }
  } else {
    // No authentication code. Redirect to login URL 
    return response.status(403).redirect(getUserAuthURL());
  }
}


/**
 * Checks a request to ensure it is authenticated.
 * @param {object} request - HTTP request from our frontend website.
 * @param {object} response - HTTP response to return to frontend.
 * @param {Function} next - Next function in our middleware stack.
 */
async function checkSessionExistsMiddleware(request, response, next) {
  let sess = request.session;

  // Check user has session and is authenticated
  if (sess && sess.uiowa_access_token) {
    // We have a token, but is it expired?
    // Expire 5 minutes early to account for clock differences
    const expires = sess.cookie.expires;
    const FIVE_MINUTES = 300000;
    const expiration = new Date(parseFloat(expires - FIVE_MINUTES));
    
    // Token is fine, return next middleware
    if (expiration > new Date()) return next();

    // Expired, refresh token and save values to session
    const refresh_token = sess.uiowa_refresh_token; 
    const new_token = await oauth_uiowa.accessToken
      .create({refresh_token: refresh_token})
      .refresh();

    // Save new token and continue with request
    setUserAuthToken(new_token, request);
    return next();
  }

  // Check if user is developer
  //else if (request.get('origin') === 'http://localhost:3000') return next();
  
  // Check if this request is being sent to /auth with a valid token
  else if (request.path.endsWith('/auth') && request.query.code) return next();

  // No authenticated session? Expired?
  else response.status(403).json({
    error   : true,
    loggedIn: false,
    message : "You are not logged in"
  });
}


/**
 * Middleware function to retrieve a request's user information (OAuth2 token + IP Address).
 * @param {object} request - HTTP request originating from our frontend website.
 * @param {object} response - HTTP response to return to frontend.
 * @param {Function} next - Next function in our middleware stack.
 */
function retrieveSessionInfoMiddleware(request, response, next) {
  // Localhost gets forwarded
  /*if (request.get('origin') === 'http://localhost:3000') {
    request.hawkid = 'LOCALHOST';
    return next();
  };*/

  try {
    // Define and load the session
    let sess = request.session;

    // Set all the info needed by later middleware in /events.
    // We need user access (oauth) token to create/update workflow package
    request.uiowa_access_token = sess.uiowa_access_token;

    // We need the user's IP address to create/update workflow package
    request.user_ip_address = (
      request.headers['x-forwarded-for'] ||
      request.connection.remoteAddress ||
      request.socket.remoteAddress ||
      request.connection.socket.remoteAddress
    ).split(",")[0];

    // Add HawkID for login response
    request.hawkid = sess.hawkid;

    return next();
  } catch (error) {
    // Error in retrieving our session
    return response.status(502).json({
      error: error.message,
      stack: error.stack
    });
  }
}


/**
 * Destroys a user session and unsets our identification cookie.
 * @param {object} request - HTTP request originating from our frontend website.
 * @param {object} response - HTTP response to send to frontend.
 * @param {Function} next - Next function in our middleware stack.
 */
function clearTokensFromSessionMiddleware(request, response, next) {
  unsetUserAuthToken(request, response);
  return next();
}


/**
 * Looks up if a user's hawkID is in a set of Administrator hawkIDs. This function is the last middleware function called in our /auth/validate endpoint. As such, it expects the request to be authenticated and values present.
 * @param {Object} request Incoming HTTP request.
 * @params [request.hawkid] {string} HawkID taken from the user's DynamoDB backed session.
 * @param {Object} response Outgoing HTTP response to client.
 */
function getUserAdminStatus(request, response, next) {
  try {
    const userIsAdmin = isAdmin(request.hawkid);
    request.isAdmin   = userIsAdmin;
    return next();
  } catch (err) {
    return response.status(400).json({
      error: true,
      message: "There was an error while processing user admin status."
    })
  }
};


module.exports = {
  validParamCode,
  authUserCodeMiddleware,
  checkSessionExistsMiddleware,
  retrieveSessionInfoMiddleware,
  clearTokensFromSessionMiddleware,
  getUserAdminStatus
};