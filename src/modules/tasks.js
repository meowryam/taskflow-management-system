import {
  createTask,
  deleteTask,
  editTask,
  getAssignedMemberIds,
  normalizeTaskForEditing
} from './taskService.js';
import { getTodayIso } from './taskValidation.js';

const form = document.getElementById('taskForm');
const taskSection = document.getElementById('task-creation-section');
const availabilityMessage = document.getElementById('taskAvailabilityMessage');
const formMessage = document.getElementById('taskFormMessage');
const submitButton = document.getElementById('createTaskButton');
const cancelEditButton = document.getElementById('cancelTaskEditButton');
const editIndicator = document.getElementById('taskEditIndicator');
const projectSelect = document.getElementById('taskProject');
const memberCountInput = document.getElementById('taskMemberCount');
const memberSelections = document.getElementById('taskMemberSelections');
const startDateInput = document.getElementById('taskStartDate');
const dueDateInput = document.getElementById('taskDueDate');
const testingList = document.getElementById('taskTestingList');
const taskNavigation = document.getElementById('nav-tasks');

let projects = [];
let members = [];
let editingTaskId = null;
let isSubmitting = false;
let ignoreNextReset = false;

function normalizeReference(item, type) {
  const rawId = item.id ?? item[`${type}Id`] ?? item[`${type === 'member' ? 'user' : type}Id`];
  const label = type === 'project'
    ? (item.name ?? item.projectName ?? item.title)
    : (item.name ?? item.fullName ?? item.memberName);
  return rawId == null ? null : { id: rawId, label: label || `Unnamed ${type}` };
}

function populateSelect(select, items, placeholder) {
  select.replaceChildren(new Option(placeholder, ''));
  items.forEach((item) => select.add(new Option(item.label, item.id)));
}

function getCurrentMemberSelections() {
  return Array.from(memberSelections.querySelectorAll('select')).map((select) => select.value);
}

function renderMemberSelections(count, selectedIds = getCurrentMemberSelections()) {
  memberSelections.replaceChildren();
  if (members.length === 0) {
    memberCountInput.value = '';
    return;
  }
  const safeCount = Math.min(Math.max(Number(count) || 1, 1), Math.max(members.length, 1));
  memberCountInput.value = String(safeCount);

  for (let index = 0; index < safeCount; index += 1) {
    const wrapper = document.createElement('div');
    wrapper.className = 'task-form__member-field';
    const label = document.createElement('label');
    const select = document.createElement('select');
    select.id = `taskAssignedMember${index + 1}`;
    select.name = 'assignedMemberIds';
    label.htmlFor = select.id;
    label.textContent = `Member ${index + 1}`;
    populateSelect(select, members, 'Select a member');
    select.value = selectedIds[index] == null ? '' : String(selectedIds[index]);
    wrapper.append(label, select);
    memberSelections.append(wrapper);
  }
}

function applyDateConstraints() {
  const today = getTodayIso();
  startDateInput.min = today;
  dueDateInput.min = startDateInput.value && startDateInput.value > today
    ? startDateInput.value
    : today;
}

function loadDependencies() {
  projects = globalThis.DataStore.getProjects().map((item) => normalizeReference(item, 'project')).filter(Boolean);
  const allMembers = globalThis.DataStore.getMembers().map((item) => normalizeReference(item, 'member')).filter(Boolean);
  const session = window.TaskFlowSession;

  members = session?.role === 'Team Member'
    ? allMembers.filter((member) => (
      String(member.id) === String(session.memberId || session.email)
      || member.label.toLowerCase() === String(session.email).toLowerCase()
    ))
    : allMembers;

  const selectedProject = projectSelect.value;
  const selectedMembers = getCurrentMemberSelections();
  populateSelect(projectSelect, projects, 'Select a project');
  projectSelect.value = selectedProject;
  memberCountInput.max = String(members.length);
  memberCountInput.disabled = members.length === 0;
  renderMemberSelections(Math.min(Number(memberCountInput.value) || 1, Math.max(members.length, 1)), selectedMembers);

  const missing = [];
  if (projects.length === 0) missing.push('projects');
  if (members.length === 0) missing.push('members');
  submitButton.disabled = missing.length > 0;
  availabilityMessage.textContent = missing.length
    ? `Task creation is unavailable until ${missing.join(' and ')} exist.`
    : '';
  applyDateConstraints();
  renderTaskList();
}

function readForm() {
  return {
    title: form.elements.title.value,
    description: form.elements.description.value,
    projectId: form.elements.projectId.value,
    memberCount: memberCountInput.value,
    assignedMemberIds: getCurrentMemberSelections(),
    startDate: startDateInput.value,
    dueDate: dueDateInput.value,
    priority: form.elements.priority.value,
    status: form.elements.status.value
  };
}

function clearErrors() {
  form.querySelectorAll('.task-form__error').forEach((element) => { element.textContent = ''; });
  form.querySelectorAll('[aria-invalid="true"]').forEach((element) => element.removeAttribute('aria-invalid'));
}

function renderErrors(errors) {
  clearErrors();
  Object.entries(errors).forEach(([fieldName, message]) => {
    const error = document.getElementById(`${fieldName}Error`);
    let field = form.elements[fieldName];
    if (fieldName === 'assignedMemberIds') {
      field = memberSelections.querySelector('select');
      memberSelections.querySelectorAll('select').forEach((select) => select.setAttribute('aria-invalid', 'true'));
    }
    if (field?.setAttribute) field.setAttribute('aria-invalid', 'true');
    if (error) error.textContent = message;
  });
  form.querySelector('[aria-invalid="true"]')?.focus();
}

function showMessage(message, type = '') {
  formMessage.textContent = message;
  formMessage.className = type ? `task-form__message task-form__message--${type}` : 'task-form__message';
}

function setEditMode(taskId = null) {
  editingTaskId = taskId;
  const editing = taskId !== null;
  document.getElementById('taskCreationTitle').textContent = editing ? 'Edit task' : 'Create a task';
  submitButton.textContent = editing ? 'Save Changes' : 'Create Task';
  cancelEditButton.hidden = !editing;
  editIndicator.hidden = !editing;
}

function resetForm(options = {}) {
  ignoreNextReset = true;
  form.reset();
  setEditMode();
  clearErrors();
  memberCountInput.value = members.length ? '1' : '';
  renderMemberSelections(1, []);
  applyDateConstraints();
  showMessage(options.message || '', options.type || '');
}

function handleSubmit(event) {
  event.preventDefault();
  if (isSubmitting || submitButton.disabled) return;
  isSubmitting = true;
  submitButton.disabled = true;
  clearErrors();

  try {
    const wasEditing = editingTaskId !== null;
    const result = editingTaskId === null
      ? createTask(readForm(), projects, members)
      : editTask(editingTaskId, readForm(), projects, members);
    if (!result.isValid) {
      renderErrors(result.errors);
      showMessage(result.errors.form || 'Please correct the highlighted fields.', 'error');
      return;
    }

    resetForm({
      message: wasEditing ? 'Task updated successfully.' : 'Task created successfully.',
      type: 'success'
    });
    renderTaskList();
  } catch (error) {
    console.error('Task save failed.', error);
    showMessage('The task could not be saved. Check browser storage and try again.', 'error');
  } finally {
    isSubmitting = false;
    submitButton.disabled = projects.length === 0 || members.length === 0;
  }
}

function beginEditing(taskId) {
  const task = globalThis.DataStore.getTaskById(taskId);
  if (!task) {
    showMessage('Task not found.', 'error');
    return;
  }
  const input = normalizeTaskForEditing(task);
  setEditMode(task.id);
  form.elements.title.value = input.title;
  form.elements.description.value = input.description;
  projectSelect.value = input.projectId;
  memberCountInput.value = String(Math.min(input.memberCount, Math.max(members.length, 1)));
  renderMemberSelections(memberCountInput.value, input.assignedMemberIds);
  startDateInput.value = input.startDate;
  dueDateInput.value = input.dueDate;
  form.elements.priority.value = input.priority;
  form.elements.status.value = input.status;
  clearErrors();
  showMessage('Update the task and select Save Changes.');
  applyDateConstraints();
  form.elements.title.focus();
}

function handleDelete(taskId) {
  const task = globalThis.DataStore.getTaskById(taskId);
  if (!task || !window.confirm(`Delete task "${task.title}"? This cannot be undone.`)) return;
  if (!deleteTask(taskId)) {
    showMessage('Task could not be deleted.', 'error');
    return;
  }
  if (String(editingTaskId) === String(taskId)) resetForm();
  showMessage('Task deleted successfully.', 'success');
  renderTaskList();
}

function createTaskListItem(task) {
  const item = document.createElement('article');
  item.className = 'task-testing-panel__item';
  const content = document.createElement('div');
  const title = document.createElement('h4');
  const details = document.createElement('p');
  const assignedNames = getAssignedMemberIds(task).map((id) => (
    members.find((member) => String(member.id) === String(id))?.label || 'Unavailable member'
  ));
  title.textContent = task.title || 'Untitled task';
  details.textContent = `${task.status} · ${task.startDate || 'No start date'} to ${task.dueDate || 'No due date'} · ${assignedNames.join(', ') || 'Unassigned'}`;
  content.append(title, details);

  const actions = document.createElement('div');
  actions.className = 'task-testing-panel__actions';
  const editButton = document.createElement('button');
  const deleteButton = document.createElement('button');
  editButton.type = deleteButton.type = 'button';
  editButton.className = 'task-form__button task-form__button--secondary';
  deleteButton.className = 'task-form__button task-form__button--danger';
  editButton.textContent = 'Edit';
  deleteButton.textContent = 'Delete';
  editButton.addEventListener('click', () => beginEditing(task.id));
  deleteButton.addEventListener('click', () => handleDelete(task.id));
  actions.append(editButton, deleteButton);
  item.append(content, actions);
  return item;
}

function renderTaskList() {
  if (!testingList) return;
  testingList.replaceChildren();
  const tasks = globalThis.DataStore.getTasks();
  if (tasks.length === 0) {
    const empty = document.createElement('p');
    empty.className = 'task-testing-panel__empty';
    empty.textContent = 'No tasks have been created.';
    testingList.append(empty);
    return;
  }
  tasks.forEach((task) => testingList.append(createTaskListItem(task)));
}

function showTaskCreation(event) {
  event?.preventDefault();
  document.querySelectorAll('.main-content > section').forEach((section) => {
    section.style.display = section === taskSection ? '' : 'none';
  });
  document.querySelector('.header__title').textContent = editingTaskId === null ? 'Create Task' : 'Edit Task';
  document.querySelectorAll('.sidebar__item').forEach((item) => item.classList.remove('sidebar__item--active'));
  taskNavigation?.classList.add('sidebar__item--active');
  document.getElementById('sidebar')?.classList.remove('sidebar--open');
  loadDependencies();
}

if (form) {
  form.addEventListener('submit', handleSubmit);
  form.addEventListener('reset', () => {
    if (ignoreNextReset) {
      ignoreNextReset = false;
      return;
    }
    window.setTimeout(() => resetForm(), 0);
  });
  memberCountInput.addEventListener('input', () => {
    const requestedCount = Number(memberCountInput.value);
    if (Number.isInteger(requestedCount) && requestedCount >= 1 && requestedCount <= members.length) {
      renderMemberSelections(requestedCount);
    }
  });
  memberSelections.addEventListener('change', () => {
    document.getElementById('assignedMemberIdsError').textContent = '';
    memberSelections.querySelectorAll('select').forEach((select) => select.removeAttribute('aria-invalid'));
  });
  startDateInput.addEventListener('change', applyDateConstraints);
  cancelEditButton.addEventListener('click', () => resetForm({ message: 'Editing cancelled.' }));
  window.showCreateTaskForm = showTaskCreation;
  window.addEventListener('taskflow:projects-changed', loadDependencies);
  window.addEventListener('taskflow:members-changed', loadDependencies);
  window.addEventListener(globalThis.DataStore.TASKS_CHANGED_EVENT, renderTaskList);
  loadDependencies();
  window.loadTaskCreationDeps = loadDependencies;
}
