# AI Usage Report

This document records AI-assisted development throughout the project.

Each contributor must document:

- AI tool used
- Prompting techniques
- Prompt used
- AI mistakes
- Manual corrections
- Token usage

---

## Intern: Taha Sohail

### Module: Search, Filter & Sorting

| Field | Details |
|---|---|
| **AI Tool** | Cursor (opencode CLI agent) |
| **Prompting Techniques** | Role-based (senior backend engineer), Context-rich (full repo structure provided), Constraint-based (no frontend, no libraries, edge cases required) |
| **Prompt Used** | "Act as a senior backend engineer. Create a beginner-friendly but scalable module for a task management system. Use clear naming, avoid unnecessary libraries, include edge cases, and explain how to test the module manually. Use proper backend logic with no errors." |
| **AI Mistake** | Used ES6 import/export syntax which requires a bundler; not compatible with plain browser script tags |
| **Manual Fix** | Rewrote using IIFE (Immediately Invoked Function Expression) pattern for direct browser compatibility |
| **Tokens Used** | N/A |