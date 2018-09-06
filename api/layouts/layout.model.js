/* DEPENDENCIES -------------------------------------------------------------*/
var dynamo            = require('dynamodb');
dynamo.AWS.config.update({ region: process.env.AWS_DEFAULT_REGION });
const { layoutSchema } = require('./layout.schema');

// Create table names depending on environment
const { createTableName } = require('../utils/index');
const table_name          = 'layouts';


/* MODEL --------------------------------------------------------------------*/
const LayoutModel = dynamo.define('Layout', {
  // Primary Key
  hashKey: 'id', //package_id

  // Timestamps
  timestamps: false,

  // Schema
  schema: layoutSchema,

  // Dynamic Table names depending on our WF environment
  tableName: createTableName(table_name),

  // Indices for filtering queries
  indexes: [
    {hashKey: 'user_email', rangeKey: 'id', name: 'LayoutUserIndex', type: 'global'},
    {hashKey: 'type',       rangeKey: 'id', name: 'LayoutTypeIndex', type: 'global'}
  ]
});


/* RESTful functions --------------------------------------------------------*/
/**
 * Event Model returns a promise either returning the layout or an error.
 * @param {(string | number)} package_id Package ID of event hosting layout, or public name.
 * @returns {Promise}
 * @resolve {Object} Layout object
 * @reject {Error} Error returned from DynamoDB.
 */
LayoutModel.getLayout = function(package_id) {
  return new Promise((resolve, reject) => {
    LayoutModel
      .query(package_id)
      .limit(1)
      .exec((err, data) => {
        if (err) return reject(err);
        else resolve(data.Items);
      });
  });
}


/**
 * Returns a filtered list of layouts as a Promise.
 * @param {string} field String designating which attribute to filter upon.
 * @param {string} value String denoting the field value to restrict query to: user_email or 'public'
 * @returns {Promise}
 * @resolve {object[]} List of layouts
 * @reject {error} Error from Dynamo
 */
LayoutModel.getLayouts = function(field, value) {
  return new Promise((resolve, reject) => {
    // Create field => index mapping
    const indexMap = {
      'user_email': 'LayoutUserIndex',
      'type'      : 'LayoutTypeIndex'
    };

    LayoutModel
      .query(value)
      .usingIndex(indexMap[field])
      .exec((err, data) => {
        if (err) return reject(err);
        else {
          const layouts = data.Items.map(lay => lay.get());
          resolve({ layouts });
        }
      })
  });
} 


/**
 * Creates a layout object and returns a Promise containing the DynamoDB response.
 * @param {object} layout Layout Object
 * @param [layout.counts] {object} Calculated furniture counts
 * @param [layout.items] {object[]} Furniture items
 * @param [layout.package_id] {number} ID of event hosting layout, from Workflow.
 * @returns {Promise}
 * @resolve {object} Data returned from DynamoDB
 * @reject {error} Error returned from DynamoDB
 */
LayoutModel.postLayout = function(layout) {
  return new Promise((resolve, reject) => {
    LayoutModel.create(layout, (err, data) => {
      if (err) return reject(err);
      else {
        const dynamo_layout = data.get();
        resolve(dynamo_layout);
      }
    });
  });
}


/**
 * Updates a DynamoDB Layout object.
 * @param {Object} layout Layout object from frontend.
 * @returns {Promise}
 * @resolve {object} Updated Layout object.
 * @reject {error} Error thrown from DynamoDB.
 */
LayoutModel.patchLayout = function(layout) {
  return new Promise((resolve, reject) => {
    LayoutModel.update(layout, (err, data) => {
      if (err) return reject(err);
      else {
        const dynamo_layout = data.get();
        resolve(dynamo_layout);
      }
    });
  });
}


/**
 * Deletes a layout from DynamoDB.
 * @param {number} package_id Package ID of layout.
 * @returns {Promise}
 * @resolve {object} Object containing DynamoDB hashKey (`package_id`)
 * @reject {error} Error returned from DynamoDB
 */
LayoutModel.deleteLayout = function(package_id) {
  return new Promise((resolve, reject) => {
    LayoutModel.destroy(package_id, (err) => {
      if (err) return reject(err);
      else resolve();
    });
  });
}


module.exports = LayoutModel;
