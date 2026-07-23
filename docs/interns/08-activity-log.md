# Module Documentation

## Intern
**Name:** <add name>

## Module
**Assigned Module:** Activity Log (UI Enhancement)

## GitHub Issue
**Issue Link:** <add issue link>

## Branch
**Branch Name:** `feature/activity-log-dashboard-ui-alignment`

## Pull Request
**PR Link:** <add PR link>

## Files Modified
- `src/modules/activityLog.js`
- `src/modules/activityLog-ui.js`
- `changelog.md`
- `docs/interns/08-activity-log.md`

## Objective
Align the Activity Log module's full-page view and dashboard Recent Activity
feed with the Dashboard design system, and enhance usability with per-action
icons, date grouping, and a Clear-log action guarded by a styled confirmation
dialog - while preserving filtering, timestamps, permissions, and the router
mount pattern.

## Responsibilities
- Restyle the full-page Activity Log (`#activity-log-section`) to match the
  Dashboard glass card system, reusing shared classes and design tokens.
- Polish the dashboard Recent Activity feed so entries are visually
  consistent with the rest of the Dashboard.
- Add per-action-type icons and colour coding.
- Group entries by date (Today / Yesterday / older).
- Add a "Clear activity log" action with a styled confirmation dialog.
- Keep data/logic (`activityLog.js`) separate from rendering
  (`activityLog-ui.js`), and avoid changes to the shell, router, or other
  modules.

## Features Implemented
- Full-page view rebuilt on the Dashboard `.widget-card` shell with
  `.widget-card__header/__title/__badge/__body`, replacing the flat
  `.al-card`.
- Design-token colours throughout; removed hardcoded Bootstrap-style badge
  hex values in favour of a token-aligned per-action accent palette.
- Per-action SVG icons for all seven action types (Created, Updated,
  Deleted, Assigned, Status Changed, Priority Changed, Completed), driven by
  a shared `--al-accent` / `--al-accent-bg` custom-property pair so the icon,
  badge, and dashboard dot stay consistent (DRY).
- Entry rows redesigned as a flexible icon + content layout (`min-width: 0`,
  `overflow-wrap`) that wraps cleanly and does not overflow, replacing the
  rigid four-column grid.
- Date grouping under Today / Yesterday / date headers, respecting active
  filters.
- Dashboard Recent Activity feed items colour-coded per action; the
  `#activityCount` badge kept in sync.
- Empty state using the Dashboard `.widget-empty` pattern, with distinct
  messages for an empty log vs. no filter matches.
- Filters (entity / action / search) and Clear-filters restyled with the
  shared `.pm-form-row` / `.pm-btn` classes; filtering logic unchanged.
- "Clear log" action: a new `clearAll()` in `activityLog.js` (logic layer)
  plus a styled confirmation dialog (Cancel / Escape / overlay to abort,
  Confirm to clear) in `activityLog-ui.js`.

## AI Tool Used
- Cursor (Claude model)

## Prompting Techniques Used
- Role-based
- Context-rich
- Constraint-based
- Phased workflow (analysis -> issue -> plan -> implementation)

## Prompt(s) Used
```text
Follow the same phased pipeline used for the Member Module, applied to the
Activity Log module: understand the project, produce a GitHub issue, suggest
a branch, write an implementation plan, then implement only the Activity Log
UI to match the Dashboard design system. Scope expanded to also restyle the
dashboard Recent Activity feed and to add per-action icons, date grouping,
and a Clear-log action with a styled confirmation dialog. Keep logic
(activityLog.js) separate from rendering (activityLog-ui.js); do not modify
the shell, router, or other modules.
```

## AI Mistake Found
- The `taskflow:activity-changed` event is dispatched on `window` by the
  logic layer, but the UI listens on `document`, so relying solely on that
  event to refresh after clearing the log would not reliably update both
  surfaces.

## Manual Fix
- After `clearAll()`, the confirm handler refreshes both surfaces directly
  (`refreshMountedPage()` + `renderDashboardFeed()`) instead of depending on
  the mismatched event.
- <add any further manual adjustments made during review, or "None">

## Testing Performed
- [ ] Full-page view matches the Dashboard glass aesthetic (card, spacing, typography)
- [ ] Entries show correct per-action icon and token-coloured badge
- [ ] Date groups render (Today / Yesterday / older) in the correct order
- [ ] Entity / Action / Search filters work; Clear filters resets them
- [ ] Timestamps preserved (absolute on the page, relative on the dashboard)
- [ ] Dashboard Recent Activity feed items are colour-coded; "View all" works
- [ ] Empty state uses `.widget-empty`
- [ ] Clear log opens the styled dialog (no native popup)
- [ ] Cancel / Escape / overlay click closes the dialog without clearing
- [ ] Confirm empties the log; page and dashboard feed show the empty state
- [ ] After reload, the log stays empty (no re-seed)
- [ ] No horizontal overflow at 480px / 768px / 1024px+

## Screenshots
(Add before/after screenshots here: full page, entry rows, dashboard feed, empty state, clear dialog, mobile width)

## Notes
- Plain JavaScript and CSS only - no external libraries, no framework.
- Logic (`activityLog.js`) is kept separate from rendering
  (`activityLog-ui.js`); only `clearAll()` was added to the logic layer.
- The confirmation dialog reuses the same visual pattern as the Team Members
  delete dialog but is injected locally in `activityLog-ui.js` to keep the
  module self-contained. Promoting a shared dialog component to `style.css`
  is noted as a future refactor.
- The unused legacy `renderActivityTimeline()` in `dashboard.js` and the
  `.activity-item*` styles in `style.css` were left untouched (separate
  cleanup issue).
