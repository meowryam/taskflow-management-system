# Changelog

All notable changes to this project will be documented here.

## [Unreleased]

### Added

- Initial repository
- Professional folder structure
- Documentation files
- Base project layout
- Prompt Builder module with 6 prompt categories
- Prompt validation, copy, and reset functionality
- Responsible AI guidance section
- Prompt Builder documentation and manual test cases
- Team Members: edit-member support via an add/edit form toggle
- Team Members: styled delete-confirmation dialog (replaces native alert)
- Team Members: empty state when no members exist
- Activity Log: per-action SVG icons and date grouping (Today / Yesterday / older)
- Activity Log: clear-log action with a styled confirmation dialog
- Activity Log: `clearAll()` in the activity log data layer
- Activity Log: empty state aligned with the dashboard `.widget-empty` pattern

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