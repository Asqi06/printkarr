import assert from 'node:assert/strict';
import { pageRange } from '../public/print-plan.js';
import { normPhone } from '../lib/otp.js';

// 1. Natural page range inputs (newbie natural language)
assert.deepEqual(pageRange('1 to 5', 10), [1, 2, 3, 4, 5]);
assert.deepEqual(pageRange('pages 1-5', 10), [1, 2, 3, 4, 5]);
assert.deepEqual(pageRange('page 3 - 6', 10), [3, 4, 5, 6]);
assert.deepEqual(pageRange('1 through 3, 5 to 7', 10), [1, 2, 3, 5, 6, 7]);
assert.deepEqual(pageRange('1, 3-5', 10), [1, 3, 4, 5]);

// 2. Phone number normalization (leading zero, standard, +91)
assert.equal(normPhone('09825011111'), '9825011111');
assert.equal(normPhone('9825011111'), '9825011111');
assert.equal(normPhone('+91 98250 11111'), '9825011111');
assert.equal(normPhone('919825011111'), '9825011111');
assert.equal(normPhone('12345'), null);

console.log('✓ Newbie UX checks passed: natural page ranges and phone normalization.');
