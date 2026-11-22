// Template: copy to tests/<module>.test.js and adapt.
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { createTask } from '../src/tasks.js';
// import { yourFunction } from '../src/<module>.js';

/** Deterministic task factory: fixed clock, sequential ids. */
function factory() {
  let n = 0;
  return (title) => createTask(title, { now: () => 1_700_000_000_000, id: () => `id-${++n}` });
}

/** In-memory storage backend for createStore(). */
function memoryBackend(initial = {}) {
  const data = new Map(Object.entries(initial));
  return {
    getItem: (k) => (data.has(k) ? data.get(k) : null),
    setItem: (k, v) => void data.set(k, String(v)),
  };
}

describe('yourFunction', () => {
  it('does the main thing', () => {
    const make = factory();
    const tasks = [make('a')];
    // const result = yourFunction(tasks);
    // assert.deepEqual(result, expected);
    assert.equal(tasks.length, 1);
  });

  for (const [input, expected] of [
    // ['input', 'expected'],
  ]) {
    it(`maps ${JSON.stringify(input)} to ${JSON.stringify(expected)}`, () => {
      // assert.equal(yourFunction(input), expected);
    });
  }

  it('rejects invalid input', () => {
    // assert.throws(() => yourFunction(null), TypeError);
  });
});

export { factory, memoryBackend };
