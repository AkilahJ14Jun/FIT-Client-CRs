# Dispatch and Returns Fix Design

## Goal
Improve the user experience on the Dispatch page by preventing automatic value jumps in variety counts and enhancing the display of returns on the customer receipt.

## Proposed Changes

### 1. Dispatch Page / Entry Mode
- **Variety Count Initialization:** When a variety is selected in Dispatch or Return mode, the `boxCount` field will be initialized to an empty string `''` instead of `'0'`.
- **Typing Behavior:** Remove the immediate capping of the `boxCount` value against available stock in the `onChange` handler. This prevents the value from "jumping" back to the stock balance while the user is typing.
- **Validation:** 
    - Update `validateDispatch` to check if any variety's `boxCount` exceeds the `varietyStock` (for Dispatch) or `historicalSummary.varietyTotals` (for Returns).
    - If the value exceeds stock, an error message will be shown, and the form will not save.
- **Visual Feedback:** 
    - The "Balance Available" text will turn red if the entered value exceeds the available stock.

### 2. Customer Receipt (Returns)
- **PDF Table Format:**
    - For `return` entry types, the "Boxes returned" row will be formatted as requested:
        - **Left Column:** `Boxes returned\n(Variety A: 5, Variety B: 10, ...)`
        - **Right Column:** Total count (e.g., `15`)
- **WhatsApp Summary:**
    - Update the WhatsApp message text to match the PDF table formatting for returns.

## Success Criteria
- Variety counts do not jump to stock balance while typing.
- Users cannot save an entry if the variety count exceeds available stock.
- Customer receipts for returns clearly list individual variety counts in the left column and the total in the right column.
