/**
 * Schema Tests
 */

const assert = require('assert');
const Joi    = require('joi');
const Schema = require('../newEvents/newEvent.schema');


/**
 * Runs a Mocha test for us
 * @param {String} description String that will be printed out into the terminal
 * @param {Object} value Object holding the values Joi will test against
 * @param {Joi} schema Defined Joi schema
 * @param {} trueValue What the test should equal to
 */
const runJoiTest = (description, value, schema, trueValue) => {
  return it(description, function() {
    const {error, val} = Joi.validate(value, schema);
    assert.notEqual(error, trueValue);
  });
};


describe('Event Schema', function() {

  // User email: Required, U Iowa address
  describe('#user_email_schema()', function() {
    let scheme = Schema.user_email;

    runJoiTest('Should not validate a null value.',         {user_email: null}, scheme, null);
    runJoiTest('Should not validate an empty string.',      {user_email: ""}, scheme, null);
    runJoiTest('Should not allow an malformed email.',      {user_email: "test@uiowa"}, scheme, null);
    runJoiTest('Should not validate an NON U Iowa email.',  {user_email: "test@gmail.com"}, scheme, null);
    runJoiTest('Should validate an U Iowa email.',          {user_email: "test@uiowa.edu"}, scheme, Error);
  });

  // Contact email: Not required, email
  describe('#contact_email_schema()', function() {
    let scheme = Schema.contact_email;

    runJoiTest('Should not validate a null value.',  {contact_email: null}, scheme, null);
    runJoiTest('Should allow an empty string.',      {contact_email: ""}, scheme, Error);
    runJoiTest('Should allow an NON U Iowa email.',  {contact_email: "test@gmail.com"}, scheme, Error);
    runJoiTest('Should allow an U Iowa email.',      {contact_email: "test@uiowa.edu"}, scheme, Error);
  });

  // CoPH email
  describe('#coph_email_schema()', function() {
    let scheme = Schema.coph_email;

    runJoiTest('Should not validate a null value.',     {coph_email: null}, scheme, null);
    runJoiTest('Should allow an empty string.',         {coph_email: ""}, scheme, Error);
    runJoiTest('Should not allow an NON U Iowa email.', {coph_email: "test@gmail.com"}, scheme, null);
    runJoiTest('Should allow a U Iowa email.',          {coph_email: "test@uiowa.edu"}, scheme, Error);
  });
});