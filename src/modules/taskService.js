import { getTodayIso, validateTaskInput } from './taskValidation.js';

function createId() {
  if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID();
  return `task-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function getAssignedMemberIds(task) {
  if (Array.isArray(task?.assignedMemberIds)) return task.assignedMemberIds.filter((id) => id != null);
  const legacyId = task?.assignedMemberId ?? task?.assignedUserId;
  return legacyId == null ? [] : [legacyId];
}

export function normalizeTaskInput(input) {
  const assignedMemberIds = Array.isArray(input.assignedMemberIds)
    ? input.assignedMemberIds.map(String)
    : [];

  return {
    title: String(input.title || '').trim(),
    description: String(input.description || '').trim(),
    projectId: String(input.projectId || ''),
    memberCount: Number(input.memberCount),
    assignedMemberIds,
    startDate: String(input.startDate || ''),
    dueDate: String(input.dueDate || ''),
    priority: String(input.priority || ''),
    status: String(input.status || '')
  };
}

function resolveTaskValues(input, projects, members) {
  const project = projects.find((item) => String(item.id) === input.projectId);
  const assignedMemberIds = input.assignedMemberIds.map((id) => (
    members.find((item) => String(item.id) === id).id
  ));

  return {
    title: input.title,
    description: input.description,
    projectId: project.id,
    assignedMemberIds,
    startDate: input.startDate,
    dueDate: input.dueDate,
    priority: input.priority,
    status: input.status
  };
}

function prepareTask(input, projects, members, now) {
  const normalizedInput = normalizeTaskInput(input);
  const validation = validateTaskInput(normalizedInput, projects, members, getTodayIso(now));
  if (!validation.isValid) return { values: null, ...validation };
  return { values: resolveTaskValues(normalizedInput, projects, members), isValid: true, errors: {} };
}

export function createTask(input, projects, members, now = new Date()) {
  const prepared = prepareTask(input, projects, members, now);
  if (!prepared.isValid) return { task: null, ...prepared };
  const timestamp = now.toISOString();
  const task = {
    id: createId(),
    ...prepared.values,
    createdAt: timestamp,
    updatedAt: timestamp
  };

  const savedTask = globalThis.DataStore.addTask(task);
  if (globalThis.ActivityLog) {
    globalThis.ActivityLog.logTaskCreated(savedTask);
  }

  return { task: savedTask, isValid: true, errors: {} };
}

export function editTask(taskId, input, projects, members, now = new Date()) {
  const existingTask = globalThis.DataStore.getTaskById(taskId);
  if (!existingTask) return { task: null, isValid: false, errors: { form: 'Task not found.' } };
  const prepared = prepareTask(input, projects, members, now);
  if (!prepared.isValid) return { task: null, ...prepared };

  const changes = {
    ...prepared.values,
    createdAt: existingTask.createdAt || now.toISOString(),
    updatedAt: now.toISOString(),
    assignedMemberId: undefined,
    assignedUserId: undefined
  };
  const task = globalThis.DataStore.updateTask(taskId, changes);
  if (task && globalThis.ActivityLog) {
    globalThis.ActivityLog.logTaskUpdated(existingTask, task);
  }
  return { task, isValid: true, errors: {} };
}

export function normalizeTaskForEditing(task, today = getTodayIso()) {
  const assignedMemberIds = getAssignedMemberIds(task);
  return {
    title: task.title || '',
    description: task.description || '',
    projectId: task.projectId == null ? '' : String(task.projectId),
    memberCount: Math.max(1, assignedMemberIds.length),
    assignedMemberIds: assignedMemberIds.map(String),
    creationDate: task.createdAt?.slice(0, 10) || today,
    startDate: task.startDate || task.createdAt?.slice(0, 10) || today,
    dueDate: task.dueDate || '',
    priority: task.priority || '',
    status: task.status || ''
  };
}

export function deleteTask(taskId) {
  const existingTask = globalThis.DataStore.getTaskById(taskId);
  const deleted = globalThis.DataStore.deleteTask(taskId);
  if (deleted && existingTask && globalThis.ActivityLog) {
    globalThis.ActivityLog.logTaskDeleted(existingTask);
  }
  return deleted;
}
