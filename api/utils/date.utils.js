/**
 * Date Utilities
 */

const moment = require('moment');
moment.suppressDeprecationWarnings = true;

const getFormattedDate = (date=new Date()) => moment(date).local().format('YYYY-MM-DD');


module.exports = {
  getFormattedDate
};