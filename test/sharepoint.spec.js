/**
 * Sharepoint testing
 */

const assert = require('assert');
const Sharepoint = require('../api/utils/Sharepoint');


const testPackageCreate = {
  date: '2018/01/01',
  start_time: '08:00AM',
  end_time: '09:00AM',
  event_name: 'Testing Item Create -- from ExpressJS',
  url: 'https://www.google.com',
  package_id: 121
};


const testPackageDelete = {package_id: 124 };


describe('Sharepoint', function() {
  it('creates a sharepoint list item', async function() {
    let res = await Sharepoint.createSharepointItem(testPackageCreate);
    assert.equal(res, undefined);
  });

  it('updates a sharepoint list item', async function() {
    // Create a similar item
    let testPackageUpdate = {...testPackageCreate, package_id: 122 };
    await Sharepoint.createSharepointItem(testPackageUpdate);

    // Alter item
    testPackageUpdate.event_name = 'Testing Item Update -- from Express';
    let res = await Sharepoint.updateSharepointItem(testPackageUpdate);

    assert.equal(res, undefined);
  });

  it('deletes a sharepoint list item', async function() {
    // Create an item to delete
    const testPackageToDelete = {...testPackageCreate, ...testPackageDelete };
    await Sharepoint.createSharepointItem(testPackageToDelete);

    // Try deleting the list item
    let res = await Sharepoint.deleteSharepointItem(testPackageDelete);
    assert.equal(res, undefined);
  })
})