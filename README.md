# College of Public Health Event Application: Backend

Backend API connecting U. Iowa Authentication, U. Iowa Workflow API, U. Iowa MAUI API, and Dyanmo Databases.

## Index

1. [Getting Started](#getting-started-anchor)
2. [Overview](#overview-anchor)
3. [Directory Structure](#dir-anchor)
4. [API + Features](#api-anchor)
5. [Links](#links-anchor)

## [Getting Started](#getting-started-anchor)

#### Prerequisites

A working knowledge of Javascript (esp. `Promise`, `async`, and `await`), HTTP and REST, and Amazon Web Services (AWS). You'll need `NodeJS` v8+ and `NPM` to develop the application.

Additionally you'll need repository access from Chris Grycki (or whoever else is maintaining at time of reading). For local development you'll need a `.env` file *specific to your repository*. In other words, you'll need API keys for all the fields in the `sample.env` file. Otherwise you *will* get thrown errors when the DynamoDB models fail to authenticate.

#### Installing

Download the Git repo

```
git clone https://github.com/cgrycki/coph-event-backend.git
```

Change directories into the repo you just cloned.

```
cd coph-event-backend
```

Install the project's (development) dependencies.

```
npm install --save --save-dev
```

Start the application

```
npm run start
```

Interacting with the local server once started:

```
GET    http://localhost:3001/...
POST   http://localhost:3001/...
PATCH  http://localhost:3001/...
DELETE http://localhost:3001/...
```

#### Populating Databases

Populate rooms Dynamo Database with Astra room data

```
npm run populate-rooms
```

Populate layouts Dynamo Database with default examples

```
npm run populate-layouts
```

#### Running tests with `Mocha`

Server does not need to be running

```
npm run test
```


## [Overview](#overview-anchor)

This application is an `express` server hosted on an AWS Lambda function. It uses `claudiajs` to easily package and deploy our ExpressJS application to AWS Lambda. Because Lambda functions are stateless, we use Amazon's `aws-sdk` and `dynamodb` to to store information and user sessions in DynamoDB. The application heavily relies on JS `Promise`'s and `async`/`await` to implement synchronous calls. `simple-oauth2` is used to succinctly handle OAuth2 authentication handshakes.

The API adheres to the following pattern:
  - **feature**
    * *schema*: Data format + description. Validates database model information. Made with `npm's Joi`.
    * *model*: DynamoDB model + methods to interact with DynamoDB. Made with `npm's dyanamodb`.
    * *class*: Class responsible for RESTful interfaces (e.g. contacting MAUI to get a list of courses). Made with `npm's request-promise`.
    * *utils*: Parameter validators and ExpressJS middleware functions. These map HTTP requests to the feature's classes + models.
    * *route*: ExpressJS route which maps HTTP requests to the appropriate middlewares. Made with `npm's express`.


## [Directory Structure](#dir-anchor)

```
cphb-events-backend/
├── api/                      Server routes, schemas, utilities, and models.
│   ├── index.js              Exports all routes for server.js
│   ├── auth/                 Authentication: login/logout, sessions  
│   ├── events/               Event operations
│   ├── layouts/              Layout operations
│   ├── maui/                 Room and course operations
│   ├── workflow/             Workflow interface operations
│   └── utils/                Shared functions
│
├── bin/                      Scripts
│   ├── claudia-deploy.sh     Deploy claudiajs from CodePipeline
│   ├── www                   Start server.js locally
│   ├── docs/                 Documentation templates
│   ├── layouts/              Layout examples and database scripts
│   └── rooms/                MAUI rooms data and database scripts
│
├── config/
│   ├── customCors.js         Cross Origin Resource Sharing configuration
│   ├── hawkids.js            List of Admin HawkIDs
│   └── xray.js               Amazon XRay configuration
│
├── test/                     Tests run by Mocha
├── .gitignore                !!Ignores config/hawkids.js from repo
├── .npmignore                !!Empty file to prevent claudiajs from not deploying .gitignore'd hawkids
├── package.json
├── package-lock.json
├── README.md
├── sample.env                Sample environment file
└── server.js                 Entry point to application
```



## [API + Features](#api-anchor)

The following is a list of the application's features and their methods. See source code for more detailed annotations.

#### Authentication


* [auth/Application](#module_auth/Application)
    * [~authenticateApplication()](#module_auth/Application..authenticateApplication) ⇒ <code>object</code>
    * [~getStore()](#module_auth/Application..getStore) ⇒ <code>Promise</code>
    * [~setAppAuthToken(token)](#module_auth/Application..setAppAuthToken)
    * [~getAppAuthToken()](#module_auth/Application..getAppAuthToken) ⇒ <code>string</code>
    * [~getUserAuthURL()](#module_auth/Application..getUserAuthURL) ⇒ <code>string</code>
    * [~getUserAuthToken(auth_code, request)](#module_auth/Application..getUserAuthToken) ⇒ <code>object</code>
    * [~setUserAuthToken(token, request)](#module_auth/Application..setUserAuthToken)
    * [~unsetUserAuthToken(request, response)](#module_auth/Application..unsetUserAuthToken)



* [auth/User](#module_auth/User)
    * [~authUserCodeMiddleware(request, response, next)](#module_auth/User..authUserCodeMiddleware) ⇒ <code>object</code>
    * [~checkSessionExistsMiddleware(request, response, next)](#module_auth/User..checkSessionExistsMiddleware) ⇒ <code>object</code>
    * [~retrieveSessionInfoMiddleware(request, response, next)](#module_auth/User..retrieveSessionInfoMiddleware) ⇒ <code>object</code>
    * [~clearTokensFromSessionMiddleware(request, response, next)](#module_auth/User..clearTokensFromSessionMiddleware) ⇒ <code>object</code>
    * [~getUserAdminStatus(request, response)](#module_auth/User..getUserAdminStatus) ⇒ <code>object</code>



* [auth/Session](#module_auth/Session)
    * [.store](#module_auth/Session.store) : <code>object</code>
    * [.session](#module_auth/Session.session) : <code>object</code>



* [auth/authroute](#module_auth/authroute)
    * [router](#exp_module_auth/authroute--router) : <code>object</code> ⏏
        * [~GET/:code(req)](#module_auth/authroute--router..GET/_code) ⇒ <code>object</code>
        * [~GET/logout(req)](#module_auth/authroute--router..GET/logout) ⇒ <code>object</code>
        * [~GET/validate(req)](#module_auth/authroute--router..GET/validate) ⇒ <code>boolean</code>


#### Events


* [events/EventSchema](#module_events/EventSchema)
    * [.courseSchema](#module_events/EventSchema.courseSchema) : <code>object</code>
    * [.setup_mfk](#module_events/EventSchema.setup_mfk) : <code>object</code>
    * [.ModelSchema](#module_events/EventSchema.ModelSchema) : <code>object</code>



* [events/EventModel](#module_events/EventModel)
    * [~EventModel](#module_events/EventModel..EventModel) : <code>object</code>
        * [.getEvent(package_id)](#module_events/EventModel..EventModel.getEvent) ⇒ <code>Promise</code>
        * [.getEvents(field, value)](#module_events/EventModel..EventModel.getEvents) ⇒ <code>Promise</code>
        * [.postEvent(evt)](#module_events/EventModel..EventModel.postEvent) ⇒ <code>Promise</code>
        * [.deleteEvent(package_id)](#module_events/EventModel..EventModel.deleteEvent) ⇒ <code>Promise</code>
        * [.patchEvent(evt)](#module_events/EventModel..EventModel.patchEvent) ⇒ <code>Promise</code>



* [events/EventUtils](#module_events/EventUtils)
    * [~getDynamoEventMiddleware(request, response, next)](#module_events/EventUtils..getDynamoEventMiddleware) ⇒ <code>object</code>
    * [~getDynamoEventsMiddleware(request, response, next)](#module_events/EventUtils..getDynamoEventsMiddleware) ⇒ <code>object</code>
    * [~validateEvent(request, response, next)](#module_events/EventUtils..validateEvent) ⇒ <code>object</code>
    * [~postDynamoEventMiddleware(request, response, next)](#module_events/EventUtils..postDynamoEventMiddleware) ⇒ <code>object</code>
    * [~patchDynamoEventMiddleware(request, request, next)](#module_events/EventUtils..patchDynamoEventMiddleware) ⇒ <code>object</code>
    * [~processWorkflowCallback(request, response)](#module_events/EventUtils..processWorkflowCallback) ⇒ <code>object</code>
    * [~deleteDynamoEventMiddleware(request, response, next)](#module_events/EventUtils..deleteDynamoEventMiddleware) ⇒ <code>object</code>



* [events/EventRouter](#module_events/EventRouter)
    * [router](#exp_module_events/EventRouter--router) : <code>object</code> ⏏
        * [~POST(req, res)](#module_events/EventRouter--router..POST) ⇒ <code>object</code>
        * [~GET/my(req, res)](#module_events/EventRouter--router..GET/my) ⇒ <code>Array.&lt;object&gt;</code>
        * [~GET/:package_id(req, res)](#module_events/EventRouter--router..GET/_package_id) ⇒ <code>object</code>
        * [~DELETE/:package_id(req, res)](#module_events/EventRouter--router..DELETE/_package_id) ⇒ <code>string</code>
        * [~PATCH/:package_id(req, res)](#module_events/EventRouter--router..PATCH/_package_id) ⇒ <code>object</code>


#### Layouts


* [layouts/LayoutSchema](#module_layouts/LayoutSchema)
    * [layoutSchema](#exp_module_layouts/LayoutSchema--layoutSchema) : <code>object</code> ⏏
        * [~furnitureItemSchema](#module_layouts/LayoutSchema--layoutSchema..furnitureItemSchema) : <code>object</code>
        * [~furnitureItemsSchema](#module_layouts/LayoutSchema--layoutSchema..furnitureItemsSchema) : <code>object</code>
        * [~publicLayoutSchema](#module_layouts/LayoutSchema--layoutSchema..publicLayoutSchema) : <code>object</code>
        * [~privateLayoutSchema](#module_layouts/LayoutSchema--layoutSchema..privateLayoutSchema) : <code>object</code>
        * [~layoutValidation(layout)](#module_layouts/LayoutSchema--layoutSchema..layoutValidation) ⇒ <code>object</code> \| <code>object.error</code> \| <code>object.value</code>



* [layouts/LayoutModel](#module_layouts/LayoutModel)
    * [LayoutModel](#exp_module_layouts/LayoutModel--LayoutModel) : <code>object</code> ⏏
        * [.getLayout(package_id)](#module_layouts/LayoutModel--LayoutModel.getLayout) ⇒ <code>Promise</code>
        * [.getLayouts(field, value)](#module_layouts/LayoutModel--LayoutModel.getLayouts) ⇒ <code>Promise</code>
        * [.postLayout(layout)](#module_layouts/LayoutModel--LayoutModel.postLayout) ⇒ <code>Promise</code>
        * [.patchLayout(layout)](#module_layouts/LayoutModel--LayoutModel.patchLayout) ⇒ <code>Promise</code>
        * [.deleteLayout(package_id)](#module_layouts/LayoutModel--LayoutModel.deleteLayout) ⇒ <code>Promise</code>



* [layouts/LayoutUtils](#module_layouts/LayoutUtils)
    * _static_
        * [.stub](#module_layouts/LayoutUtils.stub) : <code>object</code>
    * _inner_
        * [~validateLayout()](#module_layouts/LayoutUtils..validateLayout) ⇒ <code>object</code>
        * [~postLayoutMiddleware()](#module_layouts/LayoutUtils..postLayoutMiddleware) ⇒ <code>object</code>
        * [~patchLayoutMiddleware()](#module_layouts/LayoutUtils..patchLayoutMiddleware) ⇒ <code>object</code>
        * [~getEventLayoutMiddleware()](#module_layouts/LayoutUtils..getEventLayoutMiddleware) ⇒ <code>object</code>
        * [~deleteLayoutMiddleware()](#module_layouts/LayoutUtils..deleteLayoutMiddleware) ⇒ <code>object</code>
        * [~getLayoutsMiddleware()](#module_layouts/LayoutUtils..getLayoutsMiddleware) ⇒ <code>object</code>



* [layouts/LayoutRoute](#module_layouts/LayoutRoute)
    * [router](#exp_module_layouts/LayoutRoute--router) : <code>object</code> ⏏
        * [~POST(req)](#module_layouts/LayoutRoute--router..POST) ⇒ <code>object</code>
        * [~GET/:id(req)](#module_layouts/LayoutRoute--router..GET/_id) ⇒ <code>object</code>
        * [~DELETE/:id(req)](#module_layouts/LayoutRoute--router..DELETE/_id) ⇒ <code>string</code>
        * [~PATCH(req)](#module_layouts/LayoutRoute--router..PATCH) ⇒ <code>object</code>
        * [~filter/my(req)](#module_layouts/LayoutRoute--router..filter/my) ⇒ <code>Array.&lt;object&gt;</code>
        * [~filter/public(req)](#module_layouts/LayoutRoute--router..filter/public) ⇒ <code>Array.&lt;object&gt;</code>


#### MAUI + Rooms


* [maui/MAUI](#module_maui/MAUI)
    * [MAUI](#exp_module_maui/MAUI--MAUI) ⏏
        * [.headers()](#module_maui/MAUI--MAUI+headers) ⇒ <code>object</code>
        * [.constructQuery(params)](#module_maui/MAUI--MAUI+constructQuery) ⇒ <code>string</code>
        * [.request(options)](#module_maui/MAUI--MAUI+request) ⇒ <code>object</code>
        * [.getRoomSchedule(roomNumber, start, end)](#module_maui/MAUI--MAUI+getRoomSchedule) ⇒ <code>Array.&lt;object&gt;</code> \| <code>object</code>
        * [.getRoomPromise(roomNumber, start, end)](#module_maui/MAUI--MAUI+getRoomPromise) ⇒ <code>Promise</code>
        * [.parseEvent(evt)](#module_maui/MAUI--MAUI+parseEvent) ⇒ <code>Object</code>
        * [.getSchedules(rooms, start, end)](#module_maui/MAUI--MAUI+getSchedules) ⇒ <code>Array.&lt;object&gt;</code>
        * [.getSessionID(date)](#module_maui/MAUI--MAUI+getSessionID) ⇒ <code>string</code>
        * [.getCourses(courseText)](#module_maui/MAUI--MAUI+getCourses) ⇒ <code>Array.&lt;object&gt;</code>
        * [.parseCourses(courses)](#module_maui/MAUI--MAUI+parseCourses) ⇒ <code>Array.&lt;object&gt;</code>



* [maui/RoomModel](#module_maui/RoomModel)
    * [Room](#exp_module_maui/RoomModel--Room) : <code>object</code> ⏏
        * [.getRooms(request, response)](#module_maui/RoomModel--Room.getRooms)
        * [.getRoom(request, response)](#module_maui/RoomModel--Room.getRoom)



* [maui/MauiUtils](#module_maui/MauiUtils)
    * _static_
        * [.validRoomNum](#module_maui/MauiUtils.validRoomNum) : <code>object</code>
        * [.validDate](#module_maui/MauiUtils.validDate) : <code>object</code>
        * [.validStartDate](#module_maui/MauiUtils.validStartDate) : <code>object</code>
        * [.validEndDate](#module_maui/MauiUtils.validEndDate) : <code>object</code>
    * _inner_
        * [~getRoomScheduleMiddleware(request, response, next)](#module_maui/MauiUtils..getRoomScheduleMiddleware)
        * [~newGetRoomSchedulesMiddleware(request, response, next)](#module_maui/MauiUtils..newGetRoomSchedulesMiddleware)
        * [~getCoursesMiddleware(request, response, next)](#module_maui/MauiUtils..getCoursesMiddleware)



* [maui/MauiRouter](#module_maui/MauiRouter)
    * [router](#exp_module_maui/MauiRouter--router) : <code>object</code> ⏏
        * [~GET/rooms/:room_number(req, res)](#module_maui/MauiRouter--router..GET/rooms/_room_number) ⇒ <code>object</code>
        * [~GET/rooms/:room_number/:date(req, res)](#module_maui/MauiRouter--router..GET/rooms/_room_number/_date) ⇒ <code>object</code>
        * [~GET/schedules/:start_date/:end_date(req, res)](#module_maui/MauiRouter--router..GET/schedules/_start_date/_end_date) ⇒ <code>Array.&lt;object&gt;</code>
        * [~GET/courses/:courseText(req, res)](#module_maui/MauiRouter--router..GET/courses/_courseText) ⇒ <code>Array.&lt;string&gt;</code>


#### Workflow


* [workflow/Workflow](#module_workflow/Workflow)
    * [Workflow](#exp_module_workflow/Workflow--Workflow) ⏏
        * [new Workflow()](#new_module_workflow/Workflow--Workflow_new)
        * [.getAppToken()](#module_workflow/Workflow--Workflow+getAppToken) ⇒ <code>string</code>
        * [.constructURI(tools)](#module_workflow/Workflow--Workflow+constructURI) ⇒ <code>string</code>
        * [.constructPermissionsURI(pidOrPids)](#module_workflow/Workflow--Workflow+constructPermissionsURI) ⇒ <code>string</code>
        * [.request(options, callback)](#module_workflow/Workflow--Workflow+request) ⇒ <code>Promise</code>
        * [.headers(user_token, ip_address)](#module_workflow/Workflow--Workflow+headers) ⇒ <code>object</code>
        * [.postPackage(user_token, ip_address, data)](#module_workflow/Workflow--Workflow+postPackage) ⇒ <code>object</code>
        * [.updatePackage(user_token, ip_address, data)](#module_workflow/Workflow--Workflow+updatePackage) ⇒ <code>Object</code>
        * [.voidPackage(user_token, ip_address, package_id, voidReason)](#module_workflow/Workflow--Workflow+voidPackage) ⇒ <code>object</code>
        * [.removePackage(user_token, ip_address, package_id)](#module_workflow/Workflow--Workflow+removePackage) ⇒ <code>object</code>
        * [.getPermissions(user_token, ip_address, package_id)](#module_workflow/Workflow--Workflow+getPermissions) ⇒ <code>object</code>
        * [.validateCallback()](#module_workflow/Workflow--Workflow+validateCallback)



* [workflow/workflowutils](#module_workflow/workflowutils)
    * [~getInboxRedirect(package_id, signature_id)](#module_workflow/workflowutils..getInboxRedirect) ⇒ <code>string</code>
    * [~getWorkflowPermissionsMiddleware(request, response, next)](#module_workflow/workflowutils..getWorkflowPermissionsMiddleware) ⇒ <code>object</code>
    * [~postWorkflowEventMiddleware(request, response, next)](#module_workflow/workflowutils..postWorkflowEventMiddleware) ⇒ <code>object</code>
    * [~deleteWorkflowEventMiddleware(request, response, next)](#module_workflow/workflowutils..deleteWorkflowEventMiddleware) ⇒ <code>object</code>
    * [~patchWorkflowEventMiddleware(request, response, next)](#module_workflow/workflowutils..patchWorkflowEventMiddleware) ⇒ <code>object</code>



* [workflow/router](#module_workflow/router)
    * [router](#exp_module_workflow/router--router) : <code>object</code> ⏏
        * [~GET/callback(req)](#module_workflow/router--router..GET/callback) ⇒ <code>object</code>
        * [~GET/inbox(req, res)](#module_workflow/router--router..GET/inbox) ⇒ <code>object</code>



## [Links](#links-anchor)

- Express
  * [`express` Documentation](https://expressjs.com/en/api.html)
  * [Build a RESTful API Using Node and Express 4](https://scotch.io/tutorials/build-a-restful-api-using-node-and-express-4)
  * [Use ExpressJS to Get URL and POST Parameters](https://scotch.io/tutorials/use-expressjs-to-get-url-and-post-parameters)
  * [Keeping API Routing Clean Using Express Routers](https://scotch.io/tutorials/keeping-api-routing-clean-using-express-routers)
  * [CORS in ExpressJS](http://justindavis.co/2015/08/31/CORS-in-Express/)
- Deployment
  * [`claudiajs` Documentation](https://claudiajs.com/documentation.html)
  * [`claudiajs` Tutorials](https://claudiajs.com/tutorials/index.html)
- Validation
  * [`Joi` Documentation](https://github.com/hapijs/joi/blob/master/API.md)
- DynamoDB
  * [`dynamodb` doucmentation](https://github.com/baseprime/dynamodb)
- Authentication
  * [OAuth2 Authentication in Node(microsoft)](https://docs.microsoft.com/en-us/outlook/rest/node-tutorial)
  * [`simple-oauth2` github](https://github.com/lelylan/simple-oauth2)
  * [`simple-oauth2` docs](https://lelylan.github.io/simple-oauth2/)
- Asynchronous Javascript
  * [Understand promises before you start using async/await](https://medium.com/@bluepnume/learn-about-promises-before-you-start-using-async-await-eb148164a9c8)
  * [Async functions - making promises friendly](https://developers.google.com/web/fundamentals/primers/async-functions)
