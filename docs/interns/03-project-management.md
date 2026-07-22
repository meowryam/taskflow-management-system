# Module Documentation

## Intern
**Name: Laiba Inqilab Patel**

## Module
**Assigned Module:** 03 — Project Management

## GitHub Issue
Issue Link: https://github.com/meowryam/taskflow-management-system/issues/15

## Branch
Branch Name: feature/project-management


## Files Modified

- `src/modules/projects.js` — Implemented the Project Management module including project CRUD operations, validation, LocalStorage persistence, deadline handling, status management, and rendering.


## Responsibilities

- Implement the Project Management module assigned to Intern 3.
- Develop project CRUD functionality.
- Implement project validation and project data handling.
- Add LocalStorage persistence for project data.
- Handle project deadlines and status management.
- Keep the module isolated from other intern modules to minimize merge conflicts.
- Prepare the module for integration with the rest of the application during the integration phase.


## Features Implemented

### 1. Project CRUD Operations

Implemented complete project management functionality:

- Create new projects
- View all saved projects
- Retrieve projects by ID
- Update existing projects
- Delete projects


### 2. Project Schema

Each project follows the schema:

```javascript
{
  id,
  name,
  description,
  deadline,
  status,
  createdAt
}
```


### 3. Validation

Implemented validation for:

- Required project name
- Maximum project name length
- Maximum description length
- Required deadline
- Valid deadline format
- Valid project status

Validation errors are returned before saving invalid project data.


### 4. LocalStorage Persistence

Implemented a temporary LocalStorage wrapper for project data management.

Features:

- Save projects to LocalStorage
- Retrieve stored projects
- Generate unique project IDs

The storage wrapper follows a structure similar to a future shared DataStore, making migration easier during integration.


### 5. Deadline Handling

Implemented:

- Deadline formatting
- Overdue project detection
- Automatic overdue indication for incomplete projects


### 6. Status Management

Supported project statuses:

- Active
- Completed
- On Hold

Status validation is applied before saving project data.


### 7. Safe Project Deletion

Before deleting a project:

- The module checks for related tasks using the project ID.
- A confirmation warning is displayed if related tasks exist.
- Prevents accidental orphaned task references.


### 8. Integration Design

The module was intentionally kept independent from shared application files.

The implementation does not modify:

- `index.html`
- `app.js`
- `dataStore.js`

The module exposes:

```javascript
Projects.mount(containerElement)
```

allowing the application to decide where and when the module is integrated.


## AI Tool Used

- Claude Code


## Prompting Techniques Used

- Role-based prompting
- Context-rich prompting
- Constraint-based prompting


## Prompt(s) Used

### Prompt 1

```text
Implement the Project Management module for Intern 3 according to the assignment requirements.

Requirements:

- CRUD operations (Create, Read, Update, Delete)
- Project schema with name, description, deadline, status, createdAt
- Validation
- LocalStorage persistence
- Project list with edit/delete actions
- Deadline handling and overdue detection
- Status handling
- Warning before deleting a project that has related tasks

Keep the module self-contained without modifying other modules.
```


### Prompt 2

```text
Refactor the implementation so it follows the assignment boundaries exactly.

Remove:

- Automatic DOMContentLoaded mounting
- Injected CSS
- Automatic root element creation

Do not modify:

- app.js
- index.html
- dataStore.js

Instead expose a mount(containerElement) function so integration can happen later.
```


### Prompt 3

```text
Review this implementation against the assignment requirements and remove anything that belongs to another intern's scope.

Keep only Intern 3 responsibilities and ensure the code is ready for Day 2 integration.
```


## Testing Performed

Verified:

- Project creation
- Project updates
- Project deletion
- Project validation
- LocalStorage persistence
- Overdue detection logic
- Delete warning when related tasks exist


## Notes

- The module uses temporary LocalStorage persistence until integration with the shared DataStore.
- The implementation was kept isolated to prevent conflicts with other intern modules.
- No files outside the Intern 3 scope were modified.
- The module is ready for integration during the Day 2 phase.