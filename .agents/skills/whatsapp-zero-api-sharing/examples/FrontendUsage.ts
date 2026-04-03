/**
 * Example TypeScript integration for the WhatsApp Zero-API Sharing Skill.
 *
 * This function triggers the custom `fitshare://` protocol which activates
 * the PowerShell automation to share a PDF file.
 */

interface WhatsAppPayload {
  phone: string;
  pdfFilename: string;
}

/**
 * Triggers the local automation via the custom protocol.
 * 
 * @param payload The phone number and filename to be shared.
 */
export function triggerWhatsAppAutomation(payload: WhatsAppPayload): void {
  // 1. Construct the custom protocol URL
  // The phone number and filename must be URL-encoded for safety.
  const protocolUrl = `fitshare://send?phone=${encodeURIComponent(payload.phone)}&file=${encodeURIComponent(payload.pdfFilename)}`;

  console.log('🔌 Triggering WhatsApp Automation:', protocolUrl);

  // 2. Trigger the OS level protocol handler
  // window.location.assign is used to ensure it's not blocked by popup blockers.
  window.location.assign(protocolUrl);
}

// ─── USAGE EXAMPLE ──────────────────────────────────────────────────────────

/*
  const payload = {
    phone: "+919876543210",
    pdfFilename: "Receipt_INV-123_20240402.pdf"
  };

  // Ensure the PDF is already downloaded to the user's Downloads folder
  // before calling this automation.
  triggerWhatsAppAutomation(payload);
*/
