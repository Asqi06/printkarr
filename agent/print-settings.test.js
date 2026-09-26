import { test } from 'node:test';
import assert from 'node:assert/strict';
import { printSettings } from './print-settings.js';

test('selected pages and copies reach SumatraPDF without affecting the cover', () => {
  const order = { sides: 'double', printType: 'bw', pageRange: '1, 3-4', copies: 2 };
  assert.equal(printSettings(order), 'duplexlong,monochrome,1,3-4,2x');
  assert.equal(printSettings({ ...order, sides: 'single', pageRange: null, copies: 1 }), 'simplex,monochrome');
  assert.equal(printSettings(order, 'simplex,fit'), 'simplex,fit,1,3-4,2x');
  assert.throws(() => printSettings({ ...order, pageRange: '1,all' }), /Invalid page range/);
});
