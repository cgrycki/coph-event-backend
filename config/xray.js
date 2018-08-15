/**
 * AWS Xray tracing middleware
 */

// Dependecies
var xrayAWS = require('aws-xray-sdk');
var xrayExpress = require('aws-xray-sdk-express');


// App Name
var UIOWA_ACCESS_KEY_ID = 'workflow-test' || process.env.UIOWA_ACCESS_KEY_ID +'-'+ process.env.WF_ENV;


// Used as middleware before the routes are assigned.
var startTrace = xrayAWS.express.openSegment(UIOWA_ACCESS_KEY_ID);


const requestTrace = (request, response, next) => {
  xrayAWS.captureAsyncFunc('send', function(subsegment) {
    // Capture AWS Credentials
    subsegment.addAnnotation("AWS_ACCESS_KEY_ID", `${process.env.AWS_ACCESS_KEY_ID}`);
    subsegment.addAnnotation("AWS_SECRET_ACCESS_KEY", `${process.env.AWS_SECRET_ACCESS_KEY}`);
    subsegment.addAnnotation("AWS_SESSION_TOKEN", `${process.env.AWS_SESSION_TOKEN}`);
    subsegment.addAnnotation("AWS_REGION", `${process.env.AWS_REGION}`);

    // Capture cookies and session information
    subsegment.addAnnotation("REQUEST_COOKIES", JSON.stringify(request.cookies));
    subsegment.addAnnotation("REQUEST_SESSION", JSON.stringify(request.session));

    // Capture request/response headers
    subsegment.addAnnotation("REQUEST_HEADERS", JSON.stringify(request.headers));
    subsegment.addAnnotation("RESPONSE_HEADERS", JSON.stringify(response.headers));

    // Close as instructed by AWS
    subsegment.close();
  });
  next();
};

// Make sure to close the xray after the routes are done! :: app.use(xrayAWS.express.closeSegment());
const endTrace = xrayAWS.express.closeSegment();


exports.startTrace   = startTrace;
exports.requestTrace = requestTrace;
exports.endTrace     = endTrace;