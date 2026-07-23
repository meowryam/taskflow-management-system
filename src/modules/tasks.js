import {
  createTask,
  deleteTask,
  editTask,
  normalizeTaskForEditing
} from './taskService.js';
import { getTodayIso } from './taskValidation.js';

const form = document.getElementById('taskForm');
const taskSection = document.getElementById('task-creation-section');
const availabilityMessage = document.getElementById('taskAvailabilityMessage');
const formMessage = document.getElementById('taskFormMessage');
const submitButton = document.getElementById('createTaskButton');
const resetButton = document.getElementById('resetTaskButton');
const cancelCreationButton = document.getElementById('cancelTaskCreationButton');
const cancelEditButton = document.getElementById('cancelTaskEditButton');
const editIndicator = document.getElementById('taskEditIndicator');
const projectSelect = document.getElementById('taskProject');
const memberCountInput = document.getElementById('taskMemberCount');
const memberSelections = document.getElementById('taskMemberSelections');
const startDateInput = document.getElementById('taskStartDate');
const dueDateInput = document.getElementById('taskDueDate');
const taskCardGrid = document.getElementById('taskCardGrid');
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
  return rawId == null ? null : {
    id: rawId,
    label: label || `Unnamed ${type}`,
    role: item.role ?? item.roleName ?? ''
  };
}

function populateSelect(select, items, placeholder) {
  select.replaceChildren(new Option(placeholder, ''));
  items.forEach((item) => select.add(new Option(item.label, item.id)));
}

function getCurrentMemberSelections() {
  return Array.from(memberSelections.querySelectorAll('select')).map((select) => select.value);
}

function updateMemberOptionAvailability() {
  const selects = Array.from(memberSelections.querySelectorAll('select'));
  const selectedIds = selects.map((select) => select.value).filter(Boolean);
  selects.forEach((select) => {
    Array.from(select.options).forEach((option) => {
      option.disabled = Boolean(option.value)
        && option.value !== select.value
        && selectedIds.includes(option.value);
    });
  });
}

function renderMemberSelections(count, selectedIds = getCurrentMemberSelections()) {
  memberSelections.replaceChildren();
  if (members.length === 0) {
    memberCountInput.value = '';
    return;
  }
  const safeCount = Math.min(Math.max(Number(count) || 1, 1), members.length);
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
  updateMemberOptionAvailability();
}

function applyDateConstraints() {
  const today = getTodayIso();
  startDateInput.value = editingTaskId === null ? today : startDateInput.value;
  dueDateInput.min = startDateInput.value > today ? startDateInput.value : today;
}

function loadDependencies() {
  projects = globalThis.DataStore.getProjects().map((item) => normalizeReference(item, 'project')).filter(Boolean);
  members = globalThis.DataStore.getMembers()
    .map((item) => normalizeReference(item, 'member'))
    .filter(Boolean);

  const selectedProject = projectSelect.value;
  const selectedMembers = getCurrentMemberSelections();
  populateSelect(projectSelect, projects, 'Select a project');
  projectSelect.value = selectedProject;
  memberCountInput.max = String(members.length);
  memberCountInput.disabled = members.length === 0;
  renderMemberSelections(Math.min(Number(memberCountInput.value) || 1, Math.max(members.length, 1)), selectedMembers);

  const missing = [];
  if (projects.length === 0) missing.push('projects');
  if (members.length === 0) missing.push('people');
  submitButton.disabled = missing.length > 0;
  availabilityMessage.textContent = missing.length
    ? `Task creation is unavailable until ${missing.join(' and ')} exist.`
    : '';
  applyDateConstraints();
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
  resetButton.hidden = editing;
  cancelEditButton.hidden = !editing;
  cancelCreationButton.hidden = editing;
  editIndicator.hidden = !editing;
}

function resetForm(options = {}) {
  ignoreNextReset = true;
  form.reset();
  setEditMode();
  clearErrors();
  memberCountInput.value = members.length ? '1' : '';
  renderMemberSelections(1, []);
  startDateInput.value = getTodayIso();
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
    resetForm({ message: wasEditing ? 'Task updated successfully.' : 'Task created successfully.', type: 'success' });
  } catch (error) {
    console.error('Task save failed.', error);
    showMessage('The task could not be saved. Check browser storage and try again.', 'error');
  } finally {
    isSubmitting = false;
    submitButton.disabled = projects.length === 0 || members.length === 0;
  }
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

function showTasksView() {
  taskNavigation?.querySelector('.sidebar__link')?.click();
}

function beginEditing(taskId) {
  const task = globalThis.DataStore.getTaskById(taskId);
  if (!task) return;
  showTaskCreation();
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

function showDeleteDialog(task) {
  const overlay = document.createElement('div');
  const dialog = document.createElement('div');
  const icon = document.createElement('span');
  const title = document.createElement('h3');
  const message = document.createElement('p');
  const actions = document.createElement('div');
  const cancelButton = document.createElement('button');
  const deleteButton = document.createElement('button');
  const previousFocus = document.activeElement;

  overlay.className = 'task-delete-dialog';
  dialog.className = 'task-delete-dialog__panel';
  icon.className = 'task-delete-dialog__icon';
  actions.className = 'task-delete-dialog__actions';
  title.id = 'taskDeleteDialogTitle';
  title.textContent = 'Delete this task?';
  message.textContent = `"${task.title}" will be permanently removed. This action cannot be undone.`;
  cancelButton.type = deleteButton.type = 'button';
  cancelButton.className = 'task-form__button task-form__button--secondary';
  deleteButton.className = 'task-form__button task-form__button--danger';
  cancelButton.textContent = 'Keep Task';
  deleteButton.textContent = 'Delete Task';
  icon.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16M9 7V4h6v3m-9 0 1 13h10l1-13M10 11v5m4-5v5"/></svg>';
  dialog.setAttribute('role', 'dialog');
  dialog.setAttribute('aria-modal', 'true');
  dialog.setAttribute('aria-labelledby', title.id);

  function closeDialog() {
    document.removeEventListener('keydown', handleKeydown);
    overlay.remove();
    previousFocus?.focus();
  }

  function handleKeydown(event) {
    if (event.key === 'Escape') closeDialog();
    if (event.key === 'Tab') {
      const nextTarget = event.shiftKey ? cancelButton : deleteButton;
      if (document.activeElement === nextTarget) {
        event.preventDefault();
        (event.shiftKey ? deleteButton : cancelButton).focus();
      }
    }
  }

  cancelButton.addEventListener('click', closeDialog);
  deleteButton.addEventListener('click', () => {
    deleteTask(task.id);
    closeDialog();
  });
  overlay.addEventListener('click', (event) => {
    if (event.target === overlay) closeDialog();
  });
  document.addEventListener('keydown', handleKeydown);
  actions.append(cancelButton, deleteButton);
  dialog.append(icon, title, message, actions);
  overlay.append(dialog);
  document.body.append(overlay);
  cancelButton.focus();
}

function handleDelete(taskId) {
  const task = globalThis.DataStore.getTaskById(taskId);
  if (task) showDeleteDialog(task);
}

function closeTaskMenus(exceptMenu = null) {
  taskCardGrid?.querySelectorAll('.task-card__menu-popover:not([hidden])').forEach((menu) => {
    if (menu === exceptMenu) return;
    menu.hidden = true;
    menu.previousElementSibling?.setAttribute('aria-expanded', 'false');
  });
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
    updateMemberOptionAvailability();
  });
  cancelCreationButton.addEventListener('click', () => {
    resetForm();
    showTasksView();
  });
  cancelEditButton.addEventListener('click', () => {
    resetForm();
    showTasksView();
  });
  window.showCreateTaskForm = showTaskCreation;
  window.addEventListener('taskflow:projects-changed', loadDependencies);
  window.addEventListener('taskflow:members-changed', loadDependencies);
  taskCardGrid?.addEventListener('click', (event) => {
    const menuTrigger = event.target.closest('.task-card__menu-trigger');
    if (menuTrigger) {
      const menu = menuTrigger.nextElementSibling;
      const willOpen = menu.hidden;
      closeTaskMenus(willOpen ? menu : null);
      menu.hidden = !willOpen;
      menuTrigger.setAttribute('aria-expanded', String(willOpen));
      return;
    }

    const action = event.target.closest('[data-task-action]');
    if (!action) return;
    closeTaskMenus();
    if (action.dataset.taskAction === 'edit') beginEditing(action.dataset.taskId);
    if (action.dataset.taskAction === 'delete') handleDelete(action.dataset.taskId);
  });
  document.addEventListener('click', (event) => {
    if (!event.target.closest('.task-card__menu')) closeTaskMenus();
  });
  loadDependencies();
  window.loadTaskCreationDeps = loadDependencies;
}
