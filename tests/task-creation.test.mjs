import test, { beforeEach } from 'node:test';
import assert from 'node:assert/strict';

const storedValues = new Map();

globalThis.window = new EventTarget();
window.localStorage = {
  getItem(key) {
    return storedValues.has(key) ? storedValues.get(key) : null;
  },
  setItem(key, value) {
    storedValues.set(key, value);
  },
  removeItem(key) {
    storedValues.delete(key);
  }
};
globalThis.localStorage = window.localStorage;

await import('../src/dataStore.js');
const store = globalThis.DataStore;
const service = await import('../src/modules/taskService.js');

const projects = [{ id: 'project-1', name: 'TaskFlow' }];
const members = [{ id: 'member-1', name: 'Team Member' }];

function validInput(overrides = {}) {
  return {
    title: 'Create task form',
    description: 'Implement the Task Creation module.',
    projectId: 'project-1',
    assignedMemberId: 'member-1',
    dueDate: '2026-07-31',
    priority: 'High',
    status: 'Todo',
    ...overrides
  };
}

beforeEach(() => {
  storedValues.clear();
  storedValues.set(store.STORAGE_KEYS.PROJECTS, JSON.stringify(projects));
  storedValues.set(store.STORAGE_KEYS.MEMBERS, JSON.stringify(members));
});

test('creates and stores the canonical task object', () => {
  const result = service.createTask(validInput(), projects, members);

  assert.equal(result.isValid, true);
  assert.deepEqual(Object.keys(result.task), [
    'id', 'title', 'description', 'projectId', 'assignedMemberId',
    'dueDate', 'priority', 'status', 'createdAt'
  ]);
  assert.equal(result.task.projectId, 'project-1');
  assert.equal(result.task.assignedMemberId, 'member-1');
  assert.equal(store.getTasks().length, 1);

  const boardTask = store.getTaskById(result.task.id);
  assert.equal(boardTask.assignedUserId, 'member-1');
  assert.equal(Object.hasOwn(JSON.parse(storedValues.get(store.STORAGE_KEYS.TASKS))[0], 'assignedUserId'), false);
});

test('rejects invalid input without saving it', () => {
  const result = service.createTask(validInput({
    title: '',
    projectId: '',
    assignedMemberId: '',
    dueDate: 'invalid',
    priority: 'Urgent',
    status: 'Completed'
  }), projects, members);

  assert.equal(result.isValid, false);
  assert.equal(store.getTasks().length, 0);
  assert.ok(result.errors.title);
  assert.ok(result.errors.status);
});

test('updates only the supplied status for Kanban compatibility', () => {
  const created = service.createTask(validInput(), projects, members).task;
  const updated = store.updateTask(created.id, { status: 'In Progress' });

  assert.equal(updated.status, 'In Progress');
  assert.equal(updated.title, created.title);
  assert.equal(updated.projectId, created.projectId);
  assert.equal(updated.assignedMemberId, created.assignedMemberId);
});

test('rejects a status outside the four Kanban values', () => {
  const created = service.createTask(validInput(), projects, members).task;

  assert.throws(
    () => store.updateTask(created.id, { status: 'Completed' }),
    /Task status must be/
  );
  assert.equal(store.getTaskById(created.id).status, 'Todo');
});

test('rejects invalid status when adding directly through shared storage', () => {
  assert.throws(
    () => store.addTask({ id: 'invalid-task', status: 'Completed' }),
    /Task status must be/
  );
  assert.equal(store.getTasks().length, 0);
});

test('deletes a task and handles an unknown task ID', () => {
  const created = service.createTask(validInput(), projects, members).task;

  assert.equal(store.deleteTask(created.id), true);
  assert.equal(store.getTaskById(created.id), null);
  assert.equal(store.deleteTask('missing-task'), false);
});

test('handles missing, empty, and malformed LocalStorage values', () => {
  storedValues.delete(store.STORAGE_KEYS.TASKS);
  assert.deepEqual(store.getTasks(), []);

  storedValues.set(store.STORAGE_KEYS.TASKS, '[]');
  assert.deepEqual(store.getTasks(), []);

  storedValues.set(store.STORAGE_KEYS.TASKS, '{invalid json');
  assert.deepEqual(store.getTasks(), []);
});

test('emits change events after add, update, and delete', () => {
  const actions = [];
  const listener = (event) => actions.push(event.detail.action);
  window.addEventListener(store.TASKS_CHANGED_EVENT, listener);

  const created = service.createTask(validInput(), projects, members).task;
  store.updateTask(created.id, { status: 'Review' });
  store.deleteTask(created.id);
  window.removeEventListener(store.TASKS_CHANGED_EVENT, listener);

  assert.deepEqual(actions, ['added', 'updated', 'deleted']);
});

test('supports the complete Kanban movement workflow used by the Board', () => {
  const numericProjects = [{ id: 1, name: 'TaskFlow' }];
  const numericMembers = [{ id: 3, name: 'Team Member' }];
  const created = service.createTask(validInput({
    projectId: '1',
    assignedMemberId: '3'
  }), numericProjects, numericMembers).task;

  assert.equal(created.projectId, 1);
  assert.equal(created.assignedMemberId, 3);

  for (const status of ['In Progress', 'Review', 'Done']) {
    store.updateTask(created.id, { status });
    const boardTask = store.getTaskById(created.id);
    const assignedMember = numericMembers.find((member) => member.id === boardTask.assignedUserId);

    assert.equal(boardTask.status, status);
    assert.equal(assignedMember?.id, 3);
    assert.equal(boardTask.title, created.title);
  }

  const persistedTask = JSON.parse(storedValues.get(store.STORAGE_KEYS.TASKS))[0];
  assert.equal(persistedTask.status, 'Done');
  assert.equal(persistedTask.assignedMemberId, 3);
  assert.equal(Object.hasOwn(persistedTask, 'assignedUserId'), false);
});
