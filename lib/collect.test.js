import { test } from 'node:test';
import assert from 'node:assert/strict';
import { collectTokenFor, findCollectToken, consumeCollectToken } from './collect.js';

const db = () => ({ collectTokens: [] });

test('mint reuses the live token per order', () => {
  const d = db();
  const a = collectTokenFor(d, 'PK-1', 1000);
  assert.match(a, /^[a-f0-9]{32}$/);
  assert.equal(collectTokenFor(d, 'PK-1', 2000), a);
  assert.notEqual(collectTokenFor(d, 'PK-2', 2000), a);
});

test('consume enforces single-use, readiness and ownership', () => {
  const d = db();
  const tok = collectTokenFor(d, 'PK-1', 1000);
  const ready = { id: 'PK-1', status: 'READY_FOR_PICKUP' };
  assert.equal(findCollectToken(d, tok, 2000).ok, true);
  assert.equal(consumeCollectToken(d, tok, { id: 'PK-1', status: 'PRINTED' }, 2000).error, 'not-ready');
  assert.equal(consumeCollectToken(d, tok, { id: 'PK-9', status: 'READY_FOR_PICKUP' }, 2000).error, 'mismatch');
  assert.equal(consumeCollectToken(d, tok, ready, 2000).ok, true);
  assert.equal(consumeCollectToken(d, tok, ready, 3000).error, 'used');
  assert.equal(findCollectToken(d, tok, 3000).error, 'used');
});

test('expired and unknown tokens are rejected', () => {
  const d = db();
  const tok = collectTokenFor(d, 'PK-1', 1000);
  assert.equal(findCollectToken(d, tok, 1000 + 8 * 864e5).error, 'expired');
  assert.equal(findCollectToken(d, 'f'.repeat(32), 2000).error, 'bad-link');
  assert.equal(consumeCollectToken(d, 'f'.repeat(32), { id: 'PK-1', status: 'READY_FOR_PICKUP' }, 2000).error, 'bad-link');
});
