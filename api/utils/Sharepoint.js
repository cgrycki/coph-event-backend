/**
* Sharepoint.js
* @module utils/Sharepoint
*/
const rp = require('request-promise');
const { getSharepointFormat } = require('../utils/date.utils');


class Sharepoint {
  static getListItem(dynamoObj) {
    // Extract information for a Sharepoint List Item
    const info = dynamoObj.get();
    const comments = info.comments || '';
    const url = (info.room_number === 'XC100') ? `https://dev.cphb-events.public-health.uiowa.edu/cphit/${info.package_id}` : '';

    const flowBody = {
      date      : info.date,
      start_time: getSharepointFormat(info.date, info.start_time),
      end_time  : getSharepointFormat(info.date, info.end_time),
      event_name: info.event_name,
      package_id: info.package_id,
      user_email: info.user_email,
      url       : url,
      comments  : comments
    };

    return flowBody;
  }

  static getURI(method) {
    const methodMap = {
      post  : process.env.FLOW_CREATE,
      patch : process.env.FLOW_UPDATE,
      delete: process.env.FLOW_DELETE
    };
    return methodMap[method];
  }

  static async getPromise(options) {
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
}

async function sharepointMiddleware(request, response, next) {
  let result;
  const method = request.method;
  
  try {
    switch (method) {
      case 'PATCH':
        if (request.events[0].event.get('approved') !== 'true') return next();
        result = await Sharepoint.updateSharepointItem(request.events[0].event);
        break;
      case 'DELETE':
        result = await Sharepoint.deleteSharepointItem(request.params.package_id);
        break;
      default:
        return response.status(400).json({ error: true, message: 'Method not recognized'});
    };

    next();
  } catch(err) {
    return response.status(400).json({ error: err, method, result, event: request.events[0] });
  }
}

module.exports = {
  Sharepoint,
  sharepointMiddleware
};




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