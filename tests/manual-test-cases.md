# Manual Test Cases — Prompt Builder

## TC-01: Generate prompt with all fields filled
1. Select "Test Cases" from Prompt Type dropdown.
2. Enter "TaskFlow task creation module" as Project Name.
3. Enter "HTML, CSS, JavaScript, LocalStorage" as Tech Stack.
4. Enter "We use a kanban-style board with drag-and-drop" as Context.
5. Enter "Generate detailed manual test cases for task creation" as Main Task.
6. Enter "Do not use automated testing libraries" as Constraints.
7. Enter "Empty fields, missing project, page refresh" as Edge Cases.
8. Click **Generate Prompt**.

**Actual Result:**
- [x] Output area shows all required sections.
- [x] Role displays "Act as a Senior QA Engineer".
- [x] Prompt is generated successfully.

**Status:** ✅ Pass

---

## TC-02: Validation blocks empty required fields
1. Leave Prompt Type as "-- Select a prompt type --".
2. Leave Project Name empty.
3. Leave Main Task empty.
4. Click **Generate Prompt**.

**Actual Result:**
- [x] Red error messages appear under all three required fields.
- [x] No prompt is generated.
- [x] Output area remains unchanged.

**Status:** ✅ Pass

---

## TC-03: Validation blocks partial missing fields
1. Select "Code Review".
2. Enter "Auth module" as Project Name.
3. Leave Main Task empty.
4. Click **Generate Prompt**.

**Actual Result:**
- [ ] Error message appears only under Main Task.
- [ ] No prompt is generated.

**Status:** Not Tested

---

## TC-04: Prompt type changes role and output format
1. Select "Project Breakdown".
2. Select "Documentation".
3. Generate the prompt.

**Actual Result:**
- [x] Role changes to "Senior Technical Writer".
- [x] Prompt format updates correctly.

**Status:** ✅ Pass

---

## TC-05: Copy to clipboard
1. Generate any valid prompt.
2. Click **Copy Prompt**.

**Actual Result:**
- [ ] Green toast appears.
- [ ] Prompt pastes correctly.

**Status:** Not Tested

---

## TC-06: Reset clears everything
1. Fill all fields.
2. Generate a prompt.
3. Click **Clear / Reset**.

**Actual Result:**
- [ ] All fields reset.
- [ ] Placeholder text returns.
- [ ] Copy button disabled.
- [ ] Validation messages cleared.

**Status:** Not Tested

---

## TC-07: Whitespace trimming
1. Enter only spaces in Project Name.
2. Enter only spaces in Main Task.
3. Select a Prompt Type.
4. Click **Generate Prompt**.

**Actual Result:**
- [ ] Validation treats whitespace as empty.

**Status:** Not Tested

---

## TC-08: Optional fields omitted
1. Fill only Prompt Type.
2. Fill Project Name.
3. Fill Main Task.
4. Leave optional fields empty.
5. Click **Generate Prompt**.

**Actual Result:**
- [ ] Prompt generated successfully.
- [ ] Default Context used.
- [ ] Default Constraints used.

**Status:** Not Tested

---

## TC-09: All 6 prompt types produce correct structure
Generate prompts for:
- Project Breakdown
- Task Description
- Acceptance Criteria
- Code Review
- Test Cases
- Documentation

**Actual Result:**
- [ ] Each output contains six sections.
- [ ] Correct role for each prompt type.
- [ ] Correct output format.

**Status:** Partially Tested

---

## TC-10: LocalStorage persistence
1. Select "Documentation".
2. Refresh the page.
3. Return to Prompt Builder.

**Actual Result:**
- [x] Prompt Type remains selected.
- [ ] Other entered fields remain.
- [ ] Generated prompt remains.

**Observation:**
Only the Prompt Type persisted after refresh.

**Status:** ❌ Fail

---

## TC-11: Responsive layout
1. Resize browser to 375px width.

**Actual Result:**
- [ ] Form stacks correctly.
- [ ] Buttons are full width.
- [ ] No horizontal scrolling.
- [ ] Text remains readable.

**Status:** Not Tested

---

## TC-12: Accessible labels
1. Inspect page using accessibility tools.

**Actual Result:**
- [ ] Labels associated with inputs.
- [ ] Validation uses `aria-live="polite"`.
- [ ] Toast uses `role="alert"`.
- [ ] Output area has `aria-label`.

**Status:** Not Tested

---

# Test Summary

| Test Case | Status |
|-----------|--------|
| TC-01 | ✅ Pass |
| TC-02 | ✅ Pass |
| TC-03 | Not Tested |
| TC-04 | ✅ Pass |
| TC-05 | Not Tested |
| TC-06 | Not Tested |
| TC-07 | Not Tested |
| TC-08 | Not Tested |
| TC-09 | Partially Tested |
| TC-10 | ❌ Fail |
| TC-11 | Not Tested |
| TC-12 | Not Tested |