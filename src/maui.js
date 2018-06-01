/**
* Class to handle validating an event time via the U. Iowa MAUI API.
*/
const request = require('request-promise');
 
class MauiScheduler {
  static getAvailability(timestamp) {
    /**
     * Indicates whether or not the CPHB's lecture auditoriums are free at a 
     * given time.
     * @param {int} timestamp
     * @returns {boolean} available: Indicates whether timestamp is open or not.
     */
    // Create date string from timestamp (for querying API URL)
    const timestampDate = this.getDate(timestamp);

    // Create time string from timestamp (for filtering API response)
    const timestampTime = this.getTime(timestamp);

    // For each of the rooms, create a URL for the specified date.
    ['N120', 'N110'].forEach(room => {
      let roomURL = this.getURL(timestampDate, room);
      let roomEvents = this.getRoomAvailibility(roomURL);

      console.log(roomURL, roomEvents);
    });
    return timestamp;
  }

  static getDate(timestamp) {
    /**
     * Creates a 'Y-m-d' string from an interger timestamp.
     * @param {int} timestamp
     * @returns {string} date
     */
    // Create a new JS Date object
    const utcDate = new Date(0)
    utcDate.setUTCSeconds(timestamp);
    
    // Leverage the built-in functions, building string piece by piece.
    const timestampYear  = utcDate.getFullYear();
    const timestampMonth = String(utcDate.getMonth() + 1).padStart(2, '0');
    const timestampDay   = utcDate.getDate();
    
    // Concat date pieces into string
    const dateString     = timestampYear + '-' + timestampMonth + 
      '-' + timestampDay; 

    return dateString;
  }

  static getTime(timestamp) {
    /**
     * 
     */
    return timestamp;
  }

  static getURL(date, room) {
    /**
     * Returns a formatted URL for querying the MAUI API.
     * @param {string} date
     * @param {string} room 
     * @returns {string} mauiURL
     */
    const baseURL = 'https://www.maui.uiowa.edu/maui/api/pub/registrar/courses/AstraRoomSchedule/';

    // The MAUI URL takes the form... /{START_DATE}/{END_DATE}/{BUILDING}/{ROOM}
    // The END_DATE must be greater than the START_DATE
    const mauiURL = baseURL + date + '/' + date + '/CPHB/' + room;
    return mauiURL;
  }

  static getRoomAvailibility(url) {
    /**
     * Sends an request to given url and returns response.
     */
    let events;
    let options = {
      method: 'GET',
      url: url,
      json: true
    };

    // Call the MAUI API endpoint, returning the list of events.
    let mauiReponse = request(options, (error, reponse, body) => {
      if (error) throw error;
      if (response.statusCode === 200) events = body;
      else if (response.statusCode === 204) events = false;
      console.log(typeof(body));
    });

    // 
    return events;
  }
}

console.log(MauiScheduler.getAvailability(1526515200));