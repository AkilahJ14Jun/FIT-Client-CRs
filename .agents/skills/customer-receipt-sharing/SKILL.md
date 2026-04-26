---
name: customer-receipt-sharing
description: Application-level logic for generating PDF receipts and sharing them via the custom 'fitshare' WhatsApp automation protocol.
---

# Customer Receipt Sharing Skill

This skill defines the logic for generating customer-facing receipts and bridging them to the WhatsApp automation system.

## 🏗️ Architecture

The sharing flow is a two-step process that ensures the recipient receives a professional PDF rather than just a text message.

### 🔄 The Sharing Flow:
1.  **PDF Generation**: A high-fidelity PDF is generated in the browser using `jsPDF`.
2.  **Download**: The PDF is triggered for download to the user's local machine.
3.  **Protocol Trigger**: The app navigates to a custom protocol: `fitshare://send?phone=<phone>&file=<filename>`.
4.  **Automation**: The local machine's `whatsapp-zero-api-sharing` handler (PowerShell) picks up the request, finds the PDF in `Downloads`, and pastes it into WhatsApp Web.

---

## 📘 Receipt Format (AS BROS / MC & SONS)

The receipt is designed to match a specific physical bill format:
- **Header**: Centered company name and address in a thick-bordered box.
- **Table**: 5-row table covering:
    - Previous Balance Box
    - Today's Fish Box
    - Total Box
    - Empty Box (Manual Entry)
    - Total Balance Box
- **Footer**: Dynamic "Variety" notes (external sources) and "AS & Bros Box" count.

---

## 🛠️ Implementation Details

### Data Models
Located at: `src/utils/customerReceipt.ts`

- **`WhatsAppPayload`**: Contains `phone`, `messageText`, `pdfFilename`, and `fitshareUrl`.
- **`fitshareUrl` Builder**:
  ```typescript
  const fitshareUrl = `fitshare://send?phone=${encodeURIComponent(phone)}&file=${encodeURIComponent(pdfFilename)}`;
  ```

### Key Functions
- **`downloadReceiptAsPDF`**: Generates and triggers the file download.
- **`buildWhatsAppPayload`**: Formats the text summary and constructs the protocol URL.
- **`triggerWhatsAppAutomation`**: The master function that orchestrates the download and the protocol jump.

---

## 📑 Integration Flow

To share a receipt from a UI component:

```typescript
import { shareReceiptViaWhatsApp } from '@/utils/customerReceipt';

const handleShare = async (entry, customer) => {
  await shareReceiptViaWhatsApp(entry, customer);
};
```

---

## ⚙️ Dependencies

- **Mechanism**: Requires the `whatsapp-zero-api-sharing` skill to be installed and registered on the host machine.
- **Libraries**: `jsPDF`, `jspdf-autotable`, `date-fns`.

---

## ❓ Troubleshooting

### "The PDF downloads but WhatsApp doesn't open"
- **Reason**: The `fitshare://` protocol is not registered on the Windows OS.
- **Solution**: Refer to the `whatsapp-zero-api-sharing` skill documentation for registration steps.

### "The message is shared but without the PDF"
- **Reason**: The PDF filename in the protocol URL does not match the actual downloaded file.
- **Solution**: Ensure `receiptFilename(entry)` is used consistently in both the download and the payload builder.
