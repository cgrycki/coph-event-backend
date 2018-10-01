const assert = require('assert');
const { getFormattedDateTime } = require('../api/utils/date.utils');


const eg = {
  "buildingCode": "CPHB",
  "roomNumber": "N110",
  "weekDayName": "Monday",
  "date": "October 1, 2018",
  "startTime": "2:30PM    ",
  "endTime": "3:20PM    ",
  "activity": "MSCI:3030:0AAA",
  "title": "Business Process Analysis",
  "activityId": "712208A1-6538-4E60-BD20-0713662ACF35",
  "counter": "12352817"
};

console.log(getFormattedDateTime(eg.date, eg.startTime));