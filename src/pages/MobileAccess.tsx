// FIT – Mobile Access Guide
// Explains all methods to access the FIT app on a mobile device

import React, { useState } from 'react';
import {
  Smartphone, Wifi, Globe, Share2, BookOpen,
  CheckCircle2, AlertTriangle, Monitor, Server,
  ChevronDown, ChevronUp, Copy, ExternalLink,
} from 'lucide-react';

interface StepProps {
  number: number;
  title: string;
  children: React.ReactNode;
}

const Step: React.FC<StepProps> = ({ number, title, children }) => (
  <div className="flex gap-4">
    <div className="shrink-0 w-8 h-8 rounded-full bg-blue-900 text-white flex items-center justify-center text-sm font-bold">
      {number}
    </div>
    <div className="flex-1 pb-6 border-l border-blue-100 pl-4 -ml-4 ml-0">
      <p className="font-semibold text-gray-800 mb-1">{title}</p>
      <div className="text-sm text-gray-600 space-y-1">{children}</div>
    </div>
  </div>
);

interface MethodCardProps {
  icon: React.ReactNode;
  title: string;
  badge: string;
  badgeColor: string;
  difficulty: string;
  difficultyColor: string;
  description: string;
  steps: React.ReactNode;
  defaultOpen?: boolean;
}

const MethodCard: React.FC<MethodCardProps> = ({
  icon, title, badge, badgeColor, difficulty, difficultyColor,
  description, steps, defaultOpen = false
}) => {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
      <button
        className="w-full flex items-center gap-4 px-5 py-4 bg-white hover:bg-gray-50 transition-colors text-left"
        onClick={() => setOpen(v => !v)}
      >
        <div className="shrink-0 w-11 h-11 rounded-xl bg-blue-50 flex items-center justify-center text-blue-800">
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-0.5">
            <p className="font-semibold text-gray-800">{title}</p>
            <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${badgeColor}`}>{badge}</span>
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${difficultyColor}`}>{difficulty}</span>
          </div>
          <p className="text-xs text-gray-500 truncate">{description}</p>
        </div>
        {open ? <ChevronUp size={16} className="text-gray-400 shrink-0" /> : <ChevronDown size={16} className="text-gray-400 shrink-0" />}
      </button>
      {open && (
        <div className="px-5 pb-5 pt-1 bg-gray-50 border-t border-gray-100 text-sm text-gray-700 space-y-3">
          {steps}
        </div>
      )}
    </div>
  );
};

const Code: React.FC<{ children: string }> = ({ children }) => {
  const [copied, setCopied] = useState(false);
  return (
    <span className="inline-flex items-center gap-1.5">
      <code className="bg-gray-800 text-green-300 px-2 py-0.5 rounded text-xs font-mono">
        {children}
      </code>
      <button
        onClick={() => { navigator.clipboard.writeText(children).catch(() => {}); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
        className="text-gray-400 hover:text-gray-600"
        title="Copy"
      >
        {copied ? <CheckCircle2 size={12} className="text-green-500" /> : <Copy size={12} />}
      </button>
    </span>
  );
};

export const MobileAccess: React.FC = () => {
  return (
    <div className="max-w-3xl mx-auto space-y-6">

      {/* Hero */}
      <div className="rounded-2xl bg-gradient-to-br from-blue-900 to-blue-700 text-white p-6 flex gap-4 items-start">
        <div className="shrink-0 w-14 h-14 bg-white/15 rounded-2xl flex items-center justify-center">
          <Smartphone size={28} />
        </div>
        <div>
          <h1 className="text-xl font-bold mb-1">Access FIT on Mobile</h1>
          <p className="text-blue-200 text-sm leading-relaxed">
            The FIT application is a single HTML file. This guide shows you every way to open it
            on your phone or tablet — from the simplest method (USB cable) to a full local Wi-Fi
            server so everyone on the same network can use it simultaneously.
          </p>
        </div>
      </div>

      {/* Quick Answer Banner */}
      <div className="rounded-xl bg-emerald-50 border border-emerald-200 px-5 py-4 flex gap-3 items-start">
        <CheckCircle2 size={20} className="text-emerald-600 shrink-0 mt-0.5" />
        <div>
          <p className="font-semibold text-emerald-800 text-sm">Quickest method (no technical knowledge needed)</p>
          <p className="text-emerald-700 text-sm mt-0.5">
            Copy the <strong>index.html</strong> file to your phone via WhatsApp / USB, then open it in
            Chrome or Safari. Done — the full app works offline on your phone.
          </p>
        </div>
      </div>

      {/* What is the file */}
      <div className="rounded-xl bg-blue-50 border border-blue-200 px-5 py-4 text-sm text-blue-800">
        <p className="font-semibold mb-1">📁 What is the app file?</p>
        <p>
          After building, the entire FIT application lives in one file: <strong>dist/index.html</strong>
          &nbsp;(or wherever you were given the file). It contains all screens, logic, and data storage
          inside a single file — no internet connection required once you have the file.
        </p>
      </div>

      {/* Methods */}
      <div className="space-y-3">
        <h2 className="text-base font-bold text-gray-700 uppercase tracking-wide px-1">
          Choose Your Method
        </h2>

        {/* Method 1 — WhatsApp/Email file transfer */}
        <MethodCard
          icon={<Share2 size={22} />}
          title="Send file via WhatsApp or Email"
          badge="⭐ Recommended"
          badgeColor="bg-emerald-100 text-emerald-800"
          difficulty="Easiest"
          difficultyColor="bg-green-100 text-green-700"
          description="Share the index.html file to your phone using WhatsApp — no cables needed"
          defaultOpen={true}
          steps={
            <div className="space-y-4">
              <div className="rounded-lg bg-white border border-gray-200 p-4 space-y-3">
                <Step number={1} title="Locate the app file on your computer">
                  <p>Find the file called <strong>index.html</strong> in the <strong>dist</strong> folder of your project,
                  or wherever the FIT application file was saved on your computer.</p>
                </Step>
                <Step number={2} title="Send it to yourself on WhatsApp">
                  <p>Open WhatsApp on your computer → click on your own chat (or any chat) →
                  attach the <strong>index.html</strong> file and send it.</p>
                </Step>
                <Step number={3} title="Open WhatsApp on your phone">
                  <p>Open the chat where you sent the file. Tap the attachment to <strong>download</strong> it
                  to your phone storage.</p>
                </Step>
                <Step number={4} title="Open the file in Chrome or Safari">
                  <p>On Android: open the <strong>Files</strong> or <strong>Downloads</strong> app → tap <strong>index.html</strong>
                  → choose <strong>Chrome</strong> to open it.</p>
                  <p>On iPhone: tap the file in WhatsApp → tap the <strong>Share</strong> icon →
                  <strong>Open in Safari</strong> or <strong>Open in Chrome</strong>.</p>
                </Step>
                <Step number={5} title="Bookmark it for quick access">
                  <p>In Chrome: tap ⋮ → <strong>Add to Home screen</strong>. The app icon will appear on your
                  phone like a regular app!</p>
                  <p>In Safari: tap Share → <strong>Add to Home Screen</strong>.</p>
                </Step>
              </div>
              <div className="rounded-lg bg-amber-50 border border-amber-200 p-3 flex gap-2 text-xs text-amber-800">
                <AlertTriangle size={14} className="shrink-0 mt-0.5" />
                <p><strong>Note:</strong> Data is saved locally on each device separately. If you use the app on both
                your phone and computer, the data won't sync automatically — use the <strong>Backup/Restore</strong>
                feature in Settings to move data between devices.</p>
              </div>
            </div>
          }
        />

        {/* Method 2 — USB Cable */}
        <MethodCard
          icon={<Monitor size={22} />}
          title="Copy via USB Cable"
          badge="Offline"
          badgeColor="bg-gray-100 text-gray-700"
          difficulty="Easy"
          difficultyColor="bg-blue-100 text-blue-700"
          description="Connect your phone to your computer with a USB cable and copy the file"
          steps={
            <div className="space-y-4">
              <div className="rounded-lg bg-white border border-gray-200 p-4 space-y-3">
                <Step number={1} title="Connect phone to computer via USB">
                  <p>Use your phone's charging cable to connect it to your computer.</p>
                </Step>
                <Step number={2} title="Allow File Transfer on your phone">
                  <p><strong>Android:</strong> A notification appears — tap it and select <strong>"File Transfer" / "MTP"</strong>.</p>
                  <p><strong>iPhone:</strong> Tap <strong>"Trust"</strong> on the iPhone screen, then open
                  <strong>iTunes / Finder</strong> on the computer.</p>
                </Step>
                <Step number={3} title="Copy index.html to your phone">
                  <p><strong>Android:</strong> Open File Explorer on the computer → find your phone → copy
                  <strong>index.html</strong> to the phone's <strong>Downloads</strong> folder.</p>
                  <p><strong>iPhone:</strong> Use iTunes/Finder → File Sharing → drop the file into a compatible app's folder.</p>
                </Step>
                <Step number={4} title="Open in Chrome / Safari">
                  <p>On Android: open the <strong>Files</strong> app → Downloads → tap <strong>index.html</strong> → open in Chrome.</p>
                  <p>On iPhone: navigate to the file using the <strong>Files</strong> app and open it.</p>
                </Step>
              </div>
            </div>
          }
        />

        {/* Method 3 — Local Wi-Fi server */}
        <MethodCard
          icon={<Wifi size={22} />}
          title="Local Wi-Fi Server (npx serve)"
          badge="Best for Teams"
          badgeColor="bg-blue-100 text-blue-800"
          difficulty="Intermediate"
          difficultyColor="bg-yellow-100 text-yellow-700"
          description="Run a local web server so all phones on the same Wi-Fi can access the app at once"
          steps={
            <div className="space-y-4">
              <div className="rounded-lg bg-white border border-gray-200 p-4 space-y-3">
                <Step number={1} title="Make sure Node.js is installed on your computer">
                  <p>Download from <strong>nodejs.org</strong> if not already installed. Verify by opening
                  a terminal and typing <Code>node --version</Code></p>
                </Step>
                <Step number={2} title="Open a terminal / command prompt">
                  <p><strong>Windows:</strong> Press <kbd className="px-1 py-0.5 bg-gray-200 rounded text-xs">Win+R</kbd> → type <strong>cmd</strong> → Enter</p>
                  <p><strong>Mac:</strong> Open <strong>Terminal</strong> from Applications → Utilities</p>
                </Step>
                <Step number={3} title="Navigate to the folder containing index.html">
                  <p>Type: <Code>cd path/to/your/dist/folder</Code></p>
                  <p>Example: <Code>cd C:\Users\YourName\FIT\dist</Code></p>
                </Step>
                <Step number={4} title="Start the web server">
                  <p>Type: <Code>npx serve .</Code></p>
                  <p>You'll see output like: <code className="text-xs bg-gray-100 px-1 rounded">Local: http://localhost:3000</code></p>
                </Step>
                <Step number={5} title="Find your computer's local IP address">
                  <p><strong>Windows:</strong> Open a new terminal → type <Code>ipconfig</Code> → look for <strong>IPv4 Address</strong> (e.g. 192.168.1.5)</p>
                  <p><strong>Mac:</strong> Open terminal → type <Code>ipconfig getifaddr en0</Code></p>
                </Step>
                <Step number={6} title="Open the app on your phone">
                  <p>Make sure your phone is connected to the <strong>same Wi-Fi</strong> as your computer.</p>
                  <p>Open Chrome on your phone → type: <Code>http://192.168.1.5:3000</Code>
                  (replace with your actual IP address)</p>
                </Step>
                <Step number={7} title="Bookmark for easy access">
                  <p>Tap ⋮ in Chrome → <strong>Add to Home Screen</strong> to create an app shortcut.</p>
                </Step>
              </div>
              <div className="rounded-lg bg-blue-50 border border-blue-200 p-3 flex gap-2 text-xs text-blue-800">
                <CheckCircle2 size={14} className="shrink-0 mt-0.5" />
                <p><strong>Advantage:</strong> Multiple devices (phones, tablets, computers) can all use the app
                simultaneously as long as they're on the same Wi-Fi. Keep the terminal window open while using the app.</p>
              </div>
            </div>
          }
        />

        {/* Method 4 — Cloud hosting */}
        <MethodCard
          icon={<Globe size={22} />}
          title="Cloud Hosting (Netlify Drop)"
          badge="Anywhere Access"
          badgeColor="bg-purple-100 text-purple-800"
          difficulty="Easy"
          difficultyColor="bg-green-100 text-green-700"
          description="Upload the file to Netlify Drop — get a URL you can open from any device, anywhere"
          steps={
            <div className="space-y-4">
              <div className="rounded-lg bg-white border border-gray-200 p-4 space-y-3">
                <Step number={1} title="Go to Netlify Drop in your browser">
                  <p>On your computer, open: <a href="https://app.netlify.com/drop" target="_blank" rel="noopener noreferrer"
                    className="text-blue-600 underline inline-flex items-center gap-1">
                    app.netlify.com/drop <ExternalLink size={11} />
                  </a></p>
                </Step>
                <Step number={2} title="Drag and drop the index.html file">
                  <p>Drag your <strong>index.html</strong> (from the <strong>dist</strong> folder) onto the
                  blue drop zone on the Netlify page.</p>
                </Step>
                <Step number={3} title="Wait for upload to complete">
                  <p>Netlify will generate a unique URL like:
                  <code className="text-xs bg-gray-100 px-1 rounded ml-1">https://random-name-123.netlify.app</code></p>
                </Step>
                <Step number={4} title="Open the URL on any device">
                  <p>Share this URL via WhatsApp, email or QR code. Anyone with the link can open
                  the app from any browser, on any device, anywhere in the world.</p>
                </Step>
                <Step number={5} title="Add to Home Screen for app-like experience">
                  <p>On mobile Chrome: tap ⋮ → <strong>Add to Home Screen</strong></p>
                  <p>On mobile Safari: tap Share → <strong>Add to Home Screen</strong></p>
                </Step>
              </div>
              <div className="rounded-lg bg-amber-50 border border-amber-200 p-3 flex gap-2 text-xs text-amber-800">
                <AlertTriangle size={14} className="shrink-0 mt-0.5" />
                <p><strong>Privacy note:</strong> The app file will be publicly accessible at that URL.
                Data is stored in each device's browser localStorage — it is NOT shared between devices via the cloud.
                For business data privacy, prefer the Wi-Fi server method instead.</p>
              </div>
            </div>
          }
        />

        {/* Method 5 — Production server */}
        <MethodCard
          icon={<Server size={22} />}
          title="Dedicated Web Server (Production)"
          badge="For IT Teams"
          badgeColor="bg-red-100 text-red-800"
          difficulty="Advanced"
          difficultyColor="bg-red-100 text-red-700"
          description="Deploy to Nginx / Apache on a local or cloud server for permanent team-wide access"
          steps={
            <div className="space-y-4">
              <div className="rounded-lg bg-white border border-gray-200 p-4 space-y-3">
                <Step number={1} title="Set up a web server">
                  <p><strong>Option A — Local server (Raspberry Pi / old PC):</strong></p>
                  <p>Install Nginx: <Code>sudo apt install nginx</Code></p>
                  <p><strong>Option B — Cloud VPS (DigitalOcean, AWS, etc.):</strong></p>
                  <p>Create a $5/month droplet and install Nginx.</p>
                </Step>
                <Step number={2} title="Copy index.html to the web root">
                  <p><Code>sudo cp dist/index.html /var/www/html/index.html</Code></p>
                </Step>
                <Step number={3} title="Start Nginx">
                  <p><Code>sudo systemctl start nginx</Code></p>
                </Step>
                <Step number={4} title="Access from any device">
                  <p>All devices on the same network (or internet if cloud) can access:
                  <Code>http://YOUR-SERVER-IP/</Code></p>
                </Step>
              </div>
              <div className="rounded-lg bg-blue-50 border border-blue-200 p-3 flex gap-2 text-xs text-blue-800">
                <BookOpen size={14} className="shrink-0 mt-0.5" />
                <p>See the full <strong>Deployment Guide</strong> page in this app for complete step-by-step
                instructions including HTTPS setup, domain name configuration, and backup automation.</p>
              </div>
            </div>
          }
        />
      </div>

      {/* PDF on Mobile note */}
      <div className="rounded-2xl bg-gray-50 border border-gray-200 p-5 space-y-3">
        <h2 className="font-bold text-gray-800 flex items-center gap-2">
          🖨️ Printing / Saving PDF Receipts on Mobile
        </h2>
        <p className="text-sm text-gray-600">
          When you tap <strong>"Print Receipt PDF"</strong> in the app on your phone:
        </p>
        <div className="space-y-2">
          {[
            { platform: 'Android (Chrome)', steps: 'The print dialog opens → tap the printer icon → change destination to "Save as PDF" → tap Save → choose where to save the file.' },
            { platform: 'iPhone (Safari)', steps: 'The share sheet appears → scroll down → tap "Print" → pinch to zoom on the preview → this opens the PDF → tap Share → "Save to Files".' },
            { platform: 'iPhone (Chrome)', steps: 'Print dialog opens → tap "Save as PDF" → choose save location.' },
          ].map(({ platform, steps }) => (
            <div key={platform} className="rounded-lg bg-white border border-gray-200 p-3">
              <p className="text-xs font-bold text-blue-800 mb-1">{platform}</p>
              <p className="text-xs text-gray-600">{steps}</p>
            </div>
          ))}
        </div>
      </div>

      {/* WhatsApp sharing note */}
      <div className="rounded-2xl bg-green-50 border border-green-200 p-5">
        <h2 className="font-bold text-green-800 flex items-center gap-2 mb-2">
          💬 WhatsApp Sharing on Mobile
        </h2>
        <p className="text-sm text-green-700">
          The <strong>"Share via WhatsApp"</strong> button works directly on mobile — it opens
          WhatsApp with the receipt summary pre-filled. Choose the customer's contact and tap Send.
          This works on both Android and iPhone with WhatsApp installed.
        </p>
      </div>

      {/* Data sync note */}
      <div className="rounded-2xl bg-amber-50 border border-amber-200 p-5">
        <h2 className="font-bold text-amber-800 flex items-center gap-2 mb-2">
          <AlertTriangle size={16} /> Important: Data Storage
        </h2>
        <p className="text-sm text-amber-700 mb-2">
          FIT stores all data in the browser's <strong>localStorage</strong> on each device. This means:
        </p>
        <ul className="text-sm text-amber-700 space-y-1 list-disc list-inside">
          <li>Data entered on your computer stays on your computer</li>
          <li>Data entered on your phone stays on your phone</li>
          <li>To move data between devices, use <strong>Settings → Backup Data</strong> to export a JSON file,
          then <strong>Settings → Restore Data</strong> on the other device</li>
          <li>For true multi-device sync, use the <strong>Wi-Fi server</strong> or <strong>cloud hosting</strong> method above</li>
        </ul>
      </div>

    </div>
  );
};
