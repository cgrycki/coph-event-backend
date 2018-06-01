/**
* Mongoose Model for MongoDB.
*/

// Dependencies
var mongoose = require('mongoose');
var Schema   = mongoose.Schema;

// Schema
var eventSchema = new Schema({

  /* Administrative attributes */
  // Unique key
  eventID: {
    type: Schema.Types.ObjectId, 
    index: true, 
    unique: true,
    required: true
  },
  // Indicates if event has been approved by Facilities
  approved: {
    type: Boolean,
    required: true,
    default: false
  },
  // Comments by approver (optional)
  approvalComments: String,
  // Timestamp, immutable
  created: {
    type: Date, 
    default: Date.now
  },
  // Timestamp
  updated: {
    type: Date, 
    default: Date.now
  },

  /* Event information attributes. */
  // Name of event (e.g. 'Curing Cancer')
  name: {
    type: String,
    required: true
  },
  // Date of event
  date: {
    type: Date,
    required: true
  },
  // Event's time of day
  time: {
    type: String,
    required: true
  },
  // Comments + instructions given by user
  comments: {
    type: String,
    required: true
  },
  // User email
  email: {
    type: String,
    required: true
  },

  /* Layout information for event */
  chairsPerTable: {
    type: Number,
    min: 6,
    max: 8
  },
  // X, Y positions of the furniture items
  circleTables:  [{ x: Number, y: Number }],
  rectTables: [{ x: Number, y: Number }],
  barTables: [{ x: Number, y: Number }],
  posterBoards: [{ x: Number, y: Number }],
  trashCans: [{ x: Number, y: Number }]
});


// On every save, update the timestamp
eventSchema.pre('save', function(next) {
  // Get current date
  let currentDate = new Date();

  // Change the updated field
  this.updated = currentDate;

  // If we're creating an event add the creation date
  if (!this.created) this.created = currentDate;

  next();
});


// Virtual attributes


module.exports = mongoose.model('Events', eventSchema);