# 📊 AI Usage Report - TaskFlow Management System

This document records the complete, transparent, and disclosed AI-assisted development across all **10 modules** and **2 integration teams** during the 2-Day Agentic Development Sprint.

In accordance with CODOC Responsible AI guidelines, every contributor used AI tools as professional development partners under strict human verification and manual code auditing.

---

## 📋 Summary Table of AI Usage Across All 10 Interns

| # | Intern | Assigned Module | AI Tool Used | Primary Prompting Techniques | Tokens Used (Est.) |
|---|---|---|---|---|---|
| 1 | **Maryam** ([@meowryam](https://github.com/meowryam)) | Project Setup & App Layout | ChatGPT | Role-based, Context-rich, Constraint-based | ~15,500 |
| 2 | **Salman Ahmed** ([@Salman-ahmed-2](https://github.com/Salman-ahmed-2)) | Authentication / User Selector | Claude | Role-based, Context-rich, Output-format | ~23,000 |
| 3 | **Laiba Inqilab Patel** ([@laibainqilab-ds](https://github.com/laibainqilab-ds)) | Project Management | Cursor (Claude) | Role-based, Context-rich, Constraint-based | ~18,000 |
| 4 | **Abihaj Ibbran** ([@abihajibbran1-lang](https://github.com/abihajibbran1-lang)) | Task Creation | Cursor / Claude | Role-based, Step-by-step, Constraint-based | ~21,000 |
| 5 | **Muhammad Bilal** ([@Bilalmughal-07](https://github.com/Bilalmughal-07)) | Task Board | Cursor | Role-based, Context-rich, Debugging | ~19,200 |
| 6 | **Abdul Azeem Hashmi** ([@AbdulAzeemHashmi](https://github.com/AbdulAzeemHashmi)) | Documentation & Release Prep | Claude / Antigravity IDE | Role-based, Context-rich, Constraint-based, Step-by-step | ~19,000 |
| 7 | **Taha Sohail** ([@TahaSohail-Goat](https://github.com/TahaSohail-Goat)) | Search, Filter & Sorting | Cursor (opencode CLI) | Role-based, Context-rich, Constraint-based | ~14,200 |
| 8 | **Hassaan Ahmed** ([@hassaanahmed-dev](https://github.com/hassaanahmed-dev)) | Prompt Builder & Responsible AI | DeepSeek (OpenCode CLI) | Role-based, Context-rich, Constraint-based, Output-format | ~17,300 |
| 9 | **Inshrah Mumtaz** ([@inshrahmumtaz](https://github.com/inshrahmumtaz)) | QA & Manual Testing | ChatGPT / Claude | Role-based, Test-generation, Constraint-based | ~13,000 |
| 10 | **Muhammad Haris** ([@muhammad-haris2](https://github.com/muhammad-haris2)) | Team Members | Claude | Role-based, Context-rich, Constraint-based | ~16,100 |

---

## 👤 Detailed Intern AI Logs

### 1. Maryam ([@meowryam](https://github.com/meowryam))
- **Assigned Module:** Project Setup and App Layout (Intern 1)
- **AI Tool Used:** ChatGPT
- **Prompting Techniques:** Role-based prompting, Context-rich prompting, Constraint-based prompting
- **Prompt Used:**
  > "Act as a Senior Frontend Engineer. Build the application shell, responsive layout, dashboard structure, sidebar, header, and CSS variables for TaskFlow Management System. Constraints: HTML5, CSS3, Vanilla JS, no external CSS frameworks (Bootstrap/Tailwind), BEM naming conventions."
- **AI Mistake:** AI generated CSS with framework specific utility classes and assumed external icon libraries like FontAwesome.
- **Manual Fix:** Stripped third party library dependencies, created native SVG icons, and implemented pure CSS variables with BEM architecture.
- **Tokens Used:** ~12,000 input / ~3,500 output tokens.

---

### 2. Salman Ahmed ([@Salman-ahmed-2](https://github.com/Salman-ahmed-2))
- **Assigned Module:** Authentication / User Selector (Intern 2)
- **AI Tool Used:** Claude
- **Prompting Techniques:** Role-based prompting, Context-rich prompting, Output-format specification
- **Prompt Used:**
  > "Build the authentication UI (login & register), client-side validation, JWT-based session persistence in LocalStorage, and a role-based permission matrix (Admin, Manager, Team Member). Ensure active user session survives page refreshes."
- **AI Mistake:** AI JWT verification logic stored expired tokens without clearing them on refresh, causing stale session loops.
- **Manual Fix:** Added automatic `exp` claim verification in `JWT.getSession()` that purges expired tokens from LocalStorage upon detection.
- **Tokens Used:** ~18,000 input / ~5,000 output tokens.

---

### 3. Laiba Inqilab Patel ([@laibainqilab-ds](https://github.com/laibainqilab-ds))
- **Assigned Module:** Project Management (Intern 3)
- **AI Tool Used:** Cursor (Claude 3.5 Sonnet)
- **Prompting Techniques:** Role-based prompting, Context-rich prompting, Constraint-based prompting
- **Prompt Used:**
  > "Act as a frontend engineer. Create a standalone Project Management module with CRUD operations (create, edit, delete, view), deadline validation, status management, and LocalStorage saving."
- **AI Mistake:** Project deletion handler allowed deleting projects with active tasks attached without any warning or validation.
- **Manual Fix:** Added relational safety check blocking deletion if active tasks are linked to the target project ID.
- **Tokens Used:** ~14,000 input / ~4,000 output tokens.

---

### 4. Abihaj Ibbran ([@abihajibbran1-lang](https://github.com/abihajibbran1-lang))
- **Assigned Module:** Task Creation (Intern 4)
- **AI Tool Used:** Cursor / Claude
- **Prompting Techniques:** Role-based prompting, Step-by-step prompting, Constraint-based prompting
- **Prompt Used:**
  > "Create task creation form and service layer validating title, project selection, assigned member, due date, priority, and status. Separate UI rendering from storage service logic."
- **AI Mistake:** AI generated ES module import syntax that failed when opening `index.html` directly via `file://` protocol.
- **Manual Fix:** Provided clear documentation for serving via local HTTP server and added storage boundary fallbacks.
- **Tokens Used:** ~16,500 input / ~4,500 output tokens.

---

### 5. Muhammad Bilal ([@Bilalmughal-07](https://github.com/Bilalmughal-07))
- **Assigned Module:** Task Board (Intern 5)
- **AI Tool Used:** Cursor
- **Prompting Techniques:** Role-based prompting, Context-rich prompting, Debugging prompting
- **Prompt Used:**
  > "Implement an interactive 4-column Kanban board (Todo, In Progress, Review, Done) with HTML drag-and-drop, priority badges, assigned user avatars, and status update event dispatching."
- **AI Mistake:** Drag-and-drop handler updated the UI column visually but failed to call `DataStore.updateTask()` to persist the new status.
- **Manual Fix:** Tied the `drop` event directly to `DataStore.updateTask(taskId, { status: targetColumn })` and triggered `taskflow:tasks-changed` event.
- **Tokens Used:** ~15,000 input / ~4,200 output tokens.

---

### 6. Abdul Azeem Hashmi ([@AbdulAzeemHashmi](https://github.com/AbdulAzeemHashmi))
- **Assigned Module:** Documentation and Release Prep (Intern 6)
- **AI Tool Used:** Claude / Antigravity IDE
- **Prompting Techniques:** Role-based prompting, Context-rich prompting, Constraint-based prompting, Step-by-step prompting
- **Prompt Used:**
  > "Act as a senior technical documentation specialist and release engineer. Audit README.md, consolidate AI_usage_report.md for 10 interns, finalize RESPONSIBLE_AI_POLICY.md, update changelog.md for v1.0.0 release, and draft GitHub release notes."
- **AI Mistake:** AI generated an outdated 12-intern assignment table and invalid relative link paths for screenshots.
- **Manual Fix:** Updated contributor table to 10 interns with exact GitHub handles, verified image embed paths in `docs/screenshots/`, updated CHANGELOG.md for v1.0.0 release, and authored `docs/interns/06-documentation.md`.
- **Tokens Used:** ~15,000 input / ~4,000 output tokens.

---

### 7. Taha Sohail ([@TahaSohail-Goat](https://github.com/TahaSohail-Goat))
- **Assigned Module:** Search, Filter and Sorting (Intern 7)
- **AI Tool Used:** Cursor (opencode CLI agent)
- **Prompting Techniques:** Role-based prompting, Context-rich prompting, Constraint-based prompting
- **Prompt Used:**
  > "Act as a senior backend engineer. Create a pure JS module for searchTasks, filterByProject, filterByStatus, filterByPriority, filterByMember, applyAllFilters (AND chaining), and sortByDueDate."
- **AI Mistake:** AI used ES6 `export const` syntax which throws syntax errors in traditional browser script loading.
- **Manual Fix:** Converted export logic into IIFE (Immediately Invoked Function Expression) pattern exposing `window.Filters`.
- **Tokens Used:** ~11,000 input / ~3,200 output tokens.

---

### 8. Hassaan Ahmed ([@hassaanahmed-dev](https://github.com/hassaanahmed-dev))
- **Assigned Module:** Prompt Builder and Responsible AI (Intern 8)
- **AI Tool Used:** DeepSeek (OpenCode CLI)
- **Prompting Techniques:** Role-based prompting, Context-rich prompting, Constraint-based prompting, Output-format specification
- **Prompt Used:**
  > "Build a Prompt Builder module generating structured prompts across 6 engineering categories (Project Breakdown, Task Description, Acceptance Criteria, Code Review, Test Cases, Documentation). Include validation, copy, and reset."
- **AI Mistake:** LocalStorage persistence cleared input fields upon page reload instead of retaining the selected prompt type.
- **Manual Fix:** Added state handler persisting `taskflow_last_prompt_type` in LocalStorage and restoring selection on page load.
- **Tokens Used:** ~13,500 input / ~3,800 output tokens.

---

### 9. Inshrahmumtaz ([@inshrahmumtaz](https://github.com/inshrahmumtaz))
- **Assigned Module:** QA and Manual Testing (Intern 9)
- **AI Tool Used:** ChatGPT / Claude
- **Prompting Techniques:** Role-based prompting, Test-generation prompting, Constraint-based prompting
- **Prompt Used:**
  > "Act as a QA lead. Generate comprehensive manual test cases, bug report templates, empty state verification checklists, and LocalStorage persistence checklists for a task management application."
- **AI Mistake:** AI produced automated Cypress test scripts which were incompatible with the manual testing sprint requirements.
- **Manual Fix:** Converted automated test scripts into structured manual test cases in `tests/manual-test-cases.md`.
- **Tokens Used:** ~10,000 input / ~3,000 output tokens.

---

### 10. Muhammad Haris ([@muhammad-haris2](https://github.com/muhammad-haris2))
- **Assigned Module:** Team Members (Intern 10)
- **AI Tool Used:** Claude
- **Prompting Techniques:** Role-based prompting, Context-rich prompting, Constraint-based prompting
- **Prompt Used:**
  > "Create a Team Members module with add/edit/delete functionality, avatar initials generation, active task count calculation per member, and deletion safety blocking."
- **AI Mistake:** Member cards borrowed fixed-height CSS classes from dashboard stats, causing overflow on long email addresses.
- **Manual Fix:** Built a dedicated, flexible CSS auto-grid (`repeat(auto-fill, minmax(240px, 1fr))`) preventing layout breaking.
- **Tokens Used:** ~12,500 input / ~3,600 output tokens.