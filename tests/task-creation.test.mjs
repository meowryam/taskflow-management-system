import test, { beforeEach } from 'node:test';
import assert from 'node:assert/strict';

const storedValues = new Map();
globalThis.window = new EventTarget();
window.localStorage = {
  getItem: (key) => storedValues.has(key) ? storedValues.get(key) : null,
  setItem: (key, value) => storedValues.set(key, value),
  removeItem: (key) => storedValues.delete(key)
};
globalThis.localStorage = window.localStorage;

await import('../src/dataStore.js');
const store = globalThis.DataStore;
const service = await import('../src/modules/taskService.js');
const validation = await import('../src/modules/taskValidation.js');

const now = new Date('2030-01-10T12:00:00.000Z');
const projects = [{ id: 1, name: 'TaskFlow', startDate: '2030-01-08' }];
const members = [
  { id: 1, name: 'Member One' },
  { id: 2, name: 'Member Two' },
  { id: 3, name: 'Member Three' }
];

function validInput(overrides = {}) {
  return {
    title: 'Create task form',
    description: 'Implement the Task Creation module.',
    projectId: '1',
    memberCount: 2,
    assignedMemberIds: ['1', '2'],
    startDate: '2030-01-10',
    dueDate: '2030-01-15',
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

test('creates the new canonical task model with multiple member IDs and timestamps', () => {
  const result = service.createTask(validInput({ creationDate: '1999-01-01' }), projects, members, now);

  assert.equal(result.isValid, true);
  assert.deepEqual(Object.keys(result.task), [
    'id', 'title', 'description', 'projectId', 'assignedMemberIds',
    'startDate', 'dueDate', 'priority', 'status', 'createdAt', 'updatedAt'
  ]);
  assert.deepEqual(result.task.assignedMemberIds, [1, 2]);
  assert.equal(result.task.startDate, '2030-01-10');
  assert.equal(result.task.createdAt, now.toISOString());
  assert.equal(result.task.updatedAt, now.toISOString());
  assert.equal(store.getTasks().length, 1);
});

test('enforces required fields, valid references, and allowed enum values', () => {
  const result = service.createTask(validInput({
    title: '', projectId: '', memberCount: 0, assignedMemberIds: [],
    priority: 'Urgent', status: 'Completed'
  }), projects, members, now);

  assert.equal(result.isValid, false);
  assert.ok(result.errors.title);
  assert.ok(result.errors.projectId);
  assert.ok(result.errors.memberCount);
  assert.ok(result.errors.assignedMemberIds);
  assert.ok(result.errors.priority);
  assert.ok(result.errors.status);
  assert.equal(store.getTasks().length, 0);
});

test('enforces member count, available-member limit, complete selection, and uniqueness', () => {
  const tooMany = validation.validateTaskInput(
    service.normalizeTaskInput(validInput({ memberCount: 4, assignedMemberIds: ['1', '2', '3', '4'] })),
    projects, members, '2030-01-10'
  );
  const duplicate = validation.validateTaskInput(
    service.normalizeTaskInput(validInput({ assignedMemberIds: ['1', '1'] })),
    projects, members, '2030-01-10'
  );
  const incomplete = validation.validateTaskInput(
    service.normalizeTaskInput(validInput({ assignedMemberIds: ['1', ''] })),
    projects, members, '2030-01-10'
  );

  assert.match(tooMany.errors.memberCount, /cannot exceed 3/);
  assert.match(duplicate.errors.assignedMemberIds, /cannot be assigned more than once/);
  assert.match(incomplete.errors.assignedMemberIds, /every assignment field/);
});

test('accepts a user-selected start date and rejects invalid date ranges', () => {
  const selectedStart = service.createTask(validInput({ startDate: '2030-01-12' }), projects, members, now);
  store.saveTasks([]);
  const pastDue = service.createTask(validInput({ dueDate: '2030-01-09' }), projects, members, now);
  const reversed = service.createTask(validInput({ startDate: '2030-01-15', dueDate: '2030-01-14' }), projects, members, now);

  assert.equal(selectedStart.task.startDate, '2030-01-12');
  assert.match(pastDue.errors.dueDate, /before today/);
  assert.equal(reversed.isValid, false);
  assert.match(reversed.errors.dueDate, /before the start date/);
  assert.equal(store.getTasks().length, 0);
});

test('rejects a task start date before the selected project start date', () => {
  const result = service.createTask(validInput({ startDate: '2030-01-07' }), projects, members, now);

  assert.equal(result.isValid, false);
  assert.match(result.errors.startDate, /before the project start date/);
  assert.equal(store.getTasks().length, 0);
});

test('edits a task with the same validation while preserving createdAt', () => {
  const created = service.createTask(validInput(), projects, members, now).task;
  const editedAt = new Date('2030-01-11T15:30:00.000Z');
  const result = service.editTask(created.id, validInput({
    title: 'Updated task',
    memberCount: 3,
    assignedMemberIds: ['1', '2', '3'],
    creationDate: '1999-01-01',
    startDate: '2030-01-11',
    status: 'Review'
  }), projects, members, editedAt);

  assert.equal(result.isValid, true);
  assert.equal(result.task.title, 'Updated task');
  assert.deepEqual(result.task.assignedMemberIds, [1, 2, 3]);
  assert.equal(result.task.createdAt, created.createdAt);
  assert.equal(result.task.updatedAt, editedAt.toISOString());
  assert.equal(store.getTasks().length, 1);
});

test('normalizes legacy single-member tasks for editing and removes legacy fields on save', () => {
  const legacyTask = {
    id: 9, title: 'Legacy', description: '', projectId: 1, assignedUserId: 2,
    dueDate: '2030-01-20', priority: 'Medium', status: 'Todo',
    createdAt: '2029-12-01T00:00:00.000Z'
  };
  store.saveTasks([legacyTask]);
  const editingInput = service.normalizeTaskForEditing(store.getTaskById(9), '2030-01-10');

  assert.deepEqual(editingInput.assignedMemberIds, ['2']);
  assert.equal(editingInput.startDate, '2029-12-01');
  assert.equal(editingInput.creationDate, '2029-12-01');

  editingInput.startDate = '2030-01-08';
  const result = service.editTask(9, editingInput, projects, members, now);
  const persisted = JSON.parse(storedValues.get(store.STORAGE_KEYS.TASKS))[0];
  assert.equal(result.isValid, true);
  assert.deepEqual(persisted.assignedMemberIds, [2]);
  assert.equal(Object.hasOwn(persisted, 'assignedUserId'), false);
  assert.equal(Object.hasOwn(persisted, 'assignedMemberId'), false);
});

test('deletes tasks persistently, including the last task', () => {
  const created = service.createTask(validInput(), projects, members, now).task;
  assert.equal(service.deleteTask(created.id), true);
  assert.deepEqual(store.getTasks(), []);
  assert.deepEqual(JSON.parse(storedValues.get(store.STORAGE_KEYS.TASKS)), []);
  assert.equal(service.deleteTask('missing'), false);
});

test('supports missing, empty, and malformed LocalStorage collections', () => {
  storedValues.delete(store.STORAGE_KEYS.TASKS);
  assert.deepEqual(store.getTasks(), []);
  storedValues.set(store.STORAGE_KEYS.TASKS, '[]');
  assert.deepEqual(store.getTasks(), []);
  storedValues.set(store.STORAGE_KEYS.TASKS, '{invalid json');
  assert.deepEqual(store.getTasks(), []);
});

test('emits add, update, and delete events', () => {
  const actions = [];
  const listener = (event) => actions.push(event.detail.action);
  window.addEventListener(store.TASKS_CHANGED_EVENT, listener);
  const created = service.createTask(validInput(), projects, members, now).task;
  service.editTask(created.id, validInput({ status: 'In Progress' }), projects, members, now);
  service.deleteTask(created.id);
  window.removeEventListener(store.TASKS_CHANGED_EVENT, listener);
  assert.deepEqual(actions, ['added', 'updated', 'deleted']);
});

test('keeps the current Board compatible without persisting a duplicate assignment field', () => {
  const created = service.createTask(validInput(), projects, members, now).task;
  const boardTask = store.getTaskById(created.id);
  assert.equal(boardTask.assignedUserId, 1);
  store.updateTask(created.id, { status: 'Done' });
  const persisted = JSON.parse(storedValues.get(store.STORAGE_KEYS.TASKS))[0];
  assert.equal(persisted.status, 'Done');
  assert.deepEqual(persisted.assignedMemberIds, [1, 2]);
  assert.equal(Object.hasOwn(persisted, 'assignedUserId'), false);
});
