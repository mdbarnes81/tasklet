import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  MAX_TITLE_LENGTH,
  addTask,
  clearDone,
  countRemaining,
  createTask,
  deserialise,
  filterTasks,
  normaliseTitle,
  removeTask,
  serialise,
  toggleTask,
} from '../src/tasks.js';

// Deterministic factory: fixed clock and sequential ids.
function factory() {
  let n = 0;
  return (title) => createTask(title, { now: () => 1_700_000_000_000, id: () => `id-${++n}` });
}

describe('normaliseTitle', () => {
  it('collapses internal whitespace and trims', () => {
    assert.equal(normaliseTitle('  buy \n  milk\t '), 'buy milk');
  });

  it('rejects empty and whitespace-only titles', () => {
    assert.throws(() => normaliseTitle(''), RangeError);
    assert.throws(() => normaliseTitle('   \n'), RangeError);
  });

  it('rejects non-strings', () => {
    assert.throws(() => normaliseTitle(42), TypeError);
    assert.throws(() => normaliseTitle(null), TypeError);
  });

  it('enforces the maximum length at the boundary', () => {
    assert.equal(normaliseTitle('a'.repeat(MAX_TITLE_LENGTH)).length, MAX_TITLE_LENGTH);
    assert.throws(() => normaliseTitle('a'.repeat(MAX_TITLE_LENGTH + 1)), RangeError);
  });

  it('keeps markup as literal text (rendering is responsible for escaping)', () => {
    assert.equal(normaliseTitle('<img src=x onerror=alert(1)>'), '<img src=x onerror=alert(1)>');
  });
});

describe('task list operations', () => {
  it('adds without mutating the original array', () => {
    const make = factory();
    const before = [];
    const after = addTask(before, make('one'));
    assert.equal(before.length, 0);
    assert.equal(after.length, 1);
  });

  it('toggles only the matching task', () => {
    const make = factory();
    const tasks = [make('a'), make('b')];
    const toggled = toggleTask(tasks, 'id-2');
    assert.equal(toggled[0].done, false);
    assert.equal(toggled[1].done, true);
    assert.equal(tasks[1].done, false, 'original untouched');
  });

  it('removes by id and ignores unknown ids', () => {
    const make = factory();
    const tasks = [make('a'), make('b')];
    assert.deepEqual(removeTask(tasks, 'id-1').map((t) => t.id), ['id-2']);
    assert.equal(removeTask(tasks, 'missing').length, 2);
  });

  it('clears done tasks and counts remaining', () => {
    const make = factory();
    const tasks = toggleTask([make('a'), make('b'), make('c')], 'id-2');
    assert.equal(countRemaining(tasks), 2);
    assert.deepEqual(clearDone(tasks).map((t) => t.id), ['id-1', 'id-3']);
  });

  it('created tasks are frozen', () => {
    const task = factory()('a');
    assert.throws(() => {
      task.done = true;
    }, TypeError);
  });
});

describe('filterTasks', () => {
  const make = factory();
  const tasks = toggleTask([make('a'), make('b')], 'id-1');

  for (const [filter, expected] of [
    ['all', ['id-1', 'id-2']],
    ['active', ['id-2']],
    ['done', ['id-1']],
  ]) {
    it(`"${filter}" returns ${expected.join(', ')}`, () => {
      assert.deepEqual(filterTasks(tasks, filter).map((t) => t.id), expected);
    });
  }

  it('rejects unknown filters', () => {
    assert.throws(() => filterTasks(tasks, 'everything'), RangeError);
  });
});

describe('serialise / deserialise', () => {
  it('round-trips', () => {
    const make = factory();
    const tasks = [make('a'), make('b')];
    assert.deepEqual(deserialise(serialise(tasks)), tasks);
  });

  it('returns [] for missing, corrupt or wrong-version data', () => {
    for (const input of [null, undefined, '', '{', 'null', '[]', '{"version":2,"tasks":[]}']) {
      assert.deepEqual(deserialise(input), [], `input: ${String(input)}`);
    }
  });

  it('drops invalid entries and duplicate ids', () => {
    const json = JSON.stringify({
      version: 1,
      tasks: [
        { id: 'ok', title: 'fine', done: false, createdAt: 1 },
        { id: 'ok', title: 'duplicate', done: false, createdAt: 2 },
        { id: '', title: 'no id', done: false, createdAt: 3 },
        { id: 'x', title: 'a'.repeat(MAX_TITLE_LENGTH + 1), done: false, createdAt: 4 },
        { id: 'y', title: 'bad done', done: 'yes', createdAt: 5 },
        { id: 'z', title: 'bad date', done: false, createdAt: 'never' },
        null,
        'string',
      ],
    });
    assert.deepEqual(deserialise(json).map((t) => t.title), ['fine']);
  });

  it('copies only known fields (no prototype or extra-key carry-over)', () => {
    const json =
      '{"version":1,"tasks":[{"id":"a","title":"t","done":false,"createdAt":1,"__proto__":{"polluted":true},"extra":1}]}';
    const [task] = deserialise(json);
    assert.deepEqual(Object.keys(task).sort(), ['createdAt', 'done', 'id', 'title']);
    assert.equal({}.polluted, undefined);
  });
});
