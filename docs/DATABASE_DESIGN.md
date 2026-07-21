# Database Design Decisions

## Scope represented in the database

The schema stores only information explicitly required by TaskFlow:

1. Users/team members and their roles.
2. Projects and project status.
3. Tasks, assignment, priority, due date, and board status.
4. Activity history.
5. Derived report and workload values.

## Relationship summary

```text
Users 1 ---- many Projects (created by)
Users 1 ---- many Tasks (assigned to)
Users 1 ---- many Tasks (created by)
Projects 1 ---- many Tasks
Users 1 ---- many ActivityLogs (performed by)
```

## Why reports are views instead of stored totals

Task counts, pending/completed totals, overdue totals, completion percentage, and member workload are calculated from current project/task/member data. Storing duplicate totals would create synchronization problems. Views keep reports consistent with live data.

`vw_ReportSummary` calculates all task totals in one aggregate pass. The workload and board/report access paths have covering indexes for their common status, member, project, priority, and due-date fields. This improves reads without adding stored totals or changing product behavior.

## Why setup is consolidated

Database creation, tables, constraints, indexes, and views form one ordered deployment unit and are in `01.setup-database.sql`. Optional seed data and application query examples stay separate so test data and example mutations cannot accidentally become part of production setup. The destructive reset utility also remains separate. This reduces the five former setup/example scripts to three purpose-specific files while preserving the same database scope.

## Why deletion uses NO ACTION

The assignment requires deletion safety:

- A project with related tasks must not be silently deleted.
- A member referenced as a project/task creator, task assignee, or activity actor must not be deleted without warning and explicit handling of those records.

Foreign keys therefore block destructive deletion. The application can display a warning, reassign or explicitly handle dependent records, and then retry deletion.

## Why no database table exists for every intern module

Some modules do not require persistent product data:

- App layout and theme are frontend concerns.
- Search/filter/sort are queries over tasks.
- Kanban is a task status presentation.
- Reports are derived from stored data.
- Prompt Builder generates prompts; the assignment does not require prompt history storage.
- QA test cases, screenshots, AI usage report, responsible AI policy, changelog, and release notes are repository files, not operational database records.
- The assignment specifies a simple user selector rather than full backend authentication, so password, token, and session tables are not included.

Adding those tables would exceed the stated scope.

## Controlled values

Only values explicitly fixed by the assignment are constrained:

- User roles: `Admin`, `Manager`, `Team Member`
- Task statuses: `Todo`, `In Progress`, `Review`, `Done`

The assignment does not define a complete project-status list or a complete priority list. Those columns therefore require non-blank text but are not restricted to an invented set. The sample data uses common labels only to make local testing possible; the development team can replace them without changing the schema. The reports view checks for `High` because the assignment explicitly requires a high-priority task count.
