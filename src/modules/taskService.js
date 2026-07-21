import { addTask } from '../dataStore.js';
import { validateTaskInput } from './taskValidation.js';

function createId() {
  if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID();
  return `task-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function normalizeTaskInput(input) {
  return {
    title: input.title.trim(),
    description: input.description.trim(),
    projectId: String(input.projectId),
    assignedMemberId: String(input.assignedMemberId),
    dueDate: input.dueDate,
    priority: input.priority,
    status: input.status
  };
}

export function createTask(input, projects, members) {
  const normalizedInput = normalizeTaskInput(input);
  const validation = validateTaskInput(normalizedInput, projects, members);
  if (!validation.isValid) return { task: null, ...validation };

  const task = {
    id: createId(),
    ...normalizedInput,
    createdAt: new Date().toISOString()
  };

  return { task: addTask(task), isValid: true, errors: {} };
}
