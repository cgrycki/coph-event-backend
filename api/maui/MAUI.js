const rp = require('request-promise');


/**
 * MAUI Restful function class
 * Taken from [Maui Documentation](https://api.maui.uiowa.edu/maui/pub/webservices/documentation.page)
 */
class MAUI {
  constructor() {
    this.base_uri = 'https://api.maui.uiowa.edu/maui/api/';
  };
}


/**
 * Creates headers for interacting with the MAUI API.
 * @returns {object} header - Headers with accent and content type.
 */
MAUI.prototype.headers = function() {
  const header = {
    Accept: 'application/json',
    'Content-Type': 'application/x-www-form-urlencoded'
  };

  return header;
}


/**
 * Makes an asynchronous request to MAUI.
 * @param {object} options - Request Promise options for REST call.
 * @returns {object} response - Request response object.
 */
MAUI.prototype.request = async function(options) {
  let response;
  try {
    response = await rp(options);
  } catch (err) {
    response = err;
    response.error = true;
  };

  return response;
}


/**
 * Returns a list of events for a given room and start/end dates.
 * @param {string} roomNumber - Room key matching Astra records.
 * @param {string} start - Start date formatted as YYYY-MM-DD.
 * @param {string} end - End date formatted as YYYY-MM-DD.
 * @returns {list[object]} data - List or error.
 */
MAUI.prototype.getRoomSchedule = async function(roomNumber, start, end) {
  // Create the room schedule endpoint
  const uri = `${this.base_uri}/pub/registrar/courses/AstraRoomSchedule/` +
    `${start}/${end}/CPHB/${roomNumber}`;

  const options = {
    method: 'GET',
    uri: uri,
    headers: this.headers()
  };

  const result = await this.request(options);
  const data = JSON.parse(result);
  return data;
}


/**
 * @todo
 * @param {string} courseText - Text to search course title and text.
 */
MAUI.prototype.getCourses = async function(courseText) {}

const maui = new MAUI();
module.exports = maui;