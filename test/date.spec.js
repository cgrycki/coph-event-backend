/**
 * Date Utility tests
 */

const assert = require('assert');
const {
  getFormattedDate,
  getFormattedDateTime,
  getSharepointFormat
} = require('../api/utils/date.utils');


const expDate = new Date();
const expDateStr = "2018-09-26";
const expTime = "04:50PM";

describe('#Date Times', function() {
  it('Should format a date as a YYYY-MM-DD string', function() {
    let testStr = getFormattedDate(expDate);
    assert.equal(testStr, expDateStr);
  });

  it('Should format a datetime string from a date and a time string', function() {
    const testStr = getFormattedDateTime('September 27, 2018', expTime);
    assert.equal(testStr, `2018-09-27T16:50:00-05:00`);
  });

  it('formats date and time strings in Sharepoint format', function() {
    const sharepointCorrect = '9/26/2018 4:50 PM';
    const sharepointTest    = getSharepointFormat(expDateStr, '4:50 PM');

    assert.equal(sharepointTest, sharepointCorrect);
  })
});