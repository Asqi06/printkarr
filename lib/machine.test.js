import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  STATES, TRANSITIONS, canTransition, nextStates, isTerminal, printedAt, transition
} from './machine.js';

const HAPPY = [
  'CREATED', 'PAYMENT_PENDING', 'CONFIRMED', 'PRINT_QUEUE', 'PRINTING',
  'PRINTED', 'READY_FOR_PICKUP', 'RIDER_ASSIGNED', 'PICKED_UP',
  'OUT_FOR_DELIVERY', 'DELIVERED'
];

test('happy path walks the full golden loop', () => {
  const order = { id: 'PK-T1', status: 'CREATED', history: [] };
  for (let i = 1; i < HAPPY.length; i++) transition(order, HAPPY[i], { by: 'test' });
  assert.equal(order.status, 'DELIVERED');
  assert.equal(order.history.length, HAPPY.length - 1);
  assert.ok(order.updatedAt);
});

test('illegal jumps throw (no spaghetti statuses)', () => {
  const order = { id: 'PK-T2', status: 'CREATED', history: [] };
  assert.throws(() => transition(order, 'PRINTING'), /Illegal transition/);
  assert.throws(() => transition(order, 'DELIVERED'), /Illegal transition/);
  assert.equal(order.status, 'CREATED');
  assert.equal(order.history.length, 0);
});

test('failure states and recovery match §38', () => {
  let o = { id: 'a', status: 'PAYMENT_PENDING', history: [] };
  transition(o, 'PAYMENT_FAILED');
  transition(o, 'PAYMENT_PENDING'); // retry
  transition(o, 'CONFIRMED');

  o = { id: 'b', status: 'PRINTING', history: [] };
  transition(o, 'PRINT_FAILED');
  transition(o, 'PRINT_QUEUE'); // requeue

  o = { id: 'c', status: 'OUT_FOR_DELIVERY', history: [] };
  transition(o, 'DELIVERY_FAILED');
  transition(o, 'RIDER_ASSIGNED'); // reassign

  o = { id: 'd', status: 'READY_FOR_PICKUP', history: [] };
  transition(o, 'CANCELLED');
  transition(o, 'REFUNDED');
  assert.equal(o.status, 'REFUNDED');
});

test('terminals have no exits; unknown states rejected', () => {
  assert.deepEqual(nextStates('DELIVERED'), []);
  assert.deepEqual(nextStates('REFUNDED'), []);
  assert.ok(isTerminal('DELIVERED') && isTerminal('REFUNDED'));
  assert.ok(!isTerminal('PRINTING'));
  assert.equal(canTransition('NOPE', 'CREATED'), false);
  assert.equal(canTransition('CREATED', 'NOPE'), false);
});

test('every state in STATES has a transition row', () => {
  for (const s of STATES) assert.ok(Array.isArray(TRANSITIONS[s]), `missing row: ${s}`);
});

test('print reports use the print event and omit cancelled orders', () => {
  const order = { status: 'PRINTING', history: [] };
  transition(order, 'PRINTED', { at: '2026-09-24T10:00:00.000Z' });
  transition(order, 'READY_FOR_PICKUP', { at: '2026-09-24T10:01:00.000Z' });
  assert.equal(printedAt(order), '2026-09-24T10:00:00.000Z');
  transition(order, 'CANCELLED', { at: '2026-09-24T10:02:00.000Z' });
  assert.equal(printedAt(order), null);
  assert.equal(printedAt({ status: 'PRINT_QUEUE', history: [] }), null);
  assert.equal(printedAt({ status: 'PRINTED', updatedAt: '2026-09-24T10:00:00.000Z' }), '2026-09-24T10:00:00.000Z');
});
