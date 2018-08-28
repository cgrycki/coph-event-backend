const rp                    = require('request-promise');     // For REST calls
const { getFormattedDate,
  getFormattedDateTime }    = require('../utils/date.utils'); // For dates
const querystring           = require('querystring');         // For creating queries


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
 * Creates a query string from an object
 * @param {Object} params - Object containing query parameters: {field: value} OR {field: [value1, value2]}
 * @returns {string} query - String formatted as 'field=value' OR 'field=value1&field=value2'
 */
MAUI.prototype.constructQuery = function(params) {
  const query = querystring.stringify(params);
  return query;
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
    response = { error: true, message: err.message, stack: err.stack };
  };

  return response;
}


/**
 * Returns a list of events for a given room and start/end dates.
 * @param {string} roomNumber - Room key matching Astra records.
 * @param {string} start - Start date formatted as YYYY-MM-DD.
 * @param {string} end - End date formatted as YYYY-MM-DD.
 * @returns {(list[object]|object)} data - List or error.
 */
MAUI.prototype.getRoomSchedule = async function(roomNumber, start, end) {
  // Create the room schedule endpoint
  const uri = `${this.base_uri}/pub/registrar/courses/AstraRoomSchedule/` +
    `${start}/${end}/CPHB/${roomNumber}`;

  const options = {
    method : 'GET',
    uri    : uri,
    headers: this.headers(),
    json   : true
  };

  const result = await this.request(options);
  return result;
}


MAUI.prototype.getSessionID = async function(date) {
  const uri = `${this.base_uri}/pub/registrar/sessions/by-date?date=${date}`;

  const options = {
    method : 'GET',
    uri    : uri,
    headers: this.headers(),
    json   : true
  };

  const session_info = await this.request(options);
  const session_id   = session_info.legacyCode;
  return session_id;
}


/**
 * Returns a REST call to MAUI's AstraRoomSchedule endpoint as a Promise.
 * @param {string} roomNumber Room ID from ASTRA
 * @param {string} start Starting date of query. Formatted as 'YYYY-MM-DD'.
 * @param {string} end Ending date of query. Same format as start.
 */
MAUI.prototype.getRoomPromise = async function(roomNumber, start, end) {
  const options = {
    method : 'GET',
    headers: this.headers(),
    json   : true,
    uri    : `${this.base_uri}/pub/registrar/courses/AstraRoomSchedule/${start}/${end}/CPHB/${roomNumber}`
  };

  return rp(options);
}


/**
 * Formats an event return by MAUI.
 * @param {Object} evt MAUI event object
 * @param [evt.buildingCode] {string} Building ID from MAUI.
 * @param [evt.roomNumber] {string} Room ID for room in building
 * @param [evt.date] {string} Date formatted as 'July 12, 2018'
 * @param [evt.startTime] {string} Startimg time of event formatted as '3:00PM    ' 
 * @param [evt.endTime] {string} Ending time of event. 
 * @param [evt.title] {string} Title of event
 * @param [evt.counter] {string} String formatted number. 
 * @returns {Object} parsedEvt - Event object formatted for our frontend application.
 */
MAUI.prototype.parseEvent = function(evt) {
  // Parse dates so that the times can be used natively by frontend
  const evtDate = getFormattedDate(evt.date);
  const evtStart= getFormattedDateTime(evt.date, evt.startTime.trim());
  const evtEnd  = getFormattedDateTime(evt.date, evt.endTime.trim());

  // Create the new frontend object
  const parsedEvt = {
    evt_number : +evt.counter,
    room_number: evt.roomNumber,
    date       : evtDate,
    start_time : evtStart,
    end_time   : evtEnd,
    event_name : evt.title,
    id         : evt.activityId
  };

  return parsedEvt;
}


/**
 * Maps a list of rooms and returns all of their schedules from [start-end]
 * @param {array[string]} rooms List of Room IDs to look up events for.
 * @param {string} start Starting date of query. Formatted as 'YYYY-MM-DD'.
 * @param {string} end Ending date of query (inclusive), same format as start.
 */
MAUI.prototype.getSchedules = async function(rooms, start, end) {
  // Map the list of roomNumbers as string to a RESTful Promise
  const eachSchedule = await Promise.all(rooms.map(r => {
    const schedule = this.getRoomPromise(r, start, end)
      .then(res => res)
      .catch(err => console.log(err));
    return schedule;
  }));

  // Merge the lists of schedules (list of events) together
  // and filter out responses with no events (undefined).
  // Then parse all of the valid events. 
  const allSchedules = [].concat.apply([], eachSchedule.filter(e => e !== undefined));

  const ourSchedules = allSchedules.map(evt => this.parseEvent(evt));

  return ourSchedules;
}



