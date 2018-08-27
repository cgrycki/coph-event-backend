/**
 * Date Utility tests
 */

const assert = require('assert');
const {
  getFormattedDate,
  getFormattedDateTime
} = require('../api/utils/date.utils');


const expDate = new Date();
const expDateStr = "2018-08-27";
const expTime = "04:50PM";

describe('#Date Times', function() {
  it('Should format a date as a YYYY-MM-DD string', function() {
    let testStr = getFormattedDate(expDate);
    assert.equal(testStr, expDateStr);
  });

  it('Should format a datetime string from a date and a time string', function() {
    const testStr = getFormattedDateTime(expDate, expTime);
    assert.equal(testStr, `Mon Aug 27 2018 16:50:00 GMT-0500`);
  });
});