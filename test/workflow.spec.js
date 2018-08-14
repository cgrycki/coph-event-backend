/**
 * Testing for Workflow REST utility class
 */

require('dotenv').config(); 
const assert = require('assert');
const Workflow = require('../api/workflow/Workflow');

describe('Workflow REST class', function() {

  // Headers
  describe('#headers', function() {
    let faux_user_token = 'AAABBBCCC',
        faux_ip_address = '001.001.001.001',
        correct_header = {
        'Accept': 'application/vnd.workflow+json;version=1.1',
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${faux_user_token}`,
        'X-Client-Remote-Addr': faux_ip_address,
        'X-App-Authorization': process.env.UIOWA_SECRET_ACCESS_KEY
      };

    it("Should create correct headers given a user's token + IP", function() {
      let faux_header = Workflow.headers(faux_user_token, faux_ip_address);
      assert.deepEqual(faux_header, correct_header);
    });
  });

  // URLs
  describe('#URI', function() {
    let correct_base_uri = 'https://apps.its.uiowa.edu/workflow/dev/api/developer/forms/6025/packages',
        correct_tool_uri = 'https://apps.its.uiowa.edu/workflow/dev/api/developer/tools/forms/6025/packages';

    it('Should create the correct URI to POST an event', function() {
      let faux_base_uri = Workflow.constructURI();
      assert.equal(faux_base_uri, correct_base_uri);
    });

    it('Should create the correct URI to interact with workflow tools', function() {
      let faux_tool_uri = Workflow.constructURI(true);
      assert.equal(faux_tool_uri, correct_tool_uri);
    })
  });
});