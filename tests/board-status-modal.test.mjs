import assert from 'node:assert';
import test from 'node:test';
import fs from 'node:fs';
import path from 'node:path';

// Mock localStorage and window DOM environment for testing KanbanBoard logic
class LocalStorageMock {
  constructor() { this.store = {}; }
  getItem(key) { return this.store[key] || null; }
  setItem(key, value) { this.store[key] = String(value); }
  removeItem(key) { delete this.store[key]; }
  clear() { this.store = {}; }
}

globalThis.localStorage = new LocalStorageMock();
globalThis.window = {
  dispatchEvent: () => {},
  addEventListener: () => {},
  removeEventListener: () => {},
  TaskFlowSession: { memberId: 5, name: 'Bilal Intern' }
};
globalThis.document = {
  readyState: 'complete',
  getElementById: () => null,
  querySelector: () => null,
  querySelectorAll: () => [],
  head: { appendChild: () => {} },
  createElement: (tag) => {
    const el = {
      tagName: tag.toUpperCase(),
      className: '',
      style: {},
      attributes: {},
      children: [],
      classList: {
        add: (cls) => {},
        remove: (cls) => {}
      },
      setAttribute: (k, v) => { el.attributes[k] = v; },
      getAttribute: (k) => el.attributes[k],
      removeAttribute: (k) => { delete el.attributes[k]; },
      appendChild: (child) => { el.children.push(child); },
      append: (...children) => { el.children.push(...children); },
      addEventListener: () => {},
      focus: () => {}
    };
    return el;
  },
  body: {
    appendChild: () => {},
    remove: () => {}
  },
  addEventListener: () => {},
  removeEventListener: () => {}
};

// Read dataStore.js and activityLog.js
const dataStoreCode = fs.readFileSync(path.resolve('src/dataStore.js'), 'utf8');
const activityLogCode = fs.readFileSync(path.resolve('src/modules/activityLog.js'), 'utf8');
const boardCode = fs.readFileSync(path.resolve('src/modules/board.js'), 'utf8');

eval(dataStoreCode);
eval(activityLogCode);
eval(boardCode);

test('KanbanBoard intercepts status change and requires non-empty comment', () => {
  const board = window.KanbanBoardModule;
  const initialTasks = globalThis.DataStore.getTasks();
  const targetTask = initialTasks[0];
  const oldStatus = targetTask.status; // 'In Progress'
  const newStatus = 'Done';

  // 1. Request status change
  board.requestStatusChange(targetTask.id, newStatus);
  assert.notStrictEqual(board.pendingStatusChange, null);
  assert.strictEqual(board.pendingStatusChange.task.id, targetTask.id);
  assert.strictEqual(board.pendingStatusChange.oldStatus, oldStatus);
  assert.strictEqual(board.pendingStatusChange.newStatus, newStatus);

  // 2. Validate empty comment fails
  let modalTextarea = { value: '   ', classList: { add: () => {} }, focus: () => {} };
  let errorDiv = { textContent: '', style: {} };
  globalThis.document.getElementById = (id) => {
    if (id === 'status-change-comment') return modalTextarea;
    if (id === 'status-change-error') return errorDiv;
    return null;
  };

  board.confirmStatusChange();
  // Status should NOT change yet
  let currentTask = globalThis.DataStore.getTaskById(targetTask.id);
  assert.strictEqual(currentTask.status, oldStatus);
  assert.strictEqual(errorDiv.style.display, 'flex');

  // 3. Confirm with valid comment
  modalTextarea.value = 'Fix completed and verified by manual testing.';
  board.confirmStatusChange();

  // 4. Verify Task status and history updated in DataStore
  currentTask = globalThis.DataStore.getTaskById(targetTask.id);
  assert.strictEqual(currentTask.status, newStatus);
  assert.strictEqual(Array.isArray(currentTask.history), true);
  assert.strictEqual(currentTask.history.length, 1);
  assert.strictEqual(currentTask.history[0].comment, 'Fix completed and verified by manual testing.');
  assert.strictEqual(currentTask.history[0].user, 'Bilal Intern');

  // 6. Verify Toast Notification message format
  let toastContainer = null;
  let createdElements = [];
  globalThis.document.createElement = (tag) => {
    const el = {
      tagName: tag.toUpperCase(),
      className: '',
      textContent: '',
      children: [],
      classList: { add: () => {}, remove: () => {} },
      setAttribute: (k, v) => {},
      appendChild: (child) => { el.children.push(child); },
      addEventListener: () => {}
    };
    createdElements.push(el);
    return el;
  };

  const testTitle = 'Test Notification Task';
  board.showToast(`Task "${testTitle}" moved from Todo to Review successfully.`);
  assert.strictEqual(createdElements.length >= 3, true);
  const contentEl = createdElements.find((e) => e.className === 'kanban-toast__content');
  assert.notStrictEqual(contentEl, undefined);
  assert.strictEqual(contentEl.textContent, `Task "${testTitle}" moved from Todo to Review successfully.`);

  console.log('✓ All Kanban Board status confirmation, comment validation, and toast notification tests passed!');
});
