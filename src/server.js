/**
* Server for the College of Public Health Event Application
*/
/* Dependencies -------------------------------------------------------------*/
var express     = require('express');
var mongoose    = require('mongoose');
var bodyParser  = require('body-parser');
var getSecret   = require('./secrets');

/* Instances  ---------------------------------------------------------------*/
const app     = express();
const router  = express.Router();

/* Configurations -----------------------------------------------------------*/
// Express
const PORT = process.env.PORT || 3001;
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// Mongoose
var Event = require('./api/models/eventModel');
mongoose.connect(getSecret('mongodb'), () => { console.log('connected to MongoDB!'); });
var db = mongoose.connection;
db.on('error', console.error.bind(console, 'MongoDB connection error: '));


// Routes and stuff


// Set Route path & initialize API
router
  .get('/', (request, response) => {
    response.json({message: 'Hello, world!'});
  })
  .post('/', (request, response) => {
    //if (!request.body) response.statusCode(500);

    console.log(request.body);

    //response.statusCode(200);
    response.end();
  });

router
  .route('/events')
  .post((request, response) => {
    // Body Parser lets us use JSON. Extract the request information from body
    const { 
      name, date, time, comments, email,
      circleTables, rectTables, barTables, posterBoards, trashCans 
    } = request.body;
    
    // Create a new event, the created/updated/approved fields are pre filled.
    const event = new Event({
      name, date, time, comments, email,
      circleTables, rectTables, barTables, posterBoards, trashCans
    });
    event.eventID = new mongoose.Types.ObjectId();

    // Save the event to our MongoDB collection.
    event.save((err) => {
      if (err) response.send(err);
      else 
        response.json({message: "Event saved to database!"});
    });
    //console.log(event);

    //response.end();
  });



// Use router config when we call /api
app.use('/api', router);

app.listen(PORT, () => console.log(`Listening on port ${PORT}`));