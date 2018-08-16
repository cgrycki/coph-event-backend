/**
 * Application Authentication
 */

/* Dependencies -------------------------------------------------------------*/
const oauth2    = require('simple-oauth2');
const { store } = require('./auth.session');
const SID       = 'APPLICATIONTOKEN';


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
 * POST https://login.uiowa.edu/uip/token.page?grant_type=client_credentials&scope=YOUR_APPLICATION_SCOPE&client_id=YOUR_CLIENT_ID&client_secret=YOUR_CLIENT_SECRET
 * =>
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
    
    // Save application token
    //setAppAuthToken(result);

  } catch (error) {
    result = {
      error  : true,
      message: error.message,
      stack  : error.stack
    };
  }

  return result;
}


// Sets the application auth token to a persistent session
function setAppAuthToken(token) {

  // Save a pointer to our DynamoDBStore
  const store = session.store;

  // Create a session
  const ONE_HOUR = 3600000,
        EIGHT_HOURS = 8 * ONE_HOUR,
        SID = 'APPPLICATIONSESSION';

  const application_session = {
    cookie: { maxAge: EIGHT_HOURS },
    uiowa_access_token: token.token.access_token,
    expires: ONE_HOUR
  };

  // Save application token to session
  let result = store.set(SID, session, (err, data) => {
    if (err) return { 
      error: true, 
      message: err.message,
      stack: err.stack
    };
    else return {
      error: false,
      data: data
    };
  });

  return result;
}


/**
 * Saves application OAuth2 token to DynamoDB sessions table.
 * @param {object} token - OAuth reponse from Workflow.
 */
function setAppAuthToken(token) {
  // Session configuration
  const ONE_HOUR = 3600000,
    application_session = {
      cookie            : { maxAge: ONE_HOUR },
      uiowa_access_token: token.access_token
    };

  // Save application token and create a session
  let store_result;
  store.set(SID, application_session, (err, data) => { 
    if (err) store_result = err;
    else store_result = data;
  });
  return store_result;
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
      if (err !== null) return reject(undefined);
      resolve(sess.uiowa_access_token);
    });
  });
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
  let code = await getStore();
  if (code !== undefined) return code;
  else {
    // Wait for application to authenticate against Workflow
    const token = await authenticateApplication();

    // Save to session
    const set_result = setAppAuthToken(token);

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