/**
 * Populate Layouts database from created layout JSONS
 * Should be invoked using NPM via the console in the root directory
 * ~~REQUIRES .env CREDENTIALS~~
 */

// Libs
const LayoutModel          = require('../../api/layouts/layout.model');
const { layoutValidation } = require('../../api/layouts/layout.schema');

// Data
const hightop_layout   = require('./default/hightop-trash.json');
const poster_layout    = require('./default/poster-session.json');
const event_150_layout = require('./default/event-150.json');
const layouts          = [hightop_layout, poster_layout, event_150_layout];


const validated_layouts = layouts.map(layout => {
  let { error, value } = layoutValidation(layout);
  if (error) throw new Error('One of your layouts is not valid!');
  else return value;
});

console.log(validated_layouts);

validated_layouts.forEach(layout => {
  LayoutModel.create(layout, (err, data) => {
    if (err) console.log(err.message, data);
  });
});

console.log('All layouts uploaded! Go get a coffee. ☕');