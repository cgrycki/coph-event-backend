// Testing



const dynamo = require('dynamodb');
const Joi = require('joi');
const uuid = require('uuid');


/* MAUI ROOMS ---------------------------------------------------------------*/
var roomsWorkflow = require('./rooms-maui.json');

// Room IDs
const room_numbers = roomsWorkflow.map(d => d.roomNumber).sort();

// For easy parsing
const room_maps = roomsWorkflow.map(d => {
	return {
		roomName: d.roomName, 
		roomNumber: d.roomNumber
	}
});

const room_types = new Set(
	roomsWorkflow
		.filter(d => d.rmType !== null)
		.map(d => d.rmType)
);
/* Outputs...
	Lounge, Classroom-Computer, Computer Labratory, 
	Classroom-Lecture, Seminar, Outdoor Space, Auditorium,
	Classroom-Multipurpose, Office
*/

const room_type_groups = new Set(
	roomsWorkflow
		.filter(d => d.roomTypeGroup !== null)
		.map(d => d.roomTypeGroup)
);
/* Outputs...
	Lounge, Classroom-Computer, Computer Labratory, 
	Classroom-Lecture, Seminar, Outdoor Space, Auditorium,
	Classroom-Multipurpose, Office
*/

const room_categories = new Set(
	roomsWorkflow
		.filter(d => d.roomCategory !== null)
		.map(d => d.roomCategory)
);
/* Outputs...
	UNIVERSITY_CLASSROOM, SPECIALTY_SPACE< PROGRAMMED_CLASSROM
*/


/**
 * REGEX ASSIGNMENTS FOR ROOM SEMNATIC MEANING
 * e.g. C125, S025A, XC100, C217{A,B,AB}, East Patio...
 * match last part of roomNumber: /[A-Z]+
 * match actual number: /\d+/g
 * match first north/south/basement: ^[a-zA-Z]
 */
const edge_cases = new Set([
	'East Patio',
	'SW Program Space',
	'C217A', 'C217B', 'C217AB',
	'XC200', 'XC300', 'XC400', 'XC500', 'XC020', 'X100'
]);


// TO DO: map departnames/org units as a
// semantically meaningful attribute???
const acad_org_units = new Set(
	roomsWorkflow
		.filter(d => d.acadOrgUnitName !== null)
		.map(d => d.acadOrgUnitName)
); // {704, 470, 414, 467}
function assignDepartName(acadOrgUnitName) {}



/* OFFICE365 ----------------------------------------------------------------*/
var roomsOffice365 = require('./rooms-office365.json');

// Reshape the objects before doing anything
roomsOffice365 = roomsOffice365.map(d => d.Id);

// Assign roomNumber to Office representation
function assignOffice365Room(Name) {
	let name_prts = Name.split('-');
	return name_prts[name_prts.length - 1];
}


/* DATA FORMATTING  ---------------------------------------------------------*/
// string, represents university room ID
function assignFloor(roomNumber) {
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

	return floor_str;
}

function assignReservable(roomNumber) {

	// Some areas are just to small
	let unreservable = new Set([
    'East Patio', 
    'SW_PROGRAM_SPACE',
		'XC200', 'XC300', 'XC400', 'XC020'
	]);

	if (unreservable.has(roomNumber)) return false;
	else return true;
}

// Assign semantic names from 


/* DATABASE MODELLING -------------------------------------------------------*/
var rmModel = Joi.object().keys({
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
	"floor"          : Joi.number().integer().required()
});


function validate(room) {
	try {
		let val = rmModel.validate(room);
		if (val.error !== null) console.log(val);
	} catch (err) {
		console.log(err.details.context);
	}
}
const Room = require('../../models/room.model');



// Assign floors, and add an 'id' field to the object so dynamo stop complaining
roomsWorkflow.forEach(d => {
	d.floor = assignFloor(d.roomNumber);
});


roomsWorkflow.forEach(d => {
	Room.create(d, (err, data) => {
		if (err) console.log(err.message, d.roomNumber);
		else console.log(d.roomNumber);
	});
})