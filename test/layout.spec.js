const assert = require('assert');
const Joi    = require('joi');
const {
  countSchema,
  furnitureItemSchema,
  furnitureItemsSchema,
  layoutSchema
} = require('../api/layouts/layout.schema');



describe('#Layouts', function() {
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
    it('accepts a good layout object', function() {
      let goodLayout = {
        id: 123,
        count: {
          num_chairs: 10,
          num_chair_racks: 1,
          num_circles: 6,
          num_circle_racks: 1,
          num_rects: 10,
          num_rect_racks: 2,
          num_cocktails: 6,
          num_cocktail_racks: 1,
          chairs_per_table: 6,
          num_displays: 0,
          num_trashs: 0
        },
        items: [{ id: 'circle1', furn: 'circle', x: 100, y: 100}]
      };
      
      let { error: goodLayoutErr, value: goodLayoutVal } = layoutSchema.validate(goodLayout);
      assert.equal(goodLayoutErr, null);
    });

  });
});