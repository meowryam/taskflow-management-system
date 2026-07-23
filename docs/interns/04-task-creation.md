# Intern 4 – Task Creation

## 1. Folder structure

```text
index.html
src/
|-- dataStore.js
|-- modules/
|   |-- taskService.js
|   |-- taskValidation.js
|   `-- tasks.js
`-- styles/
    `-- tasks.css
```

## 2. File responsibilities

- `index.html` contains accessible task-form markup and the task-card container.
- `tasks.css` owns responsive task-form and task-card presentation.
- `tasks.js` populates controls, reads the form, renders validation, and coordinates submission.
- `taskValidation.js` defines allowed statuses/priorities and validates normalized input.
- `taskService.js` normalizes input, creates IDs/timestamps, builds the canonical task, and calls storage.
- `dataStore.js` is the shared persistence boundary used by Task Creation and Task Board.

## 3. Overall implementation plan

The UI reads projects and members through the repository, sends form values to the service, renders returned validation errors, and never writes LocalStorage itself. The service creates a valid canonical task and delegates persistence. The repository saves the task and emits an event so other modules can refresh.

All required form fields, validation rules, exact Kanban statuses, storage operations, partial updates, events, missing-data states, duplicate-submit protection, and backend-replacement boundaries are implemented. No authentication or additional task features are introduced.

## 4. Data model

```js
{
  id: '550e8400-e29b-41d4-a716-446655440000',
  title: 'Create task form',
  description: 'Implement and validate the form.',
  projectId: 'project-1',
  assignedMemberIds: ['member-1', 'member-2'],
  startDate: '2026-07-24',
  dueDate: '2026-07-31',
  priority: 'High',
  status: 'Todo',
  createdAt: '2026-07-21T12:00:00.000Z',
  updatedAt: '2026-07-21T12:00:00.000Z'
}
```

Only IDs connect a task to a project and member. Display names are resolved by consuming UI modules.

## 5. Validation strategy

Input is trimmed and normalized before validation. Title, project, member count, every generated member selection, creation date, due date, priority, and status are required. References must exist, member selections must be unique, and the count cannot exceed available members. Dates must be real `YYYY-MM-DD` dates; due dates cannot be before today or precede the creation date. The same structured validation runs for create and edit.

## 6. Storage strategy

The existing shared keys are `taskflow_tasks`, `taskflow_projects`, and `taskflow_members`. Missing keys, invalid JSON, non-array values, and empty arrays safely read as empty collections. Shared `DataStore` exposes `getTasks`, `getTaskById`, `addTask`, `updateTask`, and `deleteTask`. Task Creation never creates another key or duplicates persistence logic.

## 7. HTML

The form is in `index.html` under `#task-creation-section`. Labels, `aria-describedby`, live validation regions, status messages, Create Task, Reset, and Cancel controls are included. Reset is hidden in edit mode.

## 8. CSS

`src/styles/tasks.css` uses the existing design tokens, responsive form and card grids, visible focus styles, invalid-field styling, and restrained status/priority treatments with inline SVG icons.

## 9. JavaScript (split by file/module)

The implementation is split across `dataStore.js`, `taskValidation.js`, `taskService.js`, and `tasks.js` according to the responsibilities above. Modules use ES imports rather than application globals. Run the project through a local HTTP server because browsers commonly restrict ES-module imports from `file://` URLs.

## 10. Manual testing steps

Run the terminal test suite first with `node --test --test-isolation=none tests/task-creation.test.mjs`.

1. Serve the repository using a local development server and open `index.html`.
2. Open Task Creation and confirm the shared projects and members populate.
3. Submit empty or invalid inputs and verify field messages appear and no task is stored.
4. Test past dates, reversed dates, excessive member count, missing selections, and duplicate members.
5. Create a valid task, then inspect `taskflow_tasks` for the canonical model without names or legacy assignment fields.
6. Edit the task and verify `createdAt` remains unchanged while `updatedAt` changes.
7. Cancel an edit and verify nothing is saved.
8. Delete a task, reload, and verify it remains deleted.
9. Open Board and verify a new task appears in its status column and can move between columns.

## 11. Integration points with Task Board

```js
const tasks = DataStore.getTasks();
DataStore.updateTask(taskId, { status: 'In Progress' });
window.addEventListener(DataStore.TASKS_CHANGED_EVENT, renderBoard);
```

The board groups tasks by the exact stored `status` strings. It resolves project/member names separately using IDs. Every add, update, or delete dispatches `taskflow:tasks-changed` with `{ action, taskId }`.

## 12. Future SQL Server integration notes

Replace the implementation behind the shared `DataStore` CRUD methods with asynchronous HTTP calls whose routes map to task operations. UI and validation remain unchanged; service calls only need to become `async` and awaited. The API translates camelCase properties to database fields and validates project/member relationships server-side.

## 13. Architectural decisions

The shared store isolates persistence, and the service owns task construction so UI code does not create incompatible records. Validation is reusable and independent of DOM rendering. Custom events decouple producers from consumers. Reference labels are never copied into tasks, preventing stale duplicated data.

Edge cases are handled as follows:

- No projects/members: dropdowns remain empty and Create Task is disabled.
- Empty inputs, invalid dates, priorities, statuses, or references: field errors are shown; nothing is saved.
- Duplicate submission: an in-flight guard disables repeated submission.
- Missing, empty, malformed, or wrongly shaped storage values: repository reads return `[]`.
- Storage write failure: the UI reports failure and retains a usable form.
- Missing task for update/delete: update returns `null`; delete returns `false`.


# Prompt

```
## Role
Act as a Senior Frontend Software Engineer and Software Architect with experience building scalable task management systems using vanilla HTML, CSS, and JavaScript.
## Context
I am implementing Intern 4 – Task Creation for the TaskFlow Management System in the CODOC Agentic Development Assessment.
This project follows modular architecture with separate files for storage, business logic, and UI. The application currently uses LocalStorage but must be written so it can later be connected to a backend API or SQL Server database without major refactoring.
Another intern is independently developing Intern 5 – Task Board (Kanban Board). My implementation must be fully compatible with theirs without requiring changes to either module.
The Task Board will display four columns:
## Todo
In Progress
Review
Done
It will render tasks using the data produced by my module.
## Objective
Build a complete Task Creation module.
The module should include:

Task creation form
Validation
Shared data handling
LocalStorage integration
Clean modular JavaScript
Future backend compatibility
Compatibility with the Kanban board module
Functional Requirements
Create a form containing:
Task Title
Description
Project dropdown
Assigned Member dropdown
Due Date
Priority dropdown
Status dropdown
Create Task button
Reset button
Validation requirements:
Title is required.
Project must be selected.
Assigned member must be selected.
Due date is required.
Priority is required.
Status is required.
Display clear validation messages.
Do not save invalid tasks.
Task creation requirements:
Generate a unique task ID.
Create timestamps.
Save tasks through a shared storage layer instead of directly manipulating UI components.
Use one consistent task object.


The task object should contain:
{
id,
title,
description,
projectId,
assignedMemberId,
dueDate,
priority,
status,
createdAt
}


**Do not** store project names or member names inside the task.
Store only IDs.
Kanban Compatibility Requirements
The Task Board module must be able to use my data without modification.

Only allow these exact status values:
Todo
In Progress
Review
Done
Do not invent alternative names.
Every task must include:
title
priority
dueDate
assignedMemberId
projectId
status
Design the storage layer so Task Board can later perform:
getTasks()
getTaskById()
addTask()
updateTask()
deleteTask()
Ensure the Task Board can later update only the status field without rewriting the rest of the object.

After successful task creation, provide a mechanism that allows other modules to refresh automatically (for example using a shared render function or custom event).

# Architecture Requirements
Separate:
UI
Validation
Business logic
Storage
Avoid writing everything inside one event listener.
Keep functions small and reusable.
Use meaningful names.
Avoid duplicated code.
Avoid global variables where possible.
Design the module so replacing LocalStorage with SQL Server API calls later requires minimal changes.

# Edge Cases
Handle:
No projects exist
No members exist
Empty inputs
Duplicate submissions
Invalid dates
Invalid status values
Invalid priority values
LocalStorage containing empty arrays
LocalStorage missing expected keys
Explain how each edge case is handled.

# Constraints
Do NOT:
Use frameworks.
Use external libraries.
Overengineer the solution.
Mix UI rendering with storage logic.
Store redundant project or member names inside tasks.
Create functionality outside the assignment scope.
Add authentication.
Add comments, attachments, subtasks, recurring tasks, or notifications.
Output Format
Provide the solution in this order:
Folder structure
File responsibilities
Overall implementation plan
Data model
Validation strategy
Storage strategy
HTML
CSS
JavaScript (split by file/module)

# Manual testing steps
Integration points with Task Board
Future SQL Server integration notes

# Explanation of architectural decisions
Before writing code, briefly explain the implementation plan and verify that every requirement from the assignment has been addressed.

```

## Handoff notes for Intern 5 – Task Board

Task Creation and Task Board must use the existing global `DataStore` from `src/dataStore.js`. Do not introduce another LocalStorage key or a separate task collection. The shared keys use underscores: `taskflow_tasks`, `taskflow_projects`, and `taskflow_members`.

The Board can load tasks and related display data with:

```js
const tasks = DataStore.getTasks();
const projects = DataStore.getProjects();
const members = DataStore.getMembers();
```

New tasks persist this canonical shape:

```js
{
  id,
  title,
  description,
  projectId,
  assignedMemberIds,
  startDate,
  dueDate,
  priority,
  status,
  createdAt,
  updatedAt
}
```

Resolve project and member names at render time. Do not copy names into a task. For assignment lookup, prefer the canonical field while retaining compatibility with main's older seeded tasks:

```js
const memberIds = task.assignedMemberIds
  ?? [task.assignedMemberId ?? task.assignedUserId].filter(id => id != null);
const assignedMembers = members.filter(item =>
  memberIds.some(id => String(item.id) === String(id))
);
```

The only supported columns and stored statuses are `Todo`, `In Progress`, `Review`, and `Done`. Move a card by sending a partial update so every other task property is preserved:

```js
DataStore.updateTask(task.id, { status: newStatus });
```

Do not replace the entire task object merely to change its column. `DataStore.getTasks()` provides a runtime-only `assignedUserId` compatibility alias for canonical tasks, so the current Board can render assignments without persisting a duplicate field. New Board code should use the canonical-first lookup above.

Task Creation dispatches `taskflow:tasks-changed` after add, update, or delete. The Board should reload and render when it receives the event:

```js
window.addEventListener(DataStore.TASKS_CHANGED_EVENT, () => {
  window.KanbanBoardModule?.refresh();
});
```

When integrating scripts in the page, load `src/dataStore.js` before Task Creation or Board code. Navigating to the current Board already calls `loadData()`, so newly created tasks appear on navigation; listening for the event also supports live refresh when both modules are visible in a future layout.

## Task Creation enhancement implementation

### Updated plan and responsibilities

- `index.html` contains the Task Creation controls and the task-card grid used by the existing Tasks view.
- `tasks.css` contains only Task Creation presentation changes.
- `taskValidation.js` owns the reusable create/edit rules.
- `taskService.js` owns normalization, legacy assignment handling, timestamps, create, edit, and delete operations.
- `tasks.js` owns form state, dynamic dropdowns, field-error rendering, edit/cancel mode, confirmation, and card-menu actions.
- `dataStore.js` has one backward-compatible runtime alias extension so the unchanged Board can read the first new assignment. The alias is non-enumerable and is not stored.

No Project, Member, Board, Report, Activity, Authentication, Dashboard, navigation, or global-style module is changed.

### Feature behavior

- Creation Date is automatically set to the local creation date, is read-only, and is visually secondary. Editing preserves the original date.
- Member Count is limited to the total number of people available. All roles may be assigned. Changing the count adds or removes member selects without keeping extras.
- Every selected member must exist and be unique. A selected member is disabled in every other assignment dropdown.
- Create sets both timestamps. Edit preserves `createdAt` and replaces `updatedAt`.
- Edit loads old `assignedMemberId` or `assignedUserId` values into the new array model. Saving removes the legacy persisted fields.
- Edit and Delete appear in each task card's three-dot menu. Delete requires confirmation and removes only the task.
- Reset is available while creating but hidden while editing, preventing an existing task from being cleared accidentally.
- View Tasks returns to the task-card list. Cancel Edit also returns directly to that list without saving.
- Delete uses the TaskFlow-styled confirmation dialog instead of the browser confirmation prompt.
- Create, update, and delete continue emitting `taskflow:tasks-changed`.

### Edge-case handling

- No projects or people: creation is disabled with a message. Every person in the shared members collection increases assignment capacity, regardless of role.
- Empty or missing storage: shared `DataStore` returns safe collections and the task list shows its empty state.
- Old task structure: a single legacy assignment becomes a one-item `assignedMemberIds` array during editing.
- Missing former member: the edit form requires a currently available replacement before saving.
- Start Date is generated from the creation time; invalid, past, or reversed due dates are blocked.
- Duplicate or incomplete member selections: structured field errors block persistence.
- Member availability changes: the input maximum and rendered dropdown count are recalculated.
- Deleting the final task: the persisted collection becomes `[]` and the empty state renders.
- View Tasks returns to the card list; cancelling edit also returns there and resets edit state without saving.
- Refreshing: all successful changes are already in the existing LocalStorage collection.

### Manual testing

1. Run `node --test --test-isolation=none tests/task-creation.test.mjs`.
2. Open Task Creation and verify Creation Date is automatically populated, read-only, smaller, and gray.
3. Try a past due date and confirm a field error and no save.
4. Confirm Member Count includes every available person, including Admin and Manager, then change it from 1 to the available maximum and back.
5. Select a member and confirm that member is disabled in every other assignment dropdown.
6. Create a valid multi-member task and inspect `taskflow_tasks` for the new model and both timestamps.
7. Edit it, change all supported values, and confirm `createdAt` is unchanged while `updatedAt` changes.
8. Cancel task creation and confirm it returns to the Tasks table without saving.
9. Use Edit and Delete from a card's three-dot menu; accept deletion, reload, and confirm it stays deleted.
10. Open Edit and verify Reset is hidden, then cancel without saving.
11. Edit a legacy seeded task and confirm its single assignment loads safely into the new UI.
