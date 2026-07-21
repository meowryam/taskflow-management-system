# Manual Test Cases — Prompt Builder

## TC-01: Generate prompt with all fields filled
1. Select "Test Cases" from Prompt Type dropdown
2. Enter "TaskFlow task creation module" as Project Name
3. Enter "HTML, CSS, JavaScript, LocalStorage" as Tech Stack
4. Enter "We use a kanban-style board with drag-and-drop" as Context
5. Enter "Generate detailed manual test cases for task creation" as Main Task
6. Enter "Do not use automated testing libraries" as Constraints
7. Enter "Empty fields, missing project, page refresh" as Edge Cases
8. Click **Generate Prompt**
- [ ] Output area shows 6 labeled sections (Role, Context, Task, Constraints, Expected Output Format, Edge Cases)
- [ ] Role says "Act as a Senior QA Engineer"

## TC-02: Validation blocks empty required fields
1. Leave Prompt Type as "-- Select a prompt type --"
2. Leave Project Name empty
3. Leave Main Task empty
4. Click **Generate Prompt**
- [ ] Red error messages appear under all 3 required fields
- [ ] No prompt is generated
- [ ] Output area remains unchanged

## TC-03: Validation blocks partial missing fields
1. Select "Code Review" from Prompt Type dropdown
2. Enter "Auth module" in Project Name
3. Leave Main Task empty
4. Click **Generate Prompt**
- [ ] Error message appears only under Main Task
- [ ] No prompt is generated

## TC-04: Prompt type changes role and output format
1. Select "Project Breakdown" → observe Output Format field
2. Select "Documentation" → observe Output Format field
- [ ] Role changes to "Senior Technical Writer" when generating
- [ ] Expected Output Format field updates to documentation outline

## TC-05: Copy to clipboard
1. Generate any valid prompt
2. Click **Copy Prompt**
- [ ] Green toast appears: "Copied to clipboard!"
- [ ] Paste into a text editor — full prompt appears correctly

## TC-06: Reset clears everything
1. Fill all fields and generate a prompt
2. Click **Clear / Reset**
- [ ] All form fields return to their initial state
- [ ] Output area shows placeholder text
- [ ] Copy button is disabled
- [ ] No validation error messages visible

## TC-07: Whitespace trimming
1. Enter "   " (spaces only) in Project Name
2. Enter "   " (spaces only) in Main Task
3. Select any Prompt Type
4. Click **Generate Prompt**
- [ ] Validation fires for both required fields (whitespace is treated as empty)

## TC-08: Optional fields omitted
1. Fill only required fields (Prompt Type, Project Name, Main Task)
2. Leave Tech Stack, Context, Constraints, Expected Format, Edge Cases empty
3. Click **Generate Prompt**
- [ ] Prompt is generated successfully
- [ ] Context shows auto-generated fallback text
- [ ] Constraints shows "Follow standard industry best practices"

## TC-09: All 6 prompt types produce correct structure
1. Generate a prompt for each type:
   - Project Breakdown → Senior Software Architect
   - Task Description → Senior Project Manager
   - Acceptance Criteria → Senior Business Analyst
   - Code Review → Senior Software Engineer
   - Test Cases → Senior QA Engineer
   - Documentation → Senior Technical Writer
- [ ] Each output has exactly 6 labeled sections
- [ ] Role matches the expected role for that type
- [ ] Output Format matches the default for that type

## TC-10: LocalStorage persistence
1. Select "Documentation" from Prompt Type dropdown
2. Refresh the page (F5)
3. Observe Prompt Type dropdown
- [ ] "Documentation" is still selected after refresh

## TC-11: Responsive layout
1. Open DevTools and resize to 375px width
- [ ] Form fields stack in a single column
- [ ] Buttons are full-width
- [ ] No horizontal scrollbars
- [ ] All text remains readable

## TC-12: Accessible labels
1. Inspect the page with an accessibility checker or screen reader
- [ ] All form inputs have associated `<label>` elements
- [ ] Validation messages use `aria-live="polite"`
- [ ] Toast uses `role="alert"` and `aria-live="assertive"`
- [ ] Output area has `aria-label`
