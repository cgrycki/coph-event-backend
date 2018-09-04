const assert = require('assert');
const Joi    = require('joi');
const {
  furnitureItemSchema,
  furnitureItemsSchema,
  publicLayoutSchema,
  privateLayoutSchema,
  layoutSchema,
  layoutValidation
} = require('../api/layouts/layout.schema');


// EXAMPLES
const ex_items = [
  {id: 'circle1', furn: 'circle', x: 10, y: 100},
  {id: 'circle2', furn: 'circle', x: 10, y: 100},
  {id: 'circle3', furn: 'circle', x: 10, y: 100}
];

const publicLayout = { id: 'TESTING TITLE', items: ex_items };
const privateLayout = { package_id: 123, user_email: 'test@gmail.com', items: ex_items};



describe('Layouts', function() {
  describe('item schema', function() {
    it('rejects furniture items without all attributes', function() {
      let itemMissing = { x: 100, y: 100, id: 'circle1' };
      let { error: missingErr, value: missingVal } = furnitureItemSchema.validate(itemMissing);
      assert.notEqual(missingErr, null);
    });

    it('rejects furniture items with invalid furniture types', function() {
      let itemBad = { x: 100, y: 100, id: 'circle1', furn: 'not in valid furniture types' };
      let { error: badErr, value: badVal } = furnitureItemSchema.validate(itemBad);
      assert.notEqual(badErr, null);
    });

    it('accepts known good furniture items', function() {
      let itemGood = {x: 100, y: 100, id: 'circle1', furn: 'circle' };
      let { error: goodErr, value: goodVal } = furnitureItemSchema.validate(itemGood);
      assert.notEqual(goodErr, Error);
    });

    it('rejects an array of furniture items with duplicated furniture ids', function() {
      let badItems = [
        {id: 'circle1', furn: 'circle', x: 10, y: 100},
        {id: 'circle1', furn: 'circle', x: 10, y: 100},
        {id: 'circle3', furn: 'circle', x: 10, y: 100}
      ];
      
      let { error: badItemsErr, value: badItemsValue } = furnitureItemsSchema.validate(badItems);
      assert.notEqual(badItemsErr, null);
    });

    it('accepts an array of valid furniture items', function() {
      let goodItems = [
        {id: 'circle1', furn: 'circle', x: 10, y: 100},
        {id: 'circle2', furn: 'circle', x: 10, y: 100},
        {id: 'circle3', furn: 'circle', x: 10, y: 100}
      ];
      
      let { error: goodItemsErr, value: goodItemsValue } = furnitureItemsSchema.validate(goodItems);
      assert.notEqual(goodItemsErr, Error);
    });
  });

  describe('layout schema', function() {
    it('accepts a public layout schema', function() {
      let shouldBe = { ...publicLayout, type: 'public' };
      let { error, value } = Joi.validate(publicLayout, publicLayoutSchema);

      assert.deepEqual(error, null);
      assert.deepEqual(value, shouldBe);
    });

    it('accepts a private layout schema', function() {
      let shouldBe = { ...privateLayout, type: 'private', id: '123' };
      let { error, value } = Joi.validate(privateLayout, privateLayoutSchema);

      assert.deepEqual(error, null);
      assert.deepEqual(value, shouldBe);
    });

    it('correctly casts (public) layout type', function() {
      let shouldBe = { ...publicLayout, type: 'public' };
      let { error, value } = layoutValidation(publicLayout);

      assert.deepEqual(error, null);
      assert.deepEqual(value, shouldBe);
    });

    it('correctly casts (private) layout type', function() {
      let shouldBe = { ...privateLayout, type: 'private', id: '123' };
      let { error, value } = layoutValidation(privateLayout);

      assert.deepEqual(error, null);
      assert.deepEqual(value, shouldBe);
    });

    it('DynamoDB model validates (public) casted layouts', function() {
      let shouldBe = { ...publicLayout, type: 'public' };
      let { error, value } = layoutValidation(publicLayout);

      // assert there was no errors while casting
      assert.deepEqual(error, null);
      assert.deepEqual(value, shouldBe);

      // Validate casted layout object passes model
      let { error: castErr, value: castVal } = Joi.validate(value, layoutSchema);
      assert.deepEqual(castErr, null);
    })

    it('DynamoDB model validates (private) casted layouts', function() {
      let shouldBe = { ...privateLayout, type: 'private', id: '123' };
      let { error, value } = layoutValidation(privateLayout);

      // assert there was no errors while casting
      assert.deepEqual(error, null);
      assert.deepEqual(value, shouldBe);

      // Validate casted layout object passes model
      let { error: castErr, value: castVal } = Joi.validate(value, layoutSchema);
      assert.deepEqual(castErr, null);
    })
  });
});