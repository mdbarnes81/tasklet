// A deliberately small DOM fixture for exercising main.js without browser dependencies.
class Element {
  constructor(tagName, document) {
    this.tagName = tagName.toUpperCase();
    this.ownerDocument = document;
    this.children = [];
    this.parentNode = null;
    this.attributes = new Map();
    this.listeners = new Map();
    this.dataset = {};
    this.hidden = false;
    this.disabled = false;
    this.value = '';
    this.checked = false;
    this._text = '';
  }

  set id(value) { this.setAttribute('id', value); }
  get id() { return this.getAttribute('id') ?? ''; }
  set className(value) { this.setAttribute('class', value); }
  get className() { return this.getAttribute('class') ?? ''; }
  set htmlFor(value) { this.setAttribute('for', value); }
  get htmlFor() { return this.getAttribute('for') ?? ''; }
  set type(value) { this.setAttribute('type', value); }
  get type() { return this.getAttribute('type') ?? ''; }
  set textContent(value) {
    this.children.forEach((child) => { child.parentNode = null; });
    this.children = [];
    this._text = String(value);
  }
  get textContent() { return this._text + this.children.map((child) => child.textContent).join(''); }

  setAttribute(name, value) {
    this.attributes.set(name, String(value));
    if (name.startsWith('data-')) this.dataset[name.slice(5)] = String(value);
  }
  getAttribute(name) { return this.attributes.get(name) ?? null; }
  hasAttribute(name) { return this.attributes.has(name); }
  removeAttribute(name) { this.attributes.delete(name); }
  append(...children) {
    for (const child of children) {
      child.parentNode = this;
      this.children.push(child);
    }
  }
  appendChild(child) { this.append(child); return child; }
  replaceChildren(...children) { this.textContent = ''; this.append(...children); }
  focus() { this.ownerDocument.activeElement = this; }
  addEventListener(type, listener) {
    if (!this.listeners.has(type)) this.listeners.set(type, []);
    this.listeners.get(type).push(listener);
  }
  dispatchEvent(event) {
    event.target = this;
    for (let node = this; node; node = node.parentNode) {
      event.currentTarget = node;
      for (const listener of node.listeners.get(event.type) ?? []) listener(event);
      if (event.stopped || !event.bubbles) break;
    }
    return !event.defaultPrevented;
  }
  click(detail = 0) {
    if (this.disabled) return;
    const allowed = this.dispatchEvent(makeEvent('click', { detail }));
    if (allowed && this.tagName === 'LABEL' && this.htmlFor) {
      const control = this.ownerDocument.getElementById(this.htmlFor);
      if (control?.type === 'checkbox') {
        control.checked = !control.checked;
        control.dispatchEvent(makeEvent('change'));
      }
    }
  }
}

export function makeEvent(type, properties = {}) {
  return {
    type,
    bubbles: true,
    defaultPrevented: false,
    stopped: false,
    preventDefault() { this.defaultPrevented = true; },
    stopPropagation() { this.stopped = true; },
    ...properties,
  };
}

export function descendants(root) {
  return [root, ...root.children.flatMap(descendants)];
}

export function createDocument() {
  const document = {
    activeElement: null,
    createElement(tagName) { return new Element(tagName, this); },
    getElementById(id) { return descendants(this.body).find((el) => el.id === id) ?? null; },
    querySelectorAll(selector) {
      if (selector === '[data-filter]') {
        return descendants(this.body).filter((el) => el.hasAttribute('data-filter'));
      }
      throw new Error(`Unsupported fixture selector: ${selector}`);
    },
  };
  document.body = document.createElement('body');
  for (const [tag, id] of [
    ['form', 'new-task-form'],
    ['input', 'new-task-title'],
    ['p', 'form-error'],
    ['ul', 'task-list'],
    ['p', 'status'],
    ['button', 'clear-done'],
  ]) {
    const el = document.createElement(tag);
    el.id = id;
    if (id === 'form-error') {
      el.hidden = true;
      el.setAttribute('role', 'alert');
    }
    document.body.append(el);
  }
  for (const filter of ['all', 'active', 'done']) {
    const button = document.createElement('button');
    button.setAttribute('data-filter', filter);
    document.body.append(button);
  }
  return document;
}
