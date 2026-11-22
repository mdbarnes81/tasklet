import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { createStore, STORAGE_KEY } from '../src/storage.js';
import { createTask, MAX_TITLE_LENGTH } from '../src/tasks.js';
import { createDocument, descendants, makeEvent } from './fixtures/dom.js';

let instance = 0;
const first = createTask('Original title', { id: () => 'first', now: () => 101 });
const second = { ...createTask('Another task', { id: () => 'second', now: () => 202 }), done: true };

async function withApp(run) {
  const data = new Map();
  let writes = 0;
  const backend = {
    getItem: (key) => data.get(key) ?? null,
    setItem(key, value) { writes++; data.set(key, String(value)); },
  };
  const store = createStore(backend);
  store.save([first, second]);
  writes = 0;
  const original = data.get(STORAGE_KEY);
  const document = createDocument();
  const oldDocument = Object.getOwnPropertyDescriptor(globalThis, 'document');
  const oldStorage = Object.getOwnPropertyDescriptor(globalThis, 'localStorage');
  Object.defineProperty(globalThis, 'document', { configurable: true, value: document });
  Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: backend });
  try {
    await import(`../src/main.js?test=${++instance}`);
    await run({ document, store, writes: () => writes, original, data });
  } finally {
    if (oldDocument) Object.defineProperty(globalThis, 'document', oldDocument);
    else delete globalThis.document;
    if (oldStorage) Object.defineProperty(globalThis, 'localStorage', oldStorage);
    else delete globalThis.localStorage;
  }
}

function row(document) {
  return document.getElementById('task-list').children[0];
}

function titleLabel(document) {
  return descendants(row(document)).find((el) => el.tagName === 'LABEL' && el.textContent === first.title);
}

function editor(document) {
  const input = descendants(row(document)).find(
    (el) => (el.tagName === 'INPUT' && el.type !== 'checkbox') || el.tagName === 'TEXTAREA',
  );
  assert.ok(input, 'editing should display an inline title input');
  return input;
}

function button(document, name) {
  const found = descendants(row(document)).find(
    (el) => el.tagName === 'BUTTON' && new RegExp(`\\b${name}\\b`, 'i')
      .test(el.getAttribute('aria-label') ?? el.textContent),
  );
  assert.ok(found, `editing should provide a ${name} button`);
  return found;
}

function startEditing(document) {
  const label = titleLabel(document);
  assert.ok(label, 'the original task title is rendered');
  label.dispatchEvent(makeEvent('dblclick'));
  return editor(document);
}

function assertUnchanged(app) {
  assert.equal(app.writes(), 0, 'editing without a valid save must not write storage');
  assert.equal(app.data.get(STORAGE_KEY), app.original);
  assert.deepEqual(app.store.load(), [first, second]);
}

function assertSaved(app, title) {
  assert.equal(app.writes(), 1);
  assert.deepEqual(app.store.load(), [{ ...first, title }, second]);
  assert.ok(descendants(row(app.document)).some((el) => el.textContent === title));
}

describe('title editing', () => {
  it('single-clicking a title toggles completion', async (t) => {
    t.mock.timers.enable();
    await withApp(async (app) => {
      titleLabel(app.document).click(1);
      t.mock.timers.tick(1000);
      await Promise.resolve();
      assert.deepEqual(app.store.load(), [{ ...first, done: true }, second]);
      assert.equal(app.writes(), 1);
      const checkbox = descendants(row(app.document)).find((el) => el.type === 'checkbox');
      assert.equal(checkbox.checked, true);
    });
  });

  it('double-clicking a title opens a labelled editor without toggling completion', async (t) => {
    t.mock.timers.enable();
    await withApp(async (app) => {
      // A real double-click includes two clicks, including label default actions.
      titleLabel(app.document).click(1);
      assertUnchanged(app);
      titleLabel(app.document).click(2);
      assertUnchanged(app);
      titleLabel(app.document).dispatchEvent(makeEvent('dblclick'));
      t.mock.timers.tick(1000);
      await Promise.resolve();
      assertUnchanged(app);
      const input = editor(app.document);
      assert.equal(input.value, first.title);
      const label = descendants(app.document.body).find(
        (el) => el.tagName === 'LABEL' && el.htmlFor && el.htmlFor === input.id && el.textContent.trim(),
      );
      const labelledBy = (input.getAttribute('aria-labelledby') ?? '').split(/\s+/)
        .some((id) => id && app.document.getElementById(id)?.textContent.trim());
      assert.ok(label || input.getAttribute('aria-label')?.trim() || labelledBy,
        'the title editor must have an accessible label');
      assert.equal(app.store.load()[0].done, false);
    });
  });

  it('a slow double-click opens the editor without changing completion or persistence', async (t) => {
    t.mock.timers.enable();
    await withApp(async (app) => {
      titleLabel(app.document).click(1);
      t.mock.timers.tick(501);
      await Promise.resolve();
      const label = titleLabel(app.document);
      label.click(2);
      label.dispatchEvent(makeEvent('dblclick'));
      t.mock.timers.tick(1000);
      await Promise.resolve();

      assert.equal(editor(app.document).value, first.title);
      assert.equal(app.store.load()[0].done, false, 'a slow double-click must not toggle completion');
      assert.equal(descendants(row(app.document)).find((el) => el.type === 'checkbox').checked, false);
      assert.equal(app.data.get(STORAGE_KEY), app.original);
      assert.deepEqual(app.store.load(), [first, second]);
    });
  });

  it('provides a keyboard-accessible Edit action', async () => {
    await withApp(async (app) => {
      const edit = button(app.document, 'Edit');
      assert.notEqual(edit.disabled, true);
      assert.notEqual(edit.getAttribute('tabindex'), '-1');
      edit.focus();
      assert.equal(app.document.activeElement, edit);
      const event = makeEvent('keydown', { key: 'Enter' });
      if (edit.dispatchEvent(event)) edit.click(); // native button keyboard activation
      assert.equal(editor(app.document).value, first.title);
      assertUnchanged(app);
    });
  });

  it('Save normalises and persists the title while preserving other task fields', async () => {
    await withApp(async (app) => {
      const input = startEditing(app.document);
      input.value = '  Revised \n  title \t';
      button(app.document, 'Save').click();
      assertSaved(app, 'Revised title');
    });
  });

  it('Enter saves a valid title at the length boundary', async () => {
    await withApp(async (app) => {
      const input = startEditing(app.document);
      input.value = 'x'.repeat(MAX_TITLE_LENGTH);
      input.dispatchEvent(makeEvent('keydown', { key: 'Enter' }));
      assertSaved(app, input.value);
    });
  });

  for (const action of ['Cancel', 'Escape']) {
    it(`${action} discards an unsaved edit without persistence`, async () => {
      await withApp(async (app) => {
        const input = startEditing(app.document);
        assert.equal(app.document.activeElement, input);
        input.value = 'Discard me';
        if (action === 'Cancel') {
          const cancel = button(app.document, 'Cancel');
          cancel.focus();
          cancel.click();
        } else input.dispatchEvent(makeEvent('keydown', { key: 'Escape' }));
        assert.ok(titleLabel(app.document), 'the original title should be visible again');
        assert.equal(descendants(row(app.document)).includes(input), false);
        assertUnchanged(app);
        assert.equal(app.document.activeElement === button(app.document, 'Edit'), true,
          'focus should return to the restored Edit button');
      });
    });
  }

  for (const [name, value, message] of [
    ['empty', '', 'Title must not be empty'],
    ['whitespace-only', ' \n\t ', 'Title must not be empty'],
    ['oversized', 'x'.repeat(MAX_TITLE_LENGTH + 1), `Title must be ${MAX_TITLE_LENGTH} characters or fewer`],
  ]) {
    it(`rejects ${name} titles with an accessible error and no persistence`, async () => {
      await withApp(async (app) => {
        const input = startEditing(app.document);
        input.value = value;
        button(app.document, 'Save').click();
        assert.equal(editor(app.document).value, value);
        const errors = descendants(app.document.body).filter((el) =>
          !el.hidden && el.textContent.includes(message) &&
          (el.getAttribute('role') === 'alert' || el.getAttribute('aria-live')),
        );
        assert.ok(errors.length, 'validation error must be announced accessibly');
        assertUnchanged(app);
      });
    });
  }

  it('renders saved markup as literal title text', async () => {
    await withApp(async (app) => {
      const markup = '<img src=x onerror=alert(1)>';
      const input = startEditing(app.document);
      input.value = markup;
      button(app.document, 'Save').click();
      assertSaved(app, markup);
      const taskRow = row(app.document);
      assert.ok(descendants(taskRow).some((el) => el.textContent === markup && el.children.length === 0));
      assert.equal(descendants(taskRow).some((el) => el.tagName === 'IMG'), false);
    });
  });
});

describe('task completion', () => {
  it('restores focus to the corresponding checkbox after updating completion', async () => {
    await withApp(async (app) => {
      const checkbox = descendants(row(app.document)).find((el) => el.type === 'checkbox');
      checkbox.focus();
      checkbox.checked = true;
      checkbox.dispatchEvent(makeEvent('change'));
      assert.deepEqual(app.store.load(), [{ ...first, done: true }, second]);
      const restored = descendants(row(app.document)).find((el) => el.type === 'checkbox');
      assert.equal(restored.checked, true);
      assert.equal(app.document.activeElement === restored, true,
        'focus should return to the checkbox for the updated task');
    });
  });
});
