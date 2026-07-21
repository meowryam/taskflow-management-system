# TaskFlow SQL Server Database

This repository contains the SQL Server database foundation for the TaskFlow Management System. Design rationale is documented in `DATABASE_DESIGN.md`.

## Files

```text
docs/
|-- DATABASE_DESIGN.md
`-- DATABASE_README.md
scripts/
|-- 01.setup-database.sql
|-- 02.seed-data.sql
|-- 03.sample-queries.sql
`-- 99.reset-database.sql
```

## Execution order

Run these scripts in SQL Server Management Studio or Azure Data Studio:

1. Run `01.setup-database.sql` to create the database, tables, constraints, indexes, and views.
2. Optionally run `02.seed-data.sql` for development or manual testing.
3. Use individual statements from `03.sample-queries.sql` as application query examples; do not execute the entire file as deployment setup.

`99.reset-database.sql` is development-only and permanently deletes the complete database. It is not part of normal setup.

The setup and seed scripts are repeatable. Re-running setup preserves existing tables and data while ensuring the views exist.

## Database objects

### Tables

- `Users`: user selector, roles, and team-member data.
- `Projects`: project management data.
- `Tasks`: task creation, assignment, priority, due date, and Kanban status.
- `ActivityLogs`: important project, task, member, status, priority, assignment, and completion actions.

### Views

- `vw_TaskDetails`: joined task/project/member data plus overdue calculation.
- `vw_MemberWorkload`: assigned, open, completed, and overdue task counts per member.
- `vw_ReportSummary`: report-card totals and completion percentage.

## Important behavior

- A task requires both a project and an assigned member.
- Project deletion is blocked while tasks reference the project.
- Member deletion is blocked while tasks are assigned to or created related records.
- Task status values match the required Kanban columns: `Todo`, `In Progress`, `Review`, and `Done`.
- A completed task must have `CompletedAt`; all other task statuses must keep it null.
- Dates are stored with SQL Server `DATE`; audit timestamps use UTC `DATETIME2`.
- Search, filters, sorting, board views, reports, and activity log are supported by indexes and views.

## Integration note

The frontend or backend should use parameterized queries. The literal values in `03.sample-queries.sql` are examples only and must not be created by string concatenation in application code.
