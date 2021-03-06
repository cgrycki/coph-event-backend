/**
 * Testing our MAUI restful functions
 */

const assert = require('assert');
const MAUI   = require('../api/maui/MAUI');
const { getFormattedDate } = require('../api/utils/date.utils');


describe('#MAUI REST class', function() {
  describe('Headers', function() {
    it('Should create a header', function() {
      const correct_header = {
        'Accept': 'application/json',
        'Content-Type': 'application/x-www-form-urlencoded'
      };
      const test_header = MAUI.headers();
      
      assert.deepEqual(test_header, correct_header);
    });
  });

  describe('Queries', function() {
    it('Creates an accurate query for searching courses', function() {
      let params = {
        sessionCode: 72,
        titleAndTextQuery: 'algorithms',
        sort: 'HIGHEST_SCORE'
      };

      let query = MAUI.constructQuery(params);
      let correctQuery = 'sessionCode=72&titleAndTextQuery=algorithms&sort=HIGHEST_SCORE';

      assert.equal(query, correctQuery);
    });
  });

  describe('Room schedule', function() {
    it('Should asynchronously fetch a room schedule.', async function() {
      let faux_room  = 'N110',
          faux_start = '2018-08-27',
          faux_end   = '2018-08-27';
  
      let response = await MAUI.getRoomSchedule(faux_room, faux_start, faux_end);
      assert.equal(3, response.length);
    });
  });

  describe('Room schedules (multiple)', function() {
    let startDate = '2018-07-01';
    let endDate   = '2018-08-10';
    let oneRoom   = 'N110';
    let moreRooms = ['N110', 'S030', 'C410'];

    it('Returns one rooms schedule.', async function() {
      const evts = await MAUI.getSchedules([oneRoom], startDate, endDate);
      assert.ok(evts);
    });

    it('Returns multiple rooms\' schedules', async function() {
      const evts = await MAUI.getSchedules([moreRooms], startDate, endDate);
      assert.ok(evts);
    });
  });

  describe('Academic Sessions', function() {
    it('Should asynchronously fetch the session ID given a date.', async function() {
      let faux_session_date = "2018-09-27";
      let correct_sess_id   = "20183";
      let restful_sess_id   = await MAUI.getSessionID(faux_session_date);

      assert.equal(restful_sess_id, correct_sess_id);
    });

    it('Should return the session ID created by a helper function', async function() {
      let todaysDate = getFormattedDate();
      let sid = await MAUI.getSessionID(todaysDate);

      assert.ok(sid);
    });
  });

  describe('Courses', function() {
    const courseText = 'algorithms';

    it('Should return a list of courses given just a query string', async function() { 
      const course = 'algorithms';
      const courses = await MAUI.getCourses(course);
      
      assert.ok(courses);
    });
  });
});