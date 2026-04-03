# WhatsApp Zero-API Sharing Skill

Automated PDF sharing via WhatsApp Web without official APIs using PowerShell, custom protocols, and Win32 window automation.

## 🏗️ Architecture

This skill provides a bridge between a web application and a local Windows machine. It uses several layers of technology to overcome the limitations of the standard web browser and WhatsApp URL schemes.

### 🔄 The Sharing Flow:
1.  **Web App (Browser)**: Triggers a custom protocol: `fitshare://send?phone=...&file=...`.
2.  **Windows OS**: Recognizes the `fitshare` protocol and launches **PowerShell** with the configured handler script.
3.  **PowerShell Handler**:
    *   **Registry/Security**: Runs in a hidden window (`-WindowStyle Hidden`) used to manage the file system and clipboard.
    *   **File Management**: Moves the target PDF from the user's `Downloads` folder to a designated `FIT Reports` directory.
    *   **Clipboard**: Prepares the target file in the Windows `FileDropList` format (mimicking a manual "Copy File").
4.  **Win32 Automation**:
    *   Searches for an active **WhatsApp Web** tab/window using `EnumWindows`.
    *   Focuses the browser window without disruptive resizing.
    *   Simulates human-like keystrokes (`Ctrl+Alt+/`, `Ctrl+V`, `Enter`) to find the contact and paste the PDF into the chat.

---

## 📘 User Guide

### 🛠️ System Preparation (Administrator Once)
To use this sharing feature, you must register the protocol handler and apply browser policies to suppress security prompts.

1.  Open **PowerShell as Administrator**.
2.  Navigate to the `scripts/` directory of this skill.
3.  Run the registration script:
    ```powershell
    & ".\RegisterProtocol.ps1"
    ```
4.  **Verify**: Open Microsoft Edge and check if `fitshare://test` launches successfully.

### 🌐 Browser Support
- **Microsoft Edge (Recommended)**: Fully supported with automatic prompt bypass via policy.
- **Google Chrome**: Fully supported with automatic prompt bypass via policy.

### 📑 Usage Instructions
- **Scenario**: You've generated a receipt PDF in your app.
- **Action**: Click "Share on WhatsApp".
- **Result**:
    - The PDF "downloads" to your machine.
    - WhatsApp Web is focused (or opened if not found).
    - The PDF is automatically pasted into the contact's chat.
    - **Note**: For 100% reliable tab reuse, keep WhatsApp as the **active tab** in your browser, or install it as a **PWA (App)**.

---

## ⚙️ Configuration & Maintenance

- **Log Location**: `g:\bobby\GitHub\FIT OpBal Fix - Copy\scripts\automation_debug.log`
- **File Directory**: `~\Downloads\FIT Reports`
- **Browser Policies**: These are set in `HKLM:\SOFTWARE\Policies\Microsoft\Edge` and `...Google\Chrome`.

---

## ❓ Troubleshooting

### "It opens a new tab every time"
**Reason**: The OS cannot "see" background tabs in a browser. It only sees the title of the *active* tab.
**Fix**: Ensure your WhatsApp Web tab was the last one you looked at in that browser window, or use the WhatsApp PWA app.

### "Nothing happens when I click Share"
**Reason**: The protocol was not registered, or the path to the PowerShell script is incorrect.
**Fix**: Re-run `RegisterProtocol.ps1` as Administrator.