/**
 * Returns the MAUI SessionID of a YYYY-MM-DD date.
 * @param {(string|Date)} date - Input to format
 * @returns {string} session_id - MAUI SessionID identifying an academic session (Spring 2018, Summer 2012, etc...)
 */
MAUI.prototype.getSessionID = async function(date) {
  const uri = `${this.base_uri}/pub/registrar/sessions/by-date?date=${date}`;

  const options = {
    method : 'GET',
    uri    : uri,
    headers: this.headers(),
    json   : true
  };

  const session_info = await this.request(options);
  const session_id   = session_info.legacyCode;
  return session_id;
}


/**
 * Returns a list of courses matching param `courseText`.
 * @param {string} courseText - Text to search course title and text.
 */
MAUI.prototype.getCourses = async function(courseText) {
  // We need a sessionID to make a search. Default to current date+session
  const todaysDate = getFormattedDate();
  const sessionID  = await this.getSessionID(todaysDate);

  // Create the query and then the URI
  const query = this.constructQuery({
    sessionCode      : sessionID,
    titleAndTextQuery: courseText,
    sort             : 'HIGHEST_SCORE'
  });
  const uri = `${this.base_uri}pub/registrar/course/search?${query}`;

  // REST options + call
  const options = {
    method : 'GET',
    uri    : uri,
    headers: this.headers(),
    json   : true
  };
  const courses = await this.request(options);

  // Parse courses to slim down 
  const parsedCourses = this.parseCourses(courses, sessionID);
  return parsedCourses
}


/**
 * Filters and parses a course search result
 */
MAUI.prototype.parseCourses = function(courses, session) {
  // Sanity check for REST result
  if ((courses.error) || (!courses.hasPayload) ||(courses.payload.length === 0)) return [];

  // Filter courses that aren't currently being offered
  /*const currentCourses = courses.payload.filter(c => {
    const lastSessionId = (c.lastTaughtSession !== null) ?
      c.lastTaughtSession.sessionCode :
      c.sessionInfo.sessionCode;
    return lastSessionId === session;
  });*/
  const currentCourses = courses.payload.filter(c => {
    return c.titles.hasOwnProperty('CATATLOG') || c.titles.hasOwnProperty('FULL');
  });

  // Map only the attributes we need
  const parsedCourses = currentCourses.map(c => {
    // Find titles from old and new courses
    const title = (c.titles.hasOwnProperty('CATALOG')) ? c.titles.CATALOG : c.titles.FULL;

    // Get course descriptions
    const text = (c.texts.hasOwnProperty('GENERAL_CATALOG')) ? c.texts.GENERAL_CATALOG : '';

    // Mercifully all courses have a course ID
    const courseId = c.courseId;

    const attrs = { title, text, courseId };
    return attrs;
  });

  return parsedCourses;
}
































/* Course response object has the following shape: {
      error: false,
      hasPayload: {true | false},
      message: null,

      page: 1, (number indicating cursor index)
      pageCount: 1, (length of cursors)
      pageSize: 0, (???)
      cursors: [0], (or [0, 10, 20] from size param)
      
      recordCount: n (# returned),
      payload: [
        {
          adminHomeAcademicUnit: {
            generalCatalogUrl: 'https://catalog.registrar.uiowa.edu/...',
            id: 541,
            name: 'Computer Science'
          },
          adminHomeCourseSubject: {
            additionalProperties: {},
            description: 'Computer Science',
            id: 351,
            naturalKey: 'CS',
            shortDescription: 'Computer Science',
            sortOrder: 1540,
            webDescription: null
          },
          adminHomeIdentity: {
            courseIdentityId: 158661
            courseNumber: "3330"
            courseSubject: "CS"
            departmentCode: "22C"
            legacyCourseNumber: "031"
          },
          attributes: {
            courseLevel: {...},
            id: 281929,
            ...
          },
          courseID: 74161,
          identities: [{...}],
          texts: {
            COURSE_INFORMATION: '...',
            COURSE_PREREQ: '...',
            GENERAL_CATALOG: '...'
          },
          titles: {
            CATALOG: '',
            COURSE_PREREQ: '',
            SHORT: ''
          }
        },
        {...}, {...}
      ]
    }
  */

module.exports = new MAUI();