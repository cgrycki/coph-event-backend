/**
 * Authentication Utilities/Middleware
 * TBD: Office365 credentials and authentication 'flow'
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
  }
});


/* Parameters ---------------------------------------------------------------*/
const validParamCode = check('code').exists().isAlphanumeric();


/* Utilities ----------------------------------------------------------------*/
// Get authorization URL for logging in and redirecting back to  API w/ code.
function getAuthURL() {
  const returnVal = oauth_uiowa.authorizationCode.authorizeURL({
    type         : 'web_server',
    response_type: 'code',
    redirect_uri : process.env.REDIRECT_URI,
    scope        : process.env.UIOWA_SCOPES
  });
  return returnVal;
}

// Preform server handshake with code from getAuthURL(), saves callback data to session
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

// Saves a user token values to their session
function saveTokenToSession(token, request) {
  /* Token = {
    "access_token":"USER_ACCESS_TOKEN",
    "refresh_token":"USER_REFRESH_TOKEN",
    "token_type":"bearer",
    "expires_in":2592000,
    "params":{
      "hawkID": USER_HAWKID,
      "uid": USER_UNIVERSITY_ID,
      "scope": YOUR_SCOPE,
      "issued_to" => YOUR_CLIENT_ID
    }
  }*/
  let sess = request.session;
  
  // Save the access token to session
  sess.uiowa_access_token = token.token.access_token;
  // Save refresh token
  sess.uiowa_refresh_token = token.token.refresh_token;
  // Save the expiration time
  sess.expires_in = token.token.expires_in;

  // Save alphanumeric HawkID
  //sess.hawkid = token.token.hawkid;
  // Save University ID interger
  //sess.uid = token.token.uid;
}


/* Middlewares --------------------------------------------------------------*/
// Authentication handshake with the U. Iowa servers
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
      return next();
    } 
    catch (error) {
      response.status(500).json({ 
        message: 'Error while authenticating token',
        error: error.message, 
        stack: error.stack,
        token: token
      });
    }
  } else {
    // No authentication code. Redirect to login URL 
    response.status(403).redirect(getAuthURL());
  }
}

// Checks if a request is verified or not. 
function checkSession(request, response, next) {
  let sess = request.session;

  // Check if they've been here before
  if (sess && sess.uiowa_access_token) {
    // We have a token, but is it expired?
    // Expire 5 minutes early to account for clock differences
    /*const expires = sess.cookie.expires;
    const FIVE_MINUTES = 300000;
    const expiration = new Date(parseFloat(expires - FIVE_MINUTES));
    
    // Token is fine, return next middleware
    if (expiration > new Date()) next();

    // Expired, refresh token and save values to session
    const refresh_token = sess.uiowa_refresh_token; 
    ASYNC const new_token = await oauth_uiowa.accessToken.create({refresh_token: refresh_token}).refresh();
    saveTokenToSession(new_token, request);
    */
    next();
  }
  
  // Check if this request is being sent to /auth with a valid token
  if (request.path.endsWith('/auth') && request.query.code) next();

  // No authenticated session token? send them to entry point
  response.status(403).redirect(getAuthURL());
}

// Middelware refreshing a session auth, and passing the user details for /events
function retrieveSession(request, response, next) {
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

    next();
  } catch (error) {
    // Error in retrieving our session
    response.status(502).json({
      error: error.message,
      stack: error.stack
    });
  }
}

// Clears a user's session from the database on logout/timeout
function clearTokensFromSession(request, response, next) {
  if (request.session && request.session.uiowa_access_token) {
    request.session.destroy();
  }

  // Clear the frontend cookie regardless if they're logged in or not
  response.clearCookie('connect.sid');
  next();
}


module.exports.validParamCode         = validParamCode;
module.exports.getAuthURL             = getAuthURL;
module.exports.clearTokensFromSession = clearTokensFromSession;
module.exports.checkSession           = checkSession;
module.exports.authenticateCode       = authenticateCode;
module.exports.retrieveSession        = retrieveSession;