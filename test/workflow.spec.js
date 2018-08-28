/**
 * Testing for Workflow REST utility class
 */

require('dotenv').config(); 
const assert = require('assert');
const Workflow = require('../api/workflow/Workflow');

describe('Workflow REST class', function() {
  let faux_user_token = 'AAABBBCCC',
      faux_ip_address = '001.001.001.001',
      faux_package_id = 123;

  // Headers
  describe('#headers', function() {
    let correct_header = {
        'Accept': 'application/vnd.workflow+json;version=1.1',
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${faux_user_token}`,
        'X-Client-Remote-Addr': faux_ip_address,
        'X-App-Authorization': process.env.UIOWA_SECRET_ACCESS_KEY
      };

    it("Should create correct headers given a user's token + IP", async function() {
      let faux_header = await Workflow.headers(faux_user_token, faux_ip_address);

      // Create copies of headers
      let faux_header_sans_auth = { ...faux_header };
      let correct_header_sans_auth = { ...correct_header };
      
      // Remove application auth from both headers
      delete correct_header_sans_auth['X-App-Authorization'];
      delete faux_header_sans_auth['X-App-Authorization'];

      assert.deepEqual(faux_header_sans_auth, correct_header_sans_auth);
    });
  });

  // URLs
  describe('#URI', function() {
    let correct_base_uri = 'https://apps.its.uiowa.edu/workflow/test/api/developer/forms/6025/packages',
        correct_tool_uri = 'https://apps.its.uiowa.edu/workflow/test/api/developer/tools/forms/6025/packages';

    it('Should create the correct URI to POST an event', function() {
      let faux_base_uri = Workflow.constructURI();
      assert.equal(faux_base_uri, correct_base_uri);
    });

    it('Should create the correct URI to interact with workflow tools', function() {
      let faux_tool_uri = Workflow.constructURI(true);
      assert.equal(faux_tool_uri, correct_tool_uri);
    });

    it('Should create correct URI for a single package\'s permissions (number)', function() {
      let pid = 1;
      let queryString = Workflow.constructPermissionsURI(pid);
      let correctQueryString = 'id=1';

      assert.equal(queryString, correctQueryString);
    });

    it('Should create correct URI for a single package\'s permissions (string)', function() {
      let pid = '1';
      let queryString = Workflow.constructPermissionsURI(pid);
      let correctQueryString = 'id=1';

      assert.equal(queryString, correctQueryString);
    });

    it('Should create correct URI for a multiple package\'s permissions (numbers)', function() {
      let pids = [1, 2, 3];
      let queryString = Workflow.constructPermissionsURI(pids);
      let correctQueryString = 'id=1&id=2&id=3';

      assert.equal(queryString, correctQueryString);
    });

    it('Should create correct URI for a multiple package\'s permissions (strings)', function() {
      let pids = ['1', '2', '3'];
      let queryString = Workflow.constructPermissionsURI(pids);
      let correctQueryString = 'id=1&id=2&id=3';

      assert.equal(queryString, correctQueryString);
    });
  });
});