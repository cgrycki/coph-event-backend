/**
 * Testing our MAUI restful functions
 */

const assert = require('assert');
const MAUI   = require('../api/maui/MAUI');

describe('MAUI REST class', function() {

  // Headers
  describe('#headers', function() {
    it('Should create a header', function() {
      const correct_header = {
        'Accept': 'application/json',
        'Content-Type': 'application/x-www-form-urlencoded'
      };
      const test_header = MAUI.headers();
      
      assert.deepEqual(test_header, correct_header);
    });
  });

  describe('#room schedule', function() {
    it('Should asynchronously fetch a room schedule.', async function() {
      let faux_room  = 'N110',
          faux_start = '2018-08-27',
          faux_end   = '2018-08-27';
  
      let response = await MAUI.getRoomSchedule(faux_room, faux_start, faux_end);
      assert.equal(3, response.length);
    });
  });

  describe('#sessions', function() {
    it('Should asynchronously fetch the session ID given a date.', async function() {
      let faux_session_date = "2018-09-27";
      let correct_sess_id   = "20183";
      let restful_sess_id   = await MAUI.getSessionID(faux_session_date);

      assert.equal(restful_sess_id, correct_sess_id);
    });
  });
});