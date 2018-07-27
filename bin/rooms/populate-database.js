/**
 * Populate Rooms database from MAUI provided JSON. 
 * Should be invoked using NPM via the console in the root directory. 
 * Requires a .env file with keys to give the RoomModel DynamoDB permissions 
 *    `$ npm run populate-rooms`
 */

// DEPENDENCIES
const RoomModel = require('../../rooms/room.model');
const Joi       = require('joi');


/* DATA ---------------------------------------------------------------------*/
var rooms_workflow = require('./rooms-maui.json');
var rooms_office365 = require('./rooms-office365.json');


/* UTILITIES ----------------------------------------------------------------*/
function assignFloor(room) {
  // Assigns a floor to our room from it's room number.
  const roomNumber = room.roomNumber;

	// Edge case: the only null values are long form names
  // on the 2nd floor. e.g. 'SW Program Space', 'East Patio'
	if ((roomNumber === 'East Patio') || (roomNumber === 'SW Program Space')) {
	 return 2;
	}

	// Match the number portion of the ID. Regex returns a list.
	let real_rm_num = (roomNumber.match(/\d+/g))[0];
	
	// Return the floor from the building naming schema
	// Numbers designate floor, then room. e.g. N540 => 5th floor
	let floor_str = real_rm_num.slice(0, 1);

  return +floor_str;
}

function assignReservable(room) {
  // Assigns a boolean indicating if room is reservable by our application

  // Create inclusion sets for types of rooms
  let reservable_auditorium = new Set(['N110', 'N120', 'S030', 'XC100']);
  let reservable_classroom  = new Set(['S025A', 'S025B', 'S025AB', 'C301', 'C410', 'C217A', 'C217B', 'C217AB']);
  let reservable = new Set([...reservable_auditorium, ...reservable_classroom]);

  // Test for inclusion and assign a human readable room type
  const roomNumber = room.roomNumber;

  if (reservable_auditorium.has(roomNumber)) {
    room.reservable = true;
    room.rmType = 'Auditorium';
  }
  else if (reservable_classroom.has(roomNumber)) {
    room.reservable = true;
    room.rmType = 'Classroom';
  }
  else {
    room.reservable = false;
  };

  return room;
}

function validateRoom(room) {
  const joiModel = Joi.object().keys({
    "buildingName"   : Joi.string().required(),
    "buildingCode"   : Joi.string().required(),
    "roomNumber"     : Joi.string().required(),
    "roomName"       : Joi.string().allow(null).required(),
    "regionList"     : Joi.array(),
    "featureList"    : Joi.array(),
    "maxOccupancy"   : Joi.number().integer(),
    "rmType"         : Joi.string().allow(null).required(),
    "acadOrgUnitName": Joi.number().integer().allow(null),
    "roomCategory"   : Joi.string().allow(null),
    "roomTypeGroup"  : Joi.string().allow(null).required(),
    "floor"          : Joi.number().integer().required(),
    "reservable"     : Joi.boolean().required()
  });

  try {
    let valid = joiModel.validate(room);
    if (valid.error !== null) {
      console.log(`${room.roomNumber} is invalid!`, valid);
      return false;
    } else {
      return true;
    }
  } catch (err) {
    console.log(room, err.details.context);
  };
}


/* Upload -------------------------------------------------------------------*/
// Assign floors
console.log('Assigning floor numbers...');
rooms_workflow.forEach(d => d.floor = assignFloor(d));

// Assign reservable
console.log('Assigning reservable attribute to rooms...');
rooms_workflow = rooms_workflow.map(d => assignReservable(d));

// Validate room objects
console.log('Validating room objects against DynamoDB model...');
const rooms_valid = rooms_workflow.map(d => validateRoom(d));

// UPLOAD!
if (rooms_valid.every(d => d === true)) {
  console.log('All rooms passed validation! --- Uploading to DynamoDB...');

  rooms_workflow.forEach(d => {
    RoomModel.create(d, (err, data) => {
      if (err) console.log(err.message, d.roomNumber);
    });
  });

  console.log('All rooms uploaded! Go get a coffee. ☕');
} else {
  console.log('Some rooms didn\'t pass validation. Check your console to see the errors');
}