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
    assert.notDeepEqual(error, trueValue);
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
    runJoiTest('Should allow YYYY-MM-DD values. (2018-08-01)',   {date: "2018-08-01"}, scheme, Error);
    runJoiTest('Should NOT allow YYYY-M-DD values. (2018-8-01)',   {date: "2018-8-01"}, scheme, null);
    runJoiTest('Should NOT allow YYYY-MM-D values. (2018-11-1)',   {date: "2018-11-1"}, scheme, null);
    runJoiTest('Should allow YY-MM-DD values. (18-08-01)',   {date: "18-08-01"}, scheme, null);

    it('Shouldnt convert the date string to a new date format', function() {
      let raw_date = "2018-01-01";
      let res = Schema.date.validate(raw_date);
      assert.equal(res.value, raw_date);
    });
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

  // Setup and Accounting MFK
  describe('#Setup MFK', function() {
    let scheme = Schema.setup_mfk;
    
    runJoiTest('accepts an empty MFK dict when setup is not required',
      {
        setup_required: false,
        setup_mfk: {}
      }, scheme, Error);
    
    runJoiTest('accepts an complete MFK dict when setup is required',
      {
        setup_required: true,
        setup_mfk: {
          FUND    : '123',
          ORG     : '45',
          DEPT    : '1234',
          SUBDEPT : '12345',
          GRANT   : '12345678',
          INSTACCT: '1234',
          ORGACCT : '123',
          DEPTACCT: '12345',
          FUNC    : '12',
          COSTCNTR: '1234'
        }
      }, scheme, Error);

    runJoiTest('accepts an *required* MFK dict when setup is required',
      {
        setup_required: true,
        setup_mfk: {
          FUND    : '123',
          ORG     : '45',
          DEPT    : '1234',
          FUNC    : '12'
        }
      }, scheme, Error);

    runJoiTest('rejects an MFK dict with incorrect formats',
      {
        setup_required: true,
        setup_mfk: {
          ORG     : 45,
          DEPT    : '1234',
          FUNC    : '12'
        }
      }, scheme, Error);

    it('rejects a MFK when required key is missing', function() {
      let { error, val } = Joi.validate({
        setup_required: true,
        setup_mfk: {
          ORG     : '45',
          DEPT    : '1234',
          FUNC    : '12'
        }}, scheme);
      assert.notDeepEqual(error, null);
    });
  })

  /** Approved:
   * To use an index, we chose 'Binary' for the attribute. Thus, we need to 
   * convert our 'approved' attribute to binary. The schema defaults to 'false'
   * for the value, as it's optional (when we create the event the attribute is
   * created for us).
   */
  describe('#Approved', function() {
    let scheme = Schema.approved;

    runJoiTest('Should not allow actual postive boolean value',   {approved: true}, scheme, Error);
    runJoiTest('Should not allow actual negative boolean value',  {approved: false}, scheme, null);
    runJoiTest('Should not allow truthy values (1)',              {approved: 1}, scheme, null);
    runJoiTest('Should not allow falsy values (0)',               {approved: 0}, scheme, null);
    runJoiTest('Should not allow empty string',                   {approved: ''}, scheme, null);


    runJoiTest('Should allow "true"',      {approved: 'true'}, scheme, null);
    runJoiTest('Should allow "false"',      {approved: 'false'}, scheme, null);
    runJoiTest('Should allow undefined and return "false".',      {approved: undefined}, scheme, Error);
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
      setup_mfk: {
        FUND    : '',
        ORG     : '',
        DEPT    : '',
        SUBDEPT : '',
        GRANT   : '',
        INSTACCT: '',
        ORGACCT : '',
        DEPTACCT: '',
        FUNC    : '',
        COSTCNTR: ''
      },
      food_drink_required: false,
      food_provider: '',
      alcohol_provider: ''
    };

    runJoiTest(
      'Should validate a minimum viable object',
      info,
      schema, Error);

    it('Should NOT transform info fields after validating AND add approved', function() {
      let res = Joi.object().keys(schema).validate(info);
      let dynamo_obj = { ...info, approved: "false" };
      
      assert.deepEqual(res.value, dynamo_obj);
    });
  });

  describe('#Conditional schemas', function() {
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
      references_course: true,
      referenced_course: 'Introduction to Public Health',
      setup_required: true,
      setup_mfk: {
        FUND    : '111',
        ORG     : '11',
        DEPT    : '1111',
        SUBDEPT : '',
        GRANT   : '',
        INSTACCT: '',
        ORGACCT : '',
        DEPTACCT: '',
        FUNC    : '11',
        COSTCNTR: ''
      },
      food_drink_required: true,
      food_provider: 'Jimmy Johns',
      alcohol_provider: ''
    };

    runJoiTest(
      'Should validate an object with conditionals',
      info,
      schema, Error);

    it('accepts this typical POST data', function() {
      let postData = {
        alcohol_provider   : "",
        comments           : "",
        contact_email      : "",
        coph_email         : "",
        date               : "2018-09-04",
        end_time           : "7:00 PM",
        event_name         : "This is a testing title",
        food_drink_required: false,
        food_provider      : "",
        num_people         : 1,
        //package_id         : null,
        referenced_course  : "",
        references_course  : false,
        room_number        : "S030",
        setup_mfk          : {FUND: "111", ORG: "11", DEPT: "1111", GRANT: "", INSTACCT: "1111", ORGACCT: "", SUBDEPT: "", FUNC: "11", COSTCNTR: ""},
        setup_required     : true,
        start_time         : "6:30 PM",
        user_email         : "rlrson@uiowa.edu"
      };

      let { error, value } = Joi.validate(postData, schema);
      console.log(value);
      assert.deepEqual(error, null);
    });
  });
});