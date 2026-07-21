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
