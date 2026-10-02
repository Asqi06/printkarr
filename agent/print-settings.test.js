import { test } from 'node:test';
import assert from 'node:assert/strict';
import { printSettings, checkRenderedPages } from './print-settings.js';

test('selected pages and copies reach SumatraPDF without affecting the cover', () => {
  const order = { sides: 'double', printType: 'bw', pageRange: '1, 3-4', copies: 2 };
  assert.equal(printSettings(order), 'duplexlong,monochrome,paper=A4,shrink,1,3,4,2x');
  assert.equal(printSettings({ ...order, sides: 'single', pageRange: null, copies: 1 }), 'simplex,monochrome,paper=A4,shrink,1x');
  assert.equal(printSettings(order, 'simplex,fit'), 'simplex,fit,1,3,4,2x');
  assert.throws(() => printSettings({ ...order, pageRange: '1,all' }), /Invalid page range/);
});

test('duplicate/reversed ranges print each billed page once and reject invalid limits', () => {
  assert.equal(printSettings({pageRange:'4-2,3,1',filePages:4,copies:1}), 'simplex,monochrome,paper=A4,shrink,1,2,3,4,1x');
  for (const range of ['0','5','1-1000000']) assert.throws(()=>printSettings({pageRange:range,filePages:4}), /Invalid page range/);
  assert.throws(()=>printSettings({copies:0}), /Invalid copy count/);
});
test('render preflight requires all pages and the charged document count', () => {
  const log = 'page count: 3\npagerender 1: 2 ms\npagerender 2: 2 ms\npagerender 3: 2 ms';
  assert.equal(checkRenderedPages(log,3),3);
  assert.throws(()=>checkRenderedPages(log,4), /order recorded/);
  assert.throws(()=>checkRenderedPages(log.replace('pagerender 2:', 'pageload 2:')), /render check failed/);
  assert.throws(()=>checkRenderedPages(log+'\nError: failed to render page 2'), /render check failed/);
  assert.throws(()=>checkRenderedPages(''), /render check failed/);
});
