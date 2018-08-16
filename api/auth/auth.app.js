/**
 * Application Authentication
 */

/* Dependencies -------------------------------------------------------------*/
const oauth2       = require('simple-oauth2');
const { store }    = require('./auth.session');
const SID          = 'APPLICATIONTOKEN';
const ONE_HOUR     = 3600000;
const FIVE_MINUTES = 300000;


/* Credentials + Private Functions ------------------------------------------*/
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


/**
 * Returns an Access Token for authorizing application against Workflow.
 * 
 * @async
 * @returns {object} token - OAuth2 Access token for application credentials.
 * 
 * @example
 * 
 * ```
 * POST https://login.uiowa.edu/uip/token.page?
 *        grant_type=client_credentials&
 *        scope=YOUR_APPLICATION_SCOPE&
 *        client_id=YOUR_CLIENT_ID&
 *        client_secret=YOUR_CLIENT_SECRET
 *  =>
 * {
 *   "access_token": APPLICATION_ACCESS_TOKEN,
 *   "scope": YOUR_APPLICATION_SCOPE,
 *   "issued_to": YOUR_CLIENT_ID,
 *   "user_type": "client_id,
 *   "client_id": YOUR_CLIENT_ID,
 *   "expires_in":3599,
 *   "token_type":"bearer",   
 *   "authenticator":"OAuth2 Service Auth",
 *   "authenticationDomain":"PASSPORT_SERVICE"
 * }
 * ```
 */
async function authenticateApplication() {
  let result;
  const token_config = { scope: process.env.UIOWA_SCOPES };
  
  try {
    result = await oauth_uiowa.clientCredentials.getToken(token_config);
  } catch (error) {
    result = {
      error  : true,
      message: error.message,
      stack  : error.stack
    };
  }
  return result;
}


/**
 * Asynchronously reads our session store to retrieve Application Auth token.
 * 
 * @async
 * @returns {Promise} Promise - Asynchronous Store read.
 */
function getStore() {
  return new Promise(function(resolve, reject) {
    store.get(SID, function(err, sess) {
      if (err !== null) resolve({code: undefined, expires: undefined});
      resolve({ code: sess.uiowa_access_token, expires: sess.expires });
    });
  });
}


/**
 * Saves application OAuth2 token to DynamoDB sessions table.
 * @param {object} token - OAuth reponse from Workflow.
 */
function setAppAuthToken(token) {
  // Calculate the time token will expire, including window for diff.
  const expire_ms  = +token.expires_in * 1000;
  const expires_at = (new Date()).getTime() + parseFloat(expire_ms - FIVE_MINUTES);

  // Session configuration
  const application_session = {
    cookie            : { maxAge: ONE_HOUR },
    uiowa_access_token: token.access_token,
    expires           : expires_at
  };

  // Save application token and create a session
  let store_result;
  store.set(SID, application_session, (err, data) => { 
    if (err) store_result = err;
    else store_result = data;
  });
  return store_result;
}


/* Exported Functions -------------------------------------------------------*/
/**
 * Returns Application Auth token from session (if exists) or from REST call.
 * 
 * @async
 * @returns {string} code - OAuth2 Access token for application credentials.
 */
async function getAppAuthToken() {
  // Access session store to see if we have an application session.
  let app_auth = await getStore();

  // If we have a session, ensure it's not expired
  if (app_auth.code !== undefined) {
    const nowInSecs = (new Date()).getTime();
    const refresh = nowInSecs >= app_auth.expires;

    if (refresh) {
      // Get new token
      const new_token = await authenticateApplication();
      setAppAuthToken(new_token);
      return new_token.access_token;
    } else {
      return app_auth.code;
    };
  }
  // Otherwise RESTfully authenticate and save credentials to a new
  else {
    const token = await authenticateApplication();
    setAppAuthToken(token);
    return token.access_token;
  };
}


/**
 * Returns an URL for authorizing user against Workflow.
 * @returns {string} authURL - URL formatted with redirect endpoint and scopes.
 */
function getUserAuthURL() {
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
async function getUserAuthToken(auth_code) {
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
  return token;
}


/**
 * Saves a user's OAuth2 token to a DynamoDB session. 
 * @param {object} token - User's OAuth2 token information. 
 * @param {object} request - HTTP request from workflow login callback. 
 */
function setUserAuthToken(token, request) {
  let sess = request.session;
  
  // Save the access token to session
  sess.uiowa_access_token = token.token.access_token;
  // Save refresh token
  sess.uiowa_refresh_token = token.token.refresh_token;
  // Save the expiration time
  sess.expires = token.token.expires_in;

  // Save alphanumeric HawkID
  sess.hawkid = token.token.hawkid;

  // Save University ID interger
  sess.uid = token.token.uid;
}


/**
 * Destroys a User's session, unsetting the Oauth credentials in the process.
 * @param {object} request - HTTP Request object containing session information.
 * @param {object} response - HTTP Response object containing cookie information.
 */
function unsetUserAuthToken(request, response) {
  if (request.session) request.session.destroy();
  response.clearCookie('connect.sid');
  return; 
}


/* Exports ------------------------------------------------------------------*/
module.exports = {
  getAppAuthToken,
  getUserAuthURL,
  getUserAuthToken,
  setUserAuthToken,
  unsetUserAuthToken
};