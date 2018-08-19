/**
 * Tests our Utility functions
 */

const assert            = require('assert');
const Joi               = require('joi');
const Schema            = require('../api/events/event.schema');
const {
  extractWorkflowInfo,
  shouldUpdateEvent
}                       = require('../api/utils/');


// Create example event entry
const exmp_old = {
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
  alcohol_provider: '',
  approved: false
};


describe("Utility Functions", function() {
  const correct_slim_info = {
    approved      : exmp_old.approved.toString(),
    date          : exmp_old.date,
    user_email    : exmp_old.user_email,
    contact_email : exmp_old.contact_email,
    setup_required: exmp_old.setup_required.toString(),
    room_number   : exmp_old.room_number
  };

  it("Should extract Workflow information correctly", function() {
    let slimmed_exmp_info = extractWorkflowInfo(exmp_old);
    assert.deepEqual(slimmed_exmp_info, correct_slim_info);
  });

  it("Should correctly detect that a package does not need updating", function() {
    let slimmed_exmp_info = extractWorkflowInfo(exmp_old);
    let shouldUpdateWorkflow = shouldUpdateEvent(slimmed_exmp_info, correct_slim_info);
    assert.equal(shouldUpdateWorkflow, false);
  });

  it("Should correctly detect that a package has changed based on approval.", function() {
    let new_slim_info = { ...correct_slim_info, approved: true };
    let shouldUpdateWorkflow = shouldUpdateEvent(correct_slim_info, new_slim_info);
    assert.equal(shouldUpdateWorkflow, true);
  });

  it("Should correctly detect that a package has changed based on date.", function() {
    let new_slim_info = { ...correct_slim_info, date: "2020-08-20" };
    let shouldUpdateWorkflow = shouldUpdateEvent(correct_slim_info, new_slim_info);
    assert.equal(shouldUpdateWorkflow, true);
  });

  it("Should correctly detect that a package has changed based on contact email.", function() {
    let new_slim_info = { ...correct_slim_info, contact_email: "new-email@gmail.com" };
    let shouldUpdateWorkflow = shouldUpdateEvent(correct_slim_info, new_slim_info);
    assert.equal(shouldUpdateWorkflow, true);
  });
});