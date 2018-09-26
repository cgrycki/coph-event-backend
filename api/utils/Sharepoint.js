/**
* Sharepoint.js
* @module utils/Sharepoint
*/
const rp = require('request-promise');


class Sharepoint {
  static getListItem(info) {
    // Extract information for a Sharepoint List Item
    let flowObj = {};
    const fields = ['date', 'package_id', 'start_time', 'end_time', 'event_name'];
    fields.forEach(f => { flowObj[f] = info[f]; });

    




    // Add the URL
    flowObj.url = `https://dev.cphb-events.public-health.uiowa.edu/cphit/${info.package_id}`;

    return flowObj;
  }

  static getURI(method) {
    const methodMap = {
      post: 'https://prod-67.westus.logic.azure.com/workflows/a9403447aa524de6b5ab57f657229ed1/triggers/manual/paths/invoke?api-version=2016-06-01&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=O54rfGDKsuHMOsVORS1z1GIS3qGlspk3_b8VRUWIrrU',
      patch: 'https://prod-59.westus.logic.azure.com/workflows/3167805039744e8e96488ebaffe71c2a/triggers/manual/paths/invoke?api-version=2016-06-01&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=QP7DSuv2It-ZN43_tZwsnzwcqD1WdlVNJwW6vuy-VJM',
      delete: 'https://prod-17.westus.logic.azure.com/workflows/2a54cc0ad7874a19a568accc1f62cdbf/triggers/manual/paths/invoke?api-version=2016-06-01&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=hEaHxuAk-iR6x5unAYZmC1ySQWvjXc2MMfYNHwDBMOY'
    };
    return methodMap[method];
  }

  static getPromise(options) {
    return rp(options)
      .then(res => res)
      .catch(err => { throw new Error(err); });
  }

  static createSharepointItem(info) {
    const method = 'post';
    const options = {
      method,
      uri : this.getURI(method),
      body: this.getListItem(info),
      json: true
    };

    return this.getPromise(options);
  }

  static updateSharepointItem(info) {
    const method = 'patch';
    const uri = this.getURI(method);
    const options = {
      method,
      uri,
      body: this.getListItem(info),
      json: true
    };

    return this.getPromise(options);
  }

  static deleteSharepointItem(package_id) {
    const flowBody = { package_id };
    const options = {
      method: 'patch',
      uri: this.getURI('delete'),
      body: flowBody,
      json: true
    };

    return this.getPromise(options);
  }

  static async sharepointMiddleware(request, response, next) {
    let result;
    const { method } = request;
    
    try {
      switch (method) {
        case 'POST':
          result = await this.createSharepointItem(request.body.form);
          break;
        case 'PATCH':
          result = await this.updateSharepointItem(request.body.form);
          break;
        case 'DELETE':
          result = await this.deleteSharepointItem(request.params.package_id);
          break;
        default:
          return response.status(400).json({ error: true, message: 'Method not recognized'});
      }

      return next();
    } catch(err) {
      return response.status(400).json({ error: err });
    }
  }
}

module.exports = Sharepoint;




/*

https://graph.microsoft.com/v1.0/sites/iowa.sharepoint.com,db9cf7a3-3f4f-4e18-acc3-a55eb1933d6d,789afdb3-3d10-439b-ad45-a65590c6881c/lists

{
  "@odata.etag": "\"ba59ce11-50f1-4cd4-9fd5-13510ece8684,3\"",
  "createdDateTime": "2018-09-24T21:25:47Z",
  "description": "",
  "eTag": "\"ba59ce11-50f1-4cd4-9fd5-13510ece8684,3\"",
  "id": "ba59ce11-50f1-4cd4-9fd5-13510ece8684",
  "lastModifiedDateTime": "2018-09-24T21:25:47Z",
  "name": "Test List",
  "webUrl": "https://iowa.sharepoint.com/sites/cph/ph-it/Lists/Test%20List",
  "displayName": "Test List",
  "createdBy": {
    "user": {
      "email": "christopher-grycki@uiowa.edu",
      "id": "46930e98-518d-4299-8a4d-577f09f7ca2d",
      "displayName": "Grycki, Christopher J"
    }
  },
  "lastModifiedBy": {
    "user": {
      "email": "christopher-grycki@uiowa.edu",
      "id": "46930e98-518d-4299-8a4d-577f09f7ca2d",
      "displayName": "Grycki, Christopher J"
    }
  },
  "parentReference": {},
  "list": {
    "contentTypesEnabled": false,
    "hidden": false,
    "template": "genericList"
  }
}


// UPDATE SHAREPOINT w/o ID and Flow
https://datasavvy.me/2017/07/16/updating-a-sharepoint-list-item-with-flow-when-you-dont-have-the-id/

SCHEMA: {
    "type": "object",
    "properties": {
        "package_id": {
            "type": "integer"
        },
        "event_name": {
            "type": "string"
        },
        "date": {
            "type": "string"
        },
        "start_time": {
            "type": "string"
        },
        "end_time": {
            "type": "string"
        },
        "url": {
            "type": "string"
        }
    }
}

// Package ID column: Package_x0020_ID

msdn.microsoft.com/en-us/library/gg154758.aspx
*/