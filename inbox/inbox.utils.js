const FRONTEND_URI = process.env.FRONTEND_URI;

/**
 * Creates a frontend redirect URL for a given package
 */
const getInboxRedirect = (package_id, signature_id=undefined) => {
  // Create our base URL
  let base_uri = `${FRONTEND_URI}/events/${package_id}`;
  if (signature_id !== undefined) return `${base_uri}/${signature_id}`;
  else return base_uri;
};




exports.getInboxRedirect = getInboxRedirect;