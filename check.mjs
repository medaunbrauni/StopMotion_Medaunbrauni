// Run: node check.mjs
import assert from 'node:assert/strict';
import { passes, exportTicks, frameAt } from './timing.js';

function seq(t, mode, max, from = 0) {
  const out = [];
  for (const p of passes(t, mode, from)) {
    for (let i = 0; i < p.n; i++) {
      if (out.length >= max) return out;
      out.push(p.a + p.dir * i);
    }
  }
  return out;
}

assert.deepEqual(seq(3, 'normal', 10), [0, 1, 2]);
assert.deepEqual(seq(3, 'loop', 7), [0, 1, 2, 0, 1, 2, 0]);
assert.deepEqual(seq(4, 'boomerang', 10), [0, 1, 2, 3, 2, 1, 0, 1, 2, 3]);
assert.deepEqual(seq(4, 'boomerang', 6, 2), [2, 3, 2, 1, 0, 1]);
assert.deepEqual(seq(2, 'boomerang', 5), [0, 1, 0, 1, 0]);
assert.equal(exportTicks(4, 'boomerang', 'reps', 2, 0, 12), 13);
assert.deepEqual(seq(4, 'boomerang', 13).at(-1), 0);
assert.equal(exportTicks(4, 'loop', 'reps', 3, 0, 12), 12);
assert.equal(exportTicks(4, 'loop', 'secs', 3, 2.5, 12), 30);
assert.equal(exportTicks(5, 'normal', 'reps', 9, 0, 12), 5);
assert.equal(frameAt([1, 3, 1], 0), 0);
assert.equal(frameAt([1, 3, 1], 3), 1);
assert.equal(frameAt([1, 3, 1], 4), 2);
console.log('ok');
