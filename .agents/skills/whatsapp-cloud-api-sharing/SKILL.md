---
name: whatsapp-cloud-api-sharing
description: Direct integration with WhatsApp Cloud API to share media (PDFs/Images) and track usage stats.
---

# WhatsApp Cloud API Sharing Skill

Direct integration with the WhatsApp Cloud API (or compatible provider) to share customer receipts, images, and documents without requiring manual browser automation.

## 🏗️ Architecture

This skill provides a server-side backend integration that directly communicates with WhatsApp APIs to deliver messages and media.

### 🔄 The Sharing Flow:
1.  **Frontend/Client**: Prepares the media (e.g., base64 image or PDF) and recipient mobile number, then posts it to the backend (`/api/whatsapp/send-direct`).
2.  **Backend (Node.js/Express)**:
    *   **Media Upload**: Uploads the raw buffer to the WhatsApp API media endpoint (`/wapp/api/upload/media`) using a `POST` request with `FormData`. Receives a `mediaid`.
    *   **Message Delivery**: Sends a `POST` request to the WhatsApp Business Messages endpoint (`/v2/whatsapp-business/messages`) with the target `mobile`, the generated `mediaid`, and an optional `caption`.
3.  **Analytics & Tracking**: 
    *   Reads and updates local usage statistics (e.g., inside a `.env` file or database) tracking:
        *   `Total Msg Sent`
        *   `Msg Sent Today`
        *   `Remaining Msg Count`
        *   `Last Sent Date`

---

## ⚙️ Configuration & Environment Variables

This skill requires the following environment variables to be set in your backend's `.env` file:

```env
# Required for authentication and routing
WHATSAPP_API_KEY="your_api_key_here"
WHATSAPP_API_HOST="api.yourprovider.com"
WHATSAPP_PHONE_ID="your_phone_number_id_here"

# Statistics (Automatically managed by the script)
Total Msg Sent=0
Msg Sent Today=0
Remaining Msg Count=5000
Last Sent Date=2026-08-20
```

> [!NOTE]
> For local development with self-signed API endpoints, you may need to disable TLS verification temporarily:
> `process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";`

---

## 🧑‍💻 Code Implementation Patterns

### 1. Uploading Media
You must first upload the media to get a `mediaid`. The API typically expects a `multipart/form-data` payload.

```typescript
const buffer = Buffer.from(base64Image.replace(/^data:image\/\w+;base64,/, ""), "base64");
const uploadFormData = new FormData();
const fileBlob = new Blob([buffer]);
uploadFormData.append('file', fileBlob, fileName || 'receipt.jpg');

const uploadRes = await fetch(`https://${apiHost}/wapp/api/upload/media`, {
  method: 'POST',
  headers: { 'X-API-KEY': apiKey },
  body: uploadFormData
});

const uploadData = await uploadRes.json();
const mediaid = uploadData.mediaid || uploadData.id || uploadData.data?.mediaid;
```

### 2. Sending the Message
Once the media is uploaded, use the `mediaid` to send the message.

```typescript
const sendRes = await fetch(`https://${apiHost}/v2/whatsapp-business/messages`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${apiKey}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    to: mobile,
    phoneNoId: process.env.WHATSAPP_PHONE_ID,
    type: "image", // or "document" for PDF
    id: mediaid,
    caption: msg
  })
});
```

---

## 📈 Rate Limiting & Tracking

The implementation natively tracks message counts. When integrating this skill into other applications, ensure you persist these counters. The current implementation parses a `.env` file to increment `Total Msg Sent`, resets `Msg Sent Today` if the `Last Sent Date` rolls over, and decrements `Remaining Msg Count`.
