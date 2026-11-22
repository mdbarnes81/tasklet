import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { STORAGE_KEY, createStore } from '../src/storage.js';
import { createTask } from '../src/tasks.js';

function memoryBackend(initial = {}) {
  const data = new Map(Object.entries(initial));
  return {
    getItem: (k) => (data.has(k) ? data.get(k) : null),
    setItem: (k, v) => void data.set(k, String(v)),
    dump: () => Object.fromEntries(data),
  };
}

const throwingBackend = {
  getItem() {
    throw new Error('SecurityError');
  },
  setItem() {
    throw new Error('QuotaExceededError');
  },
};

describe('createStore', () => {
  it('saves under the versioned key and loads back', () => {
    const backend = memoryBackend();
    const store = createStore(backend);
    const tasks = [createTask('persist me', { id: () => 'a', now: () => 1 })];
    assert.equal(store.save(tasks), true);
    assert.ok(backend.dump()[STORAGE_KEY]);
    assert.deepEqual(store.load(), tasks);
  });

  it('returns [] when nothing is stored', () => {
    assert.deepEqual(createStore(memoryBackend()).load(), []);
  });

  it('returns [] for corrupt stored data', () => {
    assert.deepEqual(createStore(memoryBackend({ [STORAGE_KEY]: '{not json' })).load(), []);
  });

  it('degrades gracefully when storage throws', () => {
    const store = createStore(throwingBackend);
    assert.deepEqual(store.load(), []);
    assert.equal(store.save([]), false);
  });

  it('works with no backend at all', () => {
    const store = createStore(null);
    assert.deepEqual(store.load(), []);
    assert.equal(store.save([]), false);
  });
});
