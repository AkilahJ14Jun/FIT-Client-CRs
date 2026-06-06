# Update Dispatch Page Variety Input Behavior Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Improve variety box count input behavior by preventing immediate capping (jumping) and using validation on save instead.

**Architecture:**
- Change initial `boxCount` value from `'0'` to `''` when a variety is selected.
- Allow any numeric input in `boxCount` `onChange` without capping to available stock.
- Implement stock validation in `validateDispatch` to show error messages if quantity exceeds available stock.
- Update UI to highlight available stock in red/bold when exceeded.

**Tech Stack:** React, TypeScript, Tailwind CSS

---

### Task 1: Update Variety Initialization and Change Handler

**Files:**
- Modify: `src/pages/Dispatch.tsx`

- [ ] **Step 1: Change variety selection initialization**
  Locate the variety `select` `onChange` handler (around line 962) and change `boxCount: '0'` to `boxCount: ''`.

- [ ] **Step 2: Remove immediate capping in onChange**
  Locate the `boxCount` input `onChange` handler (around line 990) and remove the logic that caps `finalVal` to `companyStock`.

---

### Task 2: Implement Validation Logic

**Files:**
- Modify: `src/pages/Dispatch.tsx`

- [ ] **Step 1: Add stock validation in validateDispatch**
  Update `validateDispatch` to check if `parseInt(r.boxCount)` exceeds available stock for each row. Use the same logic as the render block to determine `stock`.

---

### Task 3: Update Visual Feedback

**Files:**
- Modify: `src/pages/Dispatch.tsx`

- [ ] **Step 1: Highlight exceeded stock**
  Update the rendering of "Balance Available" to use `text-red-600 font-bold` when `parseInt(row.boxCount) > stock`.

---

### Task 4: Final Review

- [ ] **Step 1: Verify all changes**
  Review the file to ensure all requested changes are implemented correctly and follow existing styles.
