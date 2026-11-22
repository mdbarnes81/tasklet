// DOM wiring for Tasklet. All rendering uses createElement + textContent: never innerHTML.
// `npm run lint:security` fails the build if an HTML-parsing sink appears in src/.
import {
  addTask,
  clearDone,
  countRemaining,
  createTask,
  filterTasks,
  normaliseTitle,
  removeTask,
  toggleTask,
} from './tasks.js';
import { createStore } from './storage.js';

const store = createStore();
const state = { tasks: store.load(), filter: 'all', editing: null };
const drafts = new Map();
const pendingTitleClicks = new Map();
const TITLE_CLICK_DELAY = 1000;

const els = {
  form: document.getElementById('new-task-form'),
  input: document.getElementById('new-task-title'),
  error: document.getElementById('form-error'),
  list: document.getElementById('task-list'),
  status: document.getElementById('status'),
  filters: document.querySelectorAll('[data-filter]'),
  clearDone: document.getElementById('clear-done'),
};

function commit(nextTasks) {
  state.tasks = nextTasks;
  if (!store.save(state.tasks)) {
    showError('Could not save. Changes will be lost when you close this tab.');
  }
  render();
}

function showError(message) {
  els.error.textContent = message;
  els.error.hidden = message.length === 0;
}

function finishEditing(id) {
  drafts.delete(id);
  state.editing = null;
  render();
  document.getElementById(`edit-${id}`)?.focus();
}

function rememberDraft() {
  if (state.editing !== null) {
    const input = document.getElementById(`editor-${state.editing}`);
    if (input) drafts.set(state.editing, input.value);
  }
}

function cancelTitleClick(id) {
  if (!pendingTitleClicks.has(id)) return;
  clearTimeout(pendingTitleClicks.get(id));
  pendingTitleClicks.delete(id);
}

function toggleCompletion(id, restoreFocus) {
  if (!state.tasks.some((task) => task.id === id)) return;
  commit(toggleTask(state.tasks, id));
  if (restoreFocus) {
    const control = document.getElementById(`task-${id}`);
    if (control) control.focus();
    else els.input.focus();
  }
}

function renderEditor(task) {
  const editor = document.createElement('div');
  editor.className = 'task__editor';

  const input = document.createElement('input');
  input.type = 'text';
  input.id = `editor-${task.id}`;
  input.value = drafts.get(task.id) ?? task.title;
  input.setAttribute('aria-label', 'Task title');
  input.setAttribute('aria-describedby', `edit-error-${task.id}`);

  const error = document.createElement('p');
  error.id = `edit-error-${task.id}`;
  error.className = 'error task__edit-error';
  error.setAttribute('role', 'alert');
  error.hidden = true;

  const save = document.createElement('button');
  save.type = 'button';
  save.textContent = 'Save';
  const saveTitle = () => {
    let title;
    try {
      title = normaliseTitle(input.value);
    } catch (err) {
      error.textContent = err instanceof Error ? err.message : 'Could not edit task';
      error.hidden = false;
      input.setAttribute('aria-invalid', 'true');
      input.focus();
      return;
    }
    drafts.delete(task.id);
    state.editing = null;
    commit(state.tasks.map((t) => (t.id === task.id ? Object.freeze({ ...t, title }) : t)));
    document.getElementById(`edit-${task.id}`)?.focus();
  };
  save.addEventListener('click', saveTitle);
  input.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      saveTitle();
    }
  });
  editor.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      event.preventDefault();
      finishEditing(task.id);
    }
  });

  const cancel = document.createElement('button');
  cancel.type = 'button';
  cancel.textContent = 'Cancel';
  cancel.addEventListener('click', () => finishEditing(task.id));
  editor.append(input, save, cancel, error);
  return editor;
}

function renderTask(task) {
  const li = document.createElement('li');
  li.className = task.done ? 'task task--done' : 'task';

  const checkbox = document.createElement('input');
  checkbox.type = 'checkbox';
  checkbox.id = `task-${task.id}`;
  checkbox.checked = task.done;
  checkbox.setAttribute('aria-label', task.title);
  checkbox.addEventListener('change', () => toggleCompletion(task.id, true));

  const label = document.createElement('label');
  label.htmlFor = checkbox.id;
  label.textContent = task.title; // user content: textContent only
  // Defer single-click completion to allow the browser's dblclick event to cancel it.
  // The 1 s grace period exceeds the common 500 ms interval; browsers expose no
  // platform double-click threshold, so single-click completion is intentionally delayed.
  label.addEventListener('click', (event) => {
    event.preventDefault();
    cancelTitleClick(task.id);
    if (event.detail > 1) return;
    checkbox.focus();
    if (event.detail === 0) {
      toggleCompletion(task.id, true);
      return;
    }
    pendingTitleClicks.set(task.id, setTimeout(() => {
      pendingTitleClicks.delete(task.id);
      const current = document.getElementById(`task-${task.id}`);
      toggleCompletion(task.id, current !== null && document.activeElement === current);
    }, TITLE_CLICK_DELAY));
  });
  const startEditing = () => {
    cancelTitleClick(task.id);
    rememberDraft();
    state.editing = task.id;
    render();
    document.getElementById(`editor-${task.id}`)?.focus();
  };
  label.addEventListener('dblclick', startEditing);

  const edit = document.createElement('button');
  edit.type = 'button';
  edit.id = `edit-${task.id}`;
  edit.textContent = 'Edit';
  edit.setAttribute('aria-label', `Edit "${task.title}"`);
  edit.addEventListener('click', startEditing);

  const remove = document.createElement('button');
  remove.type = 'button';
  remove.className = 'task__remove';
  remove.textContent = '×';
  remove.setAttribute('aria-label', `Delete "${task.title}"`);
  remove.addEventListener('click', () => {
    commit(removeTask(state.tasks, task.id));
    els.input.focus(); // re-render destroyed the focused button; never drop focus to <body>
  });

  if (state.editing === task.id) {
    li.append(checkbox, renderEditor(task), remove);
  } else {
    li.append(checkbox, label, edit, remove);
  }
  return li;
}

function render() {
  rememberDraft();
  for (const id of drafts.keys()) {
    if (!state.tasks.some((task) => task.id === id)) drafts.delete(id);
  }
  if (state.editing !== null && !state.tasks.some((task) => task.id === state.editing)) {
    state.editing = null;
  }
  const visible = filterTasks(state.tasks, state.filter);
  els.list.replaceChildren(...visible.map(renderTask));

  const remaining = countRemaining(state.tasks);
  els.status.textContent = `${remaining} ${remaining === 1 ? 'task' : 'tasks'} left`;

  for (const btn of els.filters) {
    btn.setAttribute('aria-pressed', String(btn.dataset.filter === state.filter));
  }
  els.clearDone.disabled = state.tasks.every((t) => !t.done);
}

els.form.addEventListener('submit', (event) => {
  event.preventDefault();
  try {
    commit(addTask(state.tasks, createTask(els.input.value)));
    els.input.value = '';
    showError('');
  } catch (err) {
    showError(err instanceof Error ? err.message : 'Could not add task');
  }
  els.input.focus();
});

for (const btn of els.filters) {
  btn.addEventListener('click', () => {
    state.filter = btn.dataset.filter;
    render();
  });
}

els.clearDone.addEventListener('click', () => {
  commit(clearDone(state.tasks));
  els.input.focus(); // the button becomes disabled, which would otherwise strand focus
});

render();
