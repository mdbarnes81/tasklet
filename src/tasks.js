// Pure, DOM-free task logic for Tasklet.
// Every exported function is side-effect free and returns new data; nothing is mutated.
// Keep this module free of `window`, `document` and storage so it runs under `node --test`.

export const MAX_TITLE_LENGTH = 120;
export const FILTERS = Object.freeze(['all', 'active', 'done']);
export const SCHEMA_VERSION = 1;

/**
 * Collapse whitespace, trim and validate a raw title.
 * @param {unknown} raw
 * @returns {string}
 */
export function normaliseTitle(raw) {
  if (typeof raw !== 'string') {
    throw new TypeError('Title must be a string');
  }
  const title = raw.replace(/\s+/g, ' ').trim();
  if (title.length === 0) {
    throw new RangeError('Title must not be empty');
  }
  if (title.length > MAX_TITLE_LENGTH) {
    throw new RangeError(`Title must be ${MAX_TITLE_LENGTH} characters or fewer`);
  }
  return title;
}

const defaultId = () => globalThis.crypto.randomUUID();

/**
 * @typedef {{ id: string, title: string, done: boolean, createdAt: number }} Task
 */

/**
 * @param {string} rawTitle
 * @param {{ now?: () => number, id?: () => string }} [deps] injectable for deterministic tests
 * @returns {Readonly<Task>}
 */
export function createTask(rawTitle, { now = Date.now, id = defaultId } = {}) {
  return Object.freeze({
    id: id(),
    title: normaliseTitle(rawTitle),
    done: false,
    createdAt: now(),
  });
}

/** @param {readonly Task[]} tasks @param {Task} task */
export const addTask = (tasks, task) => [...tasks, task];

/** @param {readonly Task[]} tasks @param {string} id */
export const toggleTask = (tasks, id) =>
  tasks.map((t) => (t.id === id ? Object.freeze({ ...t, done: !t.done }) : t));

/** @param {readonly Task[]} tasks @param {string} id */
export const removeTask = (tasks, id) => tasks.filter((t) => t.id !== id);

/** @param {readonly Task[]} tasks */
export const clearDone = (tasks) => tasks.filter((t) => !t.done);

/** @param {readonly Task[]} tasks */
export const countRemaining = (tasks) => tasks.filter((t) => !t.done).length;

/**
 * @param {readonly Task[]} tasks
 * @param {'all' | 'active' | 'done'} filter
 */
export function filterTasks(tasks, filter) {
  if (!FILTERS.includes(filter)) {
    throw new RangeError(`Unknown filter: ${String(filter)}`);
  }
  if (filter === 'active') return tasks.filter((t) => !t.done);
  if (filter === 'done') return tasks.filter((t) => t.done);
  return [...tasks];
}

/** @param {readonly Task[]} tasks @returns {string} */
export const serialise = (tasks) => JSON.stringify({ version: SCHEMA_VERSION, tasks });

/**
 * Parse persisted data defensively. Storage is untrusted input: anything malformed is
 * dropped rather than thrown, and only known fields are copied onto fresh objects.
 * @param {string | null | undefined} json
 * @returns {Task[]}
 */
export function deserialise(json) {
  if (typeof json !== 'string' || json.length === 0) return [];
  let data;
  try {
    data = JSON.parse(json);
  } catch {
    return [];
  }
  if (!data || data.version !== SCHEMA_VERSION || !Array.isArray(data.tasks)) return [];

  const seen = new Set();
  const out = [];
  for (const item of data.tasks) {
    if (!isValidTask(item) || seen.has(item.id)) continue;
    seen.add(item.id);
    out.push(
      Object.freeze({ id: item.id, title: item.title, done: item.done, createdAt: item.createdAt }),
    );
  }
  return out;
}

function isValidTask(item) {
  return (
    item !== null &&
    typeof item === 'object' &&
    typeof item.id === 'string' &&
    item.id.length > 0 &&
    item.id.length <= 64 &&
    typeof item.title === 'string' &&
    item.title.trim().length > 0 &&
    item.title.length <= MAX_TITLE_LENGTH &&
    typeof item.done === 'boolean' &&
    Number.isFinite(item.createdAt)
  );
}
