export const TASK_STATUSES = Object.freeze(['Todo', 'In Progress', 'Review', 'Done']);
export const TASK_PRIORITIES = Object.freeze(['Low', 'Medium', 'High']);

export function getTodayIso(date = new Date()) {
  const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return localDate.toISOString().slice(0, 10);
}

function isRealIsoDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year
    && date.getUTCMonth() === month - 1
    && date.getUTCDate() === day;
}

export function validateTaskInput(input, availableProjects, availableMembers, today = getTodayIso()) {
  const errors = {};
  const projectIds = new Set(availableProjects.map((project) => String(project.id)));
  const memberIds = new Set(availableMembers.map((member) => String(member.id)));
  const selectedMemberIds = Array.isArray(input.assignedMemberIds)
    ? input.assignedMemberIds.filter(Boolean)
    : [];
  const memberCount = Number(input.memberCount);

  if (!input.title) errors.title = 'Task title is required.';
  if (!input.projectId) errors.projectId = 'Select a project.';
  else if (!projectIds.has(input.projectId)) errors.projectId = 'Select a valid project.';

  if (!Number.isInteger(memberCount) || memberCount < 1) {
    errors.memberCount = 'Assign at least one member.';
  } else if (memberCount > availableMembers.length) {
    errors.memberCount = `Member count cannot exceed ${availableMembers.length}.`;
  }

  if (availableMembers.length === 0) {
    errors.assignedMemberIds = 'No team members are available.';
  } else if (selectedMemberIds.length === 0) {
    errors.assignedMemberIds = 'Select at least one assigned member.';
  } else if (selectedMemberIds.length !== memberCount) {
    errors.assignedMemberIds = 'Select a member in every assignment field.';
  } else if (selectedMemberIds.some((id) => !memberIds.has(String(id)))) {
    errors.assignedMemberIds = 'Select only available team members.';
  } else if (new Set(selectedMemberIds.map(String)).size !== selectedMemberIds.length) {
    errors.assignedMemberIds = 'The same member cannot be assigned more than once.';
  }

  if (!input.startDate) errors.startDate = 'Start date is required.';
  else if (!isRealIsoDate(input.startDate)) errors.startDate = 'Enter a valid start date.';

  if (!input.dueDate) errors.dueDate = 'Due date is required.';
  else if (!isRealIsoDate(input.dueDate)) errors.dueDate = 'Enter a valid due date.';
  else if (input.dueDate < today) errors.dueDate = 'Due date cannot be before today.';
  else if (isRealIsoDate(input.startDate) && input.dueDate < input.startDate) {
    errors.dueDate = 'Due date cannot be before the start date.';
  }

  if (!input.priority) errors.priority = 'Select a priority.';
  else if (!TASK_PRIORITIES.includes(input.priority)) errors.priority = 'Select a valid priority.';
  if (!input.status) errors.status = 'Select a status.';
  else if (!TASK_STATUSES.includes(input.status)) errors.status = 'Select a valid status.';

  return { isValid: Object.keys(errors).length === 0, errors };
}
