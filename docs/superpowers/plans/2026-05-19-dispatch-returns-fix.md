# Dispatch and Returns Fix Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Improve Dispatch page input behavior and Return receipt formatting.

**Architecture:** Frontend changes to `Dispatch.tsx` for form logic and `customerReceipt.ts` for PDF/WhatsApp output.

**Tech Stack:** React, TypeScript, jsPDF, jspdf-autotable.

---

### Task 1: Update Dispatch Page Variety Input Behavior

**Files:**
- Modify: `src/pages/Dispatch.tsx`

- [ ] **Step 1: Change variety selection initialization**
  Update the `onChange` handler for the variety `select` to initialize `boxCount` to `''` instead of `'0'`.
  
- [ ] **Step 2: Remove immediate capping in onChange**
  Update the `onChange` handler for the `boxCount` input to remove the logic that caps the value at `companyStock`.
  
- [ ] **Step 3: Update validation logic**
  Update `validateDispatch` to add a check that ensures `boxCount` does not exceed the available stock (company stock for Dispatch, customer stock for Returns).
  
- [ ] **Step 4: Update visual feedback**
  Modify the "Balance Available" display to turn red (using `text-red-600`) if the entered value exceeds the balance.

### Task 2: Update Customer Receipt Formatting

**Files:**
- Modify: `src/utils/customerReceipt.ts`

- [ ] **Step 1: Update PDF Table Format**
  Modify `renderReceiptContent` to update the `returnedBoxesLabel` logic. Ensure it lists varieties in brackets below "Boxes returned" and is correctly handled by `autoTable`.
  
- [ ] **Step 2: Update WhatsApp Summary Format**
  Modify `buildWhatsAppPayload` to match the PDF formatting for returns.

---

## Verification Plan

### Automated Tests
- I will check if there are existing tests for `Dispatch.tsx` or `customerReceipt.ts`. If not, I will focus on manual verification by running the app.

### Manual Verification
1. **Dispatch Mode:**
    - Select a variety. Verify `boxCount` is empty.
    - Enter a number greater than stock. Verify it does NOT jump back to stock.
    - Try to save. Verify it shows a validation error.
    - Enter a valid number and save. Verify success.
2. **Return Mode:**
    - Select a variety.
    - Enter a number greater than what the customer has. Verify it does NOT jump.
    - Try to save. Verify validation error.
    - Save a valid return.
3. **Receipt:**
    - View/Download a receipt for a return with varieties.
    - Verify "Boxes returned" row has varieties in brackets in the left column and total in the right column.
    - Verify WhatsApp message matches this format.
