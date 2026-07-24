# TaskFlow Management System - Version 1.0.0 Release Notes

🎉 **TaskFlow Management System v1.0.0** is officially released!

TaskFlow is a lightweight, browser-based team task management application built during a **2-Day Agentic Development Sprint** by 10 interns.

---

## 🌟 Key Highlights

- **Dashboard & App Layout:** Modern responsive UI with progress cards, statistics, and quick navigation shell.
- **Authentication & Roles:** User selector with session persistence and role-based permissions (`Admin`, `Manager`, `Team Member`).
- **Project Lifecycle Management:** Full CRUD operations for projects with deadline validation and deletion safeguards.
- **Task Management & Creation:** Comprehensive task creation form supporting multi-member assignments, priorities, due dates, and statuses.
- **Kanban Task Board:** Interactive 4-column drag-and-drop board (`Todo`, `In Progress`, `Review`, `Done`) with real-time state persistence.
- **Search, Filter & Sorting:** Multi-filter chaining working seamlessly together with ascending/descending due date sorting.
- **Prompt Builder Section:** Built-in AI prompt assistant supporting 6 software engineering prompt categories.
- **Team Members & Workload:** Member management with auto-generated avatars, assigned task counts, and safe deletion checks.
- **Responsible AI Compliance:** Complete transparency log in `AI_usage_report.md` detailing prompts, AI mistakes, manual fixes, and token estimates.

---

## 👥 Intern Team Roster & Module Ownership

| # | Intern Owner | Module Assigned | GitHub Profile |
|---|---|---|---|
| 1 | **Maryam** | Project Setup and App Layout | [@meowryam](https://github.com/meowryam) |
| 2 | **Salman Ahmed** | Authentication / User Selector | [@Salman-ahmed-2](https://github.com/Salman-ahmed-2) |
| 3 | **Laiba Inqilab Patel** | Project Management | [@laibainqilab-ds](https://github.com/laibainqilab-ds) |
| 4 | **Abihaj Ibbran** | Task Creation | [@abihajibbran1-lang](https://github.com/abihajibbran1-lang) |
| 5 | **Muhammad Bilal** | Task Board | [@Bilalmughal-07](https://github.com/Bilalmughal-07) |
| 6 | **Abdul Azeem Hashmi** | Documentation and Release Prep | [@AbdulAzeemHashmi](https://github.com/AbdulAzeemHashmi) |
| 7 | **Taha Sohail** | Search, Filter and Sorting | [@TahaSohail-Goat](https://github.com/TahaSohail-Goat) |
| 8 | **Hassaan Ahmed** | Prompt Builder and Responsible AI | [@hassaanahmed-dev](https://github.com/hassaanahmed-dev) |
| 9 | **Inshrah Mumtaz** | QA and Manual Testing | [@inshrahmumtaz](https://github.com/inshrahmumtaz) |
| 10 | **Muhammad Haris** | Team Members | [@muhammad-haris2](https://github.com/muhammad-haris2) |

---

## 🚀 Quick Start Guide

```bash
# Clone repository
git clone https://github.com/meowryam/taskflow-management-system.git
cd taskflow-management-system

# Serve locally
python3 -m http.server 8000
# Open http://localhost:8000/index.html
```

---

## 📄 License

This project is licensed under the MIT License - see the `LICENSE` file for details.
