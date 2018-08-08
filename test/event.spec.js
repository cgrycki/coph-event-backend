/**
 * Schema Tests
 */

const assert = require('assert');
const Joi    = require('joi');
const Schema = require('../api/events/event.schema');


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


describe('Event Schema (Individual)', function() {

  // User email: Required, U Iowa address
  describe('#user_email', function() {
    let scheme = Schema.user_email;

    runJoiTest('Should not validate a null value.',         {user_email: null}, scheme, null);
    runJoiTest('Should not validate an empty string.',      {user_email: ""}, scheme, null);
    runJoiTest('Should not allow an malformed email.',      {user_email: "test@uiowa"}, scheme, null);
    runJoiTest('Should not validate an NON U Iowa email.',  {user_email: "test@gmail.com"}, scheme, null);
    runJoiTest('Should validate an U Iowa email.',          {user_email: "test@uiowa.edu"}, scheme, Error);
  });

  // Contact email: Not required, email
  describe('#contact_email', function() {
    let scheme = Schema.contact_email;

    runJoiTest('Should not validate a null value.',  {contact_email: null}, scheme, null);
    runJoiTest('Should allow an empty string.',      {contact_email: ""}, scheme, Error);
    runJoiTest('Should allow an NON U Iowa email.',  {contact_email: "test@gmail.com"}, scheme, Error);
    runJoiTest('Should allow an U Iowa email.',      {contact_email: "test@uiowa.edu"}, scheme, Error);
  });

  // CoPH email: Optional, but must be U. Iowa address
  describe('#coph_email', function() {
    let scheme = Schema.coph_email;

    runJoiTest('Should validate a null value as an empty string.',     {coph_email: null}, scheme, Error);
    runJoiTest('Should allow an empty string.',         {coph_email: ""}, scheme, Error);
    runJoiTest('Should not allow an NON U Iowa email.', {coph_email: "test@gmail.com"}, scheme, null);
    runJoiTest('Should allow a U Iowa email.',          {coph_email: "test@uiowa.edu"}, scheme, Error);
  });

  // Date: Required, must be YYYY-MM-DD format.
  describe('#Date', function() {
    let scheme = Schema.date;

    runJoiTest('Should not validate a null value.', {date: null}, scheme, null);
    runJoiTest('Should not allow an empty string.', {date: ""}, scheme, null);
    runJoiTest('Should not allow malformed values', {date: "Aug 1st, 2018"}, scheme, null);
    runJoiTest('Should allow YYYY-MM-DD values.',   {date: "2018-08-01"}, scheme, Error);
  });

  // Time: Required, in H:MM A format
  describe('#Time', function() {
    let scheme = Schema.time;

    runJoiTest('Should not validate a null value.', {time: null}, scheme, null);
    runJoiTest('Should not allow an empty string.',     {time: ""}, scheme, null);
    runJoiTest('Should not allow HH:MM format.',    {time: "23:00"}, scheme, null);
    runJoiTest('Should allow H:MM A format (with two hour digits).',       {time: "12:30 PM"}, scheme, Error);
    runJoiTest('Should allow H:MM A format (with one hour digits).',       {time: "8:30 PM"}, scheme, Error);
    runJoiTest('Should allow H:MM A format (with AM).',       {time: "12:30 AM"}, scheme, Error);
    runJoiTest('Should allow H:MM A format (with PM).',       {time: "10:30 PM"}, scheme, Error);
    runJoiTest('Should allow "9:30 AM"',                {time: " 9:30 AM"}, scheme, Error)
  });

  // Course reference
  describe('#Course References', function() {
    let scheme = Schema.course;

    runJoiTest(
      'Should not allow empty values for both course values',
      {references_course: null, referenced_course: null},
      scheme, null);
    runJoiTest(
      'Should not allow empty values for references_course',
      {references_course: null, referenced_course: ""},
      scheme, null);
    runJoiTest(
      'Should allow empty values for referenced_course',
      {references_course: false, referenced_course: null},
      scheme, null);
    runJoiTest(
      'Should allow empty string when references_course is false',
      {references_course: false, referenced_course: ""},
      scheme, Error);
    runJoiTest(
      'Should NOT allow empty string when references_course is true',
      {references_course: true, referenced_course: ""},
      scheme, null);
    runJoiTest(
      'Should allow populated string when references_course is true',
      {references_course: false, referenced_course: "Introduction to Public Health"},
      scheme, Error);
  });

  // Setup
  describe('#Setup', function() {
    let scheme = Schema.setup;

    runJoiTest(
      'Should not allow empty values for both course values',
      {setup_required: null, setup_mfk: null},
      scheme, null);
    runJoiTest(
      'Should not allow empty values for setup_required',
      {setup_required: null, setup_mfk: ""},
      scheme, null);
    runJoiTest(
      'Should not allow empty values for setup_mfk',
      {setup_required: false, setup_mfk: null},
      scheme, null);
    runJoiTest(
      'Should allow empty string when setup_required is false',
      {setup_required: false, setup_mfk: ""},
      scheme, Error);
    runJoiTest(
      'Should NOT allow empty string when setup_required is true',
      {setup_required: true, setup_mfk: ""},
      scheme, null);
    runJoiTest(
      'Should allow populated string when setup_required is true',
      {setup_required: true, setup_mfk: "1234567890"},
      scheme, Error);
  });
});

describe('Event Schema (Total)', function() {
  let schema = Schema.ModelSchema;

  describe('#Minimum viable schema', function() {
    let info = {
      user_email: 'test@uiowa.edu',
      contact_email: '',
      coph_email: '',
      event_name: 'Curing Cancer',
      comments: '',
      date: '2018-08-01',
      start_time: '8:00 AM',
      end_time: '12:00 PM',
      room_number: 'XC100',
      num_people: 1,
      references_course: false,
      referenced_course: '',
      setup_required: false,
      setup_mfk: '',
      food_drink_required: false,
      food_provider: '',
      alcohol_provider: ''
    };

    runJoiTest(
      'Should validate a minimum viable object',
      info,
      schema, Error);
  });
});