# Changelog

All notable changes to this project will be documented here.

## [1.0.0] - 2026-07-25

### 🚀 Initial Public Release

This release marks the completion of the **TaskFlow Management System** 2-Day Agentic Development Sprint by 10 interns.

### Added
- **Project Setup & Application Shell**: Modular responsive layout, sidebar, header, CSS variables, and BEM architecture (`@meowryam`).
- **Authentication & User Selector**: Simulated sign-in, registration, JWT session persistence in LocalStorage, and role permission matrix (`@Salman-ahmed-2`).
- **Project Management**: Project CRUD operations, deadline validation, status tracking, and deletion safety checks (`@laibainqilab-ds`).
- **Task Creation**: Comprehensive task form, multi-member assignment, due date validation, priority, and status assignment (`@abihajibbran1-lang`).
- **Kanban Task Board**: Interactive 4-column board (Todo, In Progress, Review, Done) with drag-and-drop state persistence (`@Bilalmughal-07`).
- **Documentation & Release Prep**: Full README audit, consolidated 10-intern AI usage report, Responsible AI policy, changelog, and release notes (`@AbdulAzeemHashmi`).
- **Search, Filter & Sorting**: Multi-criteria filter chaining (project, status, priority, assigned member) and due date sorting (`@TahaSohail-Goat`).
- **Prompt Builder & Responsible AI**: Built-in prompt generator across 6 engineering categories with validation, copy, and reset (`@hassaanahmed-dev`).
- **QA & Manual Testing**: Structured manual test suites, validation checklists, and bug report templates (`@inshrahmumtaz`).
- **Team Members**: Member management with live task count tracking, avatar initials generation, and deletion safety rules (`@muhammad-haris2`).

### Fixed
- Fixed LocalStorage synchronization and session restoration on page reload.
- Resolved Kanban column drag-and-drop state updates to persist directly to `DataStore`.
- Corrected responsive grid layouts on mobile and tablet viewport sizes.


### Changed

- Team Members: UI aligned with the Dashboard design system (widget-card
  shells, design tokens, scoped member-tile grid)
- Activity Log: full-page view and dashboard Recent Activity feed aligned
  with the Dashboard design system (widget-card shell, design tokens,
  color-coded per-action entries)

### Fixed

- Team Members: `navigateTo('members')` now renders the populated view
  instead of a blank section

---

## [0.1.0] - Initial Setup

### Added

- Repository created
- README starter
- Git ignore
- Documentation folders