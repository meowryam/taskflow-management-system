# Module Documentation

## Intern
**Name:** Taha Sohail

## Module
**Assigned Module:** Search, Filter & Sorting

## GitHub Issue
Issue Link: https://github.com/meowryam/taskflow-management-system/issues/12

## Branch
Branch Name: feature/search-filter

## Pull Request
PR Link: https://github.com/meowryam/taskflow-management-system/pull/17

## Files Modified
- src/dataStore.js (created)
- src/modules/filters.js (created)

## Responsibilities
- Implement LocalStorage shared data layer with seed data (tasks, projects, members)
- Implement search tasks by title (case-insensitive, partial match)
- Implement filter by project, status, priority, and assigned member
- Implement sort by due date (ascending/descending, nulls last)
- Ensure multiple filters work together (AND chaining via applyAllFilters)
- Handle edge cases (empty query, no filters selected, null due dates)
- Provide clearFilters() to reset all filters

## Features Implemented
- DataStore module with getTasks, getProjects, getMembers, saveTasks, saveProjects, saveMembers
- Auto-seeding with sample data (3 members, 2 projects, 5 tasks)
- searchTasks — case-insensitive partial title match
- filterByProject — exact project ID match
- filterByStatus — exact status match (Todo, In Progress, Review, Done)
- filterByPriority — exact priority match (High, Medium, Low)
- filterByMember — exact member ID match
- applyAllFilters — chains all active filters in AND fashion
- sortByDueDate — ascending or descending, null due dates sorted last
- clearFilters — returns empty filters object

## AI Tool Used
- Cursor (via opencode CLI agent)

## Prompting Techniques Used
- Role-based: "Act as a senior backend engineer"
- Context-rich: Provided full repository structure, existing files, and assignment requirements
- Constraint-based: "No frontend/UI code, pure functions, no external libraries, edge cases required"

## Prompt(s) Used
```text
Act as a senior backend engineer. Create a beginner-friendly but scalable module for a task management system. Use clear naming, avoid unnecessary libraries, include edge cases, and explain how to test the module manually. Use proper backend logic with no errors.

Requirements:
- src/dataStore.js: LocalStorage wrapper with getTasks, getProjects, getMembers, saveTasks, saveProjects, saveMembers. Auto-seed with sample data on first load.
- src/modules/filters.js: Pure functions for searchTasks (title, case-insensitive), filterByProject, filterByStatus, filterByPriority, filterByMember, applyAllFilters (AND chaining), sortByDueDate (asc/desc, nulls last), clearFilters.
- No DOM manipulation. No frontend code.
```

## AI Mistake Found
- AI initially used ES6 module syntax (import/export) which requires a bundler or module script. Fixed by using IIFE (Immediately Invoked Function Expression) pattern for browser compatibility without build tools.

## Manual Fix
- Changed `export const` module pattern to `const DataStore = (function() { ... return { ... }; })();` IIFE pattern so it works directly in the browser with script tags.

## Testing Performed
- [ ] Verify DataStore seeds data on first load by checking localStorage in browser DevTools
- [ ] Call Filters.searchTasks(tasks, 'landing') — should return only tasks with 'landing' in title
- [ ] Call Filters.filterByStatus(tasks, 'Todo') — should return only 'Todo' tasks
- [ ] Call Filters.filterByPriority(tasks, 'High') — should return only 'High' priority tasks
- [ ] Call Filters.filterByProject(tasks, 1) — should return tasks for project 1 only
- [ ] Call Filters.filterByMember(tasks, 3) — should return tasks assigned to member 3
- [ ] Call Filters.applyAllFilters(tasks, { status: 'Todo', priority: 'High' }) — should return tasks matching BOTH
- [ ] Call Filters.sortByDueDate(tasks, 'asc') — tasks sorted with earliest due date first, null dates last
- [ ] Call Filters.sortByDueDate(tasks, 'desc') — tasks sorted with latest due date first, null dates last
- [ ] Call Filters.clearFilters() — returns empty object


## Notes
- All functions are pure — they do not mutate the input array, they return new arrays
- The module is designed to be used with a frontend that passes task data and filter values into these functions
- Multiple filters are combined via applyAllFilters which sequentially applies each active filter (AND logic)
