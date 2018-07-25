/**
 * Custom CORS. 
 * 
 */

// List of domains we will accept
const whitelist_domains = [
  process.env.REDIRECT_URI, 
  process.env.FRONTEND_URI, 
  'uiowa.edu',
  'http://localhost:3000'
];

// List of Headers we will accept
const whitelist_headers = [
  'Authorization', 'Content-Type', 'Content-type', 'x-api-key',
  'Origin', 'origin', 'X-Amz-Date', 'X-Requested-With', 'x-requested-with', 
  'Access-Control-Request-Headers', 'Access-Control-Request-Method', 
  'Access-Control-Request-Origin', 'Access-Control-Request-Credentials',
  'Access-Control-Allow-Origin', 'Access-Control-Allow-Credentials',
  'access-control-allow-origin', 'access-control-allow-credentials',
  'Cache-Control', 'cache-control'
];

// Whitelist of HTTP Methods
const whitelist_methods = 'GET,PUT,POST,DELETE,PATCH,OPTIONS';

// CORS options for npm's CORS package
const cors_options = {
  credentials   : true,
  origin        : whitelist_domains,
  methods       : whitelist_methods,
  allowedHeaders: whitelist_headers
};


exports.whitelist_domains = whitelist_domains;
exports.whitelist_headers = whitelist_headers;
exports.whitelist_methods = whitelist_methods;
exports.cors_options      = cors_options;
