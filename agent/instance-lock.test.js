import { test } from 'node:test';
import assert from 'node:assert/strict';
import { acquireAgentLock } from './instance-lock.js';

test('only one agent can own the printer lock; releasing allows restart', { skip:process.platform !== 'win32' }, async () => {
  const pipe = '\\\\.\\pipe\\printkarr-lock-test-' + process.pid;
  const first = await acquireAgentLock(pipe);
  assert.ok(first);
  try { assert.equal(await acquireAgentLock(pipe), null); }
  finally { await new Promise(resolve => first.close(resolve)); }
  const restarted = await acquireAgentLock(pipe);
  assert.ok(restarted);
  await new Promise(resolve => restarted.close(resolve));
});
