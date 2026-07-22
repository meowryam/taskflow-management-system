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

- `index.html` contains accessible task-form markup only.
- `tasks.css` owns responsive task-form presentation.
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
  assignedMemberId: 'member-1',
  dueDate: '2026-07-31',
  priority: 'High',
  status: 'Todo',
  createdAt: '2026-07-21T12:00:00.000Z'
}
```

Only IDs connect a task to a project and member. Display names are resolved by consuming UI modules.

## 5. Validation strategy

Input is trimmed and normalized before validation. Title, project, member, date, priority, and status are required. Project/member IDs must exist in the currently loaded collections. Dates must be real `YYYY-MM-DD` calendar dates. Priorities are `Low`, `Medium`, or `High`; statuses are exactly `Todo`, `In Progress`, `Review`, or `Done`. Invalid input returns field-keyed messages and never reaches storage.

## 6. Storage strategy

LocalStorage keys are `taskflow.tasks`, `taskflow.projects`, and `taskflow.members`. Missing keys, invalid JSON, non-array values, and empty arrays safely read as empty collections. `TaskRepository` exposes `getTasks`, `getTaskById`, `addTask`, `updateTask`, and `deleteTask`. All returned updates preserve the existing object, so `updateTask(id, { status: 'Done' })` changes only status. Invalid status updates are rejected at the repository boundary.

## 7. HTML

The form is in `index.html` under `#task-creation-section`. Labels, `aria-describedby`, live validation regions, status messages, Create Task, and Reset controls are included.

## 8. CSS

`src/styles/tasks.css` uses the existing design tokens, a two-column desktop layout, a single-column mobile layout, visible focus styles, invalid-field styling, and disabled-button feedback.

## 9. JavaScript (split by file/module)

The implementation is split across `dataStore.js`, `taskValidation.js`, `taskService.js`, and `tasks.js` according to the responsibilities above. Modules use ES imports rather than application globals. Run the project through a local HTTP server because browsers commonly restrict ES-module imports from `file://` URLs.

## 10. Manual testing steps

Run the terminal test suite first with `node --test --test-isolation=none tests/task-creation.test.mjs`.

1. Serve the repository using a local development server and open `index.html`.
2. With no `taskflow.projects` or `taskflow.members`, open Tasks and confirm creation is disabled with a clear message.
3. Add test arrays to those two LocalStorage keys, using objects with `id` and `name`, then reload.
4. Submit the empty form and verify field messages appear and no task is stored.
5. Try invalid select values through developer tools and confirm they are rejected.
6. Enter a valid task, submit twice rapidly, and confirm only one task is created.
7. Inspect `taskflow.tasks`; confirm the nine expected properties exist and no project/member names are stored.
8. Confirm Reset clears fields, errors, and messages.
9. Call `updateTask(taskId, { status: 'Done' })` from another module and confirm all other properties remain unchanged.
10. Try an invalid status update and confirm it throws without modifying storage.
11. Corrupt `taskflow.tasks` and confirm reads return an empty array without crashing the UI.

## 11. Integration points with Task Board

```js
import {
  getTasks,
  getTaskById,
  updateTask,
  TASKS_CHANGED_EVENT
} from '../dataStore.js';

const tasks = getTasks();
updateTask(taskId, { status: 'In Progress' });
window.addEventListener(TASKS_CHANGED_EVENT, renderBoard);
```

The board groups tasks by the exact stored `status` strings. It resolves project/member names separately using IDs. Every add, update, or delete dispatches `taskflow:tasks-changed` with `{ action, taskId }`.

## 12. Future SQL Server integration notes

Replace `BrowserStorageAdapter`/repository persistence with asynchronous HTTP calls to a backend whose routes map to task CRUD operations. UI and validation remain unchanged; only service/repository calls need to become `async` and awaited. The frontend model maps naturally to task table fields, while the API translates camelCase properties to database column names and validates foreign keys server-side.

## 13. Architectural decisions

The repository pattern isolates persistence, and the service owns task construction so neither UI nor Board creates incompatible records. Validation is reusable and independent of DOM rendering. Custom events decouple producers from consumers. IDs are strings to support browser UUIDs now and backend-generated identifiers later. Reference labels are never copied into tasks, preventing stale duplicated data.

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
  assignedMemberId,
  dueDate,
  priority,
  status,
  createdAt
}
```

Resolve project and member names at render time. Do not copy names into a task. For assignment lookup, prefer the canonical field while retaining compatibility with main's older seeded tasks:

```js
const memberId = task.assignedMemberId ?? task.assignedUserId;
const member = members.find(item => String(item.id) === String(memberId));
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
