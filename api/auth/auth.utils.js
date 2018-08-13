/**
 * Authentication Utilities/Middleware
 */

/* Dependencies -------------------------------------------------------------*/
const { check } = require('express-validator/check');
const oauth2    = require('simple-oauth2');


/* Credentials --------------------------------------------------------------*/
const oauth_uiowa = oauth2.create({
  client: {
    id    : process.env.UIOWA_ACCESS_KEY_ID,
    secret: process.env.UIOWA_SECRET_ACCESS_KEY,
  },
  auth: {
    tokenHost    : 'https://login.uiowa.edu/uip/',
    authorizePath: 'auth.page',
    tokenPath    : 'token.page'
  },
  options: {
    authorizationMethod: 'body'
  }
});


/* Parameters ---------------------------------------------------------------*/
const validParamCode = check('code').exists().isAlphanumeric();


/* Utilities ----------------------------------------------------------------*/
/**
 * Returns an URL for authorizing against Workflow.
 * @returns {string} authURL - URL formatted with redirect endpoint and scopes.
 */
function getAuthURL() {
  const authURL = oauth_uiowa.authorizationCode.authorizeURL({
    type         : 'web_server',
    response_type: 'code',
    redirect_uri : process.env.REDIRECT_URI,
    scope        : process.env.UIOWA_SCOPES
  });
  return authURL;
}

/**
 * Completes an authentication handshake with server, and saves user information to session.
 * 
 * @async
 * @param {string} auth_code - User's temporary OAuth2 token from Workflow login callback. 
 * @param {object} request - HTTP request from Workflow login callback.
 * @returns {object} token - User's OAuth2 token containing access key, refresh key, and information.
 * 
 * @example
 * 
 * Example token returned, from the [Workflow documentation](https://workflow.uiowa.edu/help/article/26/6):
 * ```
 * {
 *  "access_token":"USER_ACCESS_TOKEN",
 *  "refresh_token":"USER_REFRESH_TOKEN",
 *  "token_type":"bearer",
 *  "expires_in":2592000,
 *  "params":{
 *    "hawkID": USER_HAWKID,
 *    "uid": USER_UNIVERSITY_ID,
 *    "scope": YOUR_SCOPE,
 *    "issued_to" => YOUR_CLIENT_ID
 * }
 * ```
 */
async function getAuthTokenFromCode(auth_code, request) {
  /* POST https://login.uiowa.edu/uip/token.page?
    grant_type    = authorization_code&
    client_id     = YOUR_CLIENT_ID&
    client_secret = YOUR_CLIENT_SECRET&
    code          = AUTHORIZATION_CODE&
    redirect_uri  = YOUR_REDIRECT_URL
  */

  // Get auth token with application+user authorization code
  let result = await oauth_uiowa.authorizationCode.getToken({
    grant_type   : 'authorization_code',
    client_id    : process.env.UIOWA_ACCESS_KEY_ID,
    client_secret: process.env.UIOWA_SECRET_ACCESS_KEY,
    code         : auth_code,
    redirect_uri : process.env.REDIRECT_URI
  });

  // Confirm with the handshake
  const token = oauth_uiowa.accessToken.create(result);

  // Save token values to session
  saveTokenToSession(token, request);

  return token;
}


/**
 * Saves a user's OAuth2 token to a DynamoDB session. 
 * @param {object} token - User's OAuth2 token information. 
 * @param {object} request - HTTP request from workflow login callback. 
 */
function saveTokenToSession(token, request) {
  let sess = request.session;
  
  // Save the access token to session
  sess.uiowa_access_token = token.token.access_token;
  // Save refresh token
  sess.uiowa_refresh_token = token.token.refresh_token;
  // Save the expiration time
  sess.expires_in = token.token.expires_in;

  // Save alphanumeric HawkID
  sess.hawkid = token.token.hawkid;

  // Save University ID interger
  sess.uid = token.token.uid;
}


/* Middlewares --------------------------------------------------------------*/
/**
 * Completes the authentication handshake with U. Iowa servers.
 * @param {object} request - Workflow callback HTTP request after successful user login. 
 * @param {object} response - HTTP response to return.
 * @param {function} next - Next function in our middleware stack. 
 */
async function authenticateCode(request, response, next) {
  const code = request.query.code;
  if (code) {
    // We 'know' that the request came from a whitelisted domain
    // So use the authentication code to obtain an OAuth2 token
    let token;

    try {
      // This will also save our user's values to their session
      token = await getAuthTokenFromCode(code, request);

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
    return response.status(403).redirect(getAuthURL());
  }
}


/**
 * Checks a request to ensure it is authenticated.
 * @param {object} request - HTTP request from our frontend website.
 * @param {object} response - HTTP response to return to frontend.
 * @param {Function} next - Next function in our middleware stack.
 */
async function checkSessionExists(request, response, next) {
  let sess = request.session;

  // Check if they've been here before
  if (sess && sess.uiowa_access_token) {
    // We have a token, but is it expired?
    // Expire 5 minutes early to account for clock differences
    const expires = sess.cookie.expires;
    const FIVE_MINUTES = 300000;
    const expiration = new Date(parseFloat(expires - FIVE_MINUTES));
    
    // Token is fine, return next middleware
    if (expiration > new Date()) next();

    // Expired, refresh token and save values to session
    const refresh_token = sess.uiowa_refresh_token; 
    const new_token = await oauth_uiowa.accessToken
      .create({refresh_token: refresh_token})
      .refresh();

    // Save new token and continue with request
    saveTokenToSession(new_token, request);
    next();
  }
  
  // Check if this request is being sent to /auth with a valid token
  if (request.path.endsWith('/auth') && request.query.code) next();

  // No authenticated session? Expired?
  response.status(403).json({
    error: true,
    loggedIn: false,
    message: "You are not logged in"
  });
}


/**
 * Middleware function to retrieve a request's user information (OAuth2 token + IP Address).
 * @param {object} request - HTTP request originating from our frontend website.
 * @param {object} response - HTTP response to return to frontend.
 * @param {Function} next - Next function in our middleware stack.
 */
function retrieveSessionInfo(request, response, next) {
  // Localhost gets forwarded
  if (request.get('origin') === 'http://localhost:3000') next();

  try {
    // Define and load the session
    let sess = request.session;

    // Set all the info needed by later middleware in /events.
    // We need user access (oauth) token to create/update workflow package
    request.uiowa_access_token = sess.uiowa_access_token;

    // We need the user's IP address to create/update workflow package
    request.user_ip_address = (request.headers['x-forwarded-for'] ||
      request.connection.remoteAddress ||
      request.socket.remoteAddress ||
      request.connection.socket.remoteAddress).split(",")[0];

    // Add HawkID for login response
    request.hawkid = sess.hawkid;

    next();
  } catch (error) {
    // Error in retrieving our session
    response.status(502).json({
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
function clearTokensFromSession(request, response, next) {
  if (request.session) request.session.destroy();

  // Clear the frontend cookie regardless if they're logged in or not
  response.clearCookie('connect.sid');
  next();
}


module.exports.validParamCode         = validParamCode;
module.exports.getAuthURL             = getAuthURL;
module.exports.clearTokensFromSession = clearTokensFromSession;
module.exports.checkSessionExists     = checkSessionExists;
module.exports.authenticateCode       = authenticateCode;
module.exports.retrieveSessionInfo    = retrieveSessionInfo;