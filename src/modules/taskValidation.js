import { TASK_STATUSES } from '../dataStore.js';

export { TASK_STATUSES };
export const TASK_PRIORITIES = Object.freeze(['Low', 'Medium', 'High']);

function isRealIsoDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year
    && date.getUTCMonth() === month - 1
    && date.getUTCDate() === day;
}

export function validateTaskInput(input, availableProjects, availableMembers) {
  const errors = {};
  const projectIds = new Set(availableProjects.map((project) => String(project.id)));
  const memberIds = new Set(availableMembers.map((member) => String(member.id)));

  if (!input.title) errors.title = 'Task title is required.';
  if (!input.projectId) errors.projectId = 'Select a project.';
  else if (!projectIds.has(input.projectId)) errors.projectId = 'Select a valid project.';
  if (!input.assignedMemberId) errors.assignedMemberId = 'Select an assigned member.';
  else if (!memberIds.has(input.assignedMemberId)) errors.assignedMemberId = 'Select a valid member.';
  if (!input.dueDate) errors.dueDate = 'Due date is required.';
  else if (!isRealIsoDate(input.dueDate)) errors.dueDate = 'Enter a valid due date.';
  if (!input.priority) errors.priority = 'Select a priority.';
  else if (!TASK_PRIORITIES.includes(input.priority)) errors.priority = 'Select a valid priority.';
  if (!input.status) errors.status = 'Select a status.';
  else if (!TASK_STATUSES.includes(input.status)) errors.status = 'Select a valid status.';

  return { isValid: Object.keys(errors).length === 0, errors };
}
