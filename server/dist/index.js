"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const data_source_1 = require("./data-source");
const Customer_1 = require("./entity/Customer");
const InventorySource_1 = require("./entity/InventorySource");
const BoxEntry_1 = require("./entity/BoxEntry");
const AppSettings_1 = require("./entity/AppSettings");
const AuditLog_1 = require("./entity/AuditLog");
const CustomerArea_1 = require("./entity/CustomerArea");
const User_1 = require("./entity/User");
const typeorm_1 = require("typeorm");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const app = (0, express_1.default)();
app.use((0, cors_1.default)());
app.use(express_1.default.json({ limit: '50mb' }));
app.use(express_1.default.urlencoded({ limit: '50mb', extended: true }));
// ─── Error Handling & Logging ────────────────────────────────
// Helper to wrap async routes and catch errors
const catchAsync = (fn) => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch((err) => {
        console.error(`[API Error] ${req.method} ${req.path}:`, err);
        next(err);
    });
};
// Global process-level error logging
process.on("unhandledRejection", (reason, promise) => {
    console.error("[Fatal] Unhandled Rejection at:", promise, "reason:", reason);
});
process.on("uncaughtException", (err) => {
    console.error("[Fatal] Uncaught Exception:", err);
    // We don't exit here to let nodemon handle restarts if needed, 
    // but now we at least see WHY it crashed.
});
// Helper to log audit
function logAudit(action, entity, entityId, summary) {
    return __awaiter(this, void 0, void 0, function* () {
        const auditRepo = data_source_1.AppDataSource.getRepository(AuditLog_1.AuditLog);
        const log = new AuditLog_1.AuditLog();
        log.action = action;
        log.entity = entity;
        log.entityId = entityId;
        log.summary = summary;
        yield auditRepo.save(log);
    });
}
// ─── Settings Routes ─────────────────────────────────────────
app.get("/api/settings", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const repo = data_source_1.AppDataSource.getRepository(AppSettings_1.AppSettings);
    let settings = yield repo.findOne({ where: {} });
    if (!settings) {
        settings = repo.create();
        yield repo.save(settings);
    }
    res.json(settings);
}));
app.put("/api/settings", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const repo = data_source_1.AppDataSource.getRepository(AppSettings_1.AppSettings);
    let settings = yield repo.findOne({ where: {} });
    if (!settings)
        settings = repo.create();
    Object.assign(settings, req.body);
    yield repo.save(settings);
    res.json(settings);
}));
// ─── Customer Routes ─────────────────────────────────────────
app.get("/api/customers", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const repo = data_source_1.AppDataSource.getRepository(Customer_1.Customer);
    const customers = yield repo.find({ order: { customerName: "ASC" } });
    res.json(customers);
}));
app.get("/api/customers/:id", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const repo = data_source_1.AppDataSource.getRepository(Customer_1.Customer);
    const customer = yield repo.findOneBy({ id: req.params.id });
    if (!customer)
        return res.status(404).json({ error: "Not found" });
    res.json(customer);
}));
app.post("/api/customers", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const repo = data_source_1.AppDataSource.getRepository(Customer_1.Customer);
    const customer = repo.create(req.body);
    yield repo.save(customer);
    yield logAudit("CREATE", "Customer", customer.id, `Created customer: ${customer.customerName}`);
    res.json(customer);
}));
app.put("/api/customers/:id", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const repo = data_source_1.AppDataSource.getRepository(Customer_1.Customer);
    let customer = yield repo.findOneBy({ id: req.params.id });
    if (!customer)
        return res.status(404).json({ error: "Not found" });
    Object.assign(customer, req.body);
    yield repo.save(customer);
    yield logAudit("UPDATE", "Customer", customer.id, `Updated customer: ${customer.customerName}`);
    res.json(customer);
}));
app.delete("/api/customers/:id", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const repo = data_source_1.AppDataSource.getRepository(Customer_1.Customer);
    const customer = yield repo.findOneBy({ id: req.params.id });
    if (!customer)
        return res.status(404).json({ error: "Not found" });
    yield repo.remove(customer);
    yield logAudit("DELETE", "Customer", req.params.id, `Deleted customer: ${customer.customerName}`);
    res.json({ success: true });
}));
// ─── Direct WhatsApp Share Helpers ───────────────────────────
// Formats timestamp including seconds: YYYY-MM-DD HH:mm:ss
function formatLogTimestamp(d = new Date()) {
    const pad = (n) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}
// Write to WA_FIT.log in the server folder
function writeWaFitLog(entry) {
    try {
        const logPath = path_1.default.resolve(__dirname, "../WA_FIT.log");
        const timestamp = formatLogTimestamp();
        const reasonStr = entry.reason ? ` | Reason: ${entry.reason.replace(/\r?\n|\r/g, " ")}` : "";
        const maxCountStr = entry.maxMsgCount !== undefined && entry.maxMsgCount >= 0 ? ` | Max Msg Count: ${entry.maxMsgCount}` : "";
        const logLine = `[${timestamp}] [${entry.status}] File: ${entry.fileName} | Size: ${entry.fileSize} bytes | Mobile: ${entry.mobile} | Status: ${entry.status === "SUCCESS" ? "Success" : "Failure"}${maxCountStr}${reasonStr}\n`;
        fs_1.default.appendFileSync(logPath, logLine);
    }
    catch (logErr) {
        console.error("Failed to write to WA_FIT.log", logErr);
    }
}
// Decrement 'Max Msg Count' and update stats in server/.env
function decrementMaxMsgCountInEnv() {
    const envPath = path_1.default.resolve(__dirname, "../.env");
    let updatedMax = -1;
    if (!fs_1.default.existsSync(envPath))
        return updatedMax;
    try {
        const content = fs_1.default.readFileSync(envPath, "utf-8");
        const lines = content.split(/\r?\n/);
        const now = new Date();
        const pad = (n) => String(n).padStart(2, "0");
        const todayStr = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
        let currentLastDate = "";
        for (let i = 0; i < lines.length; i++) {
            if (lines[i].startsWith("Last Sent Date=")) {
                currentLastDate = lines[i].split("=")[1].trim();
                lines[i] = `Last Sent Date=${todayStr}`;
            }
        }
        let foundMax = false;
        let foundRemaining = false;
        let foundTotal = false;
        let foundToday = false;
        let foundLastDate = false;
        for (let i = 0; i < lines.length; i++) {
            if (lines[i].startsWith("Max Msg Count=")) {
                let count = parseInt(lines[i].split("=")[1], 10);
                if (isNaN(count))
                    count = 5000;
                updatedMax = Math.max(0, count - 1);
                lines[i] = `Max Msg Count=${updatedMax}`;
                foundMax = true;
            }
            if (lines[i].startsWith("Remaining Msg Count=")) {
                let count = parseInt(lines[i].split("=")[1], 10);
                if (isNaN(count))
                    count = updatedMax >= 0 ? updatedMax : 5000;
                lines[i] = `Remaining Msg Count=${Math.max(0, count - 1)}`;
                foundRemaining = true;
            }
            if (lines[i].startsWith("Total Msg Sent=")) {
                let count = parseInt(lines[i].split("=")[1], 10) || 0;
                lines[i] = `Total Msg Sent=${count + 1}`;
                foundTotal = true;
            }
            if (lines[i].startsWith("Msg Sent Today=")) {
                let count = parseInt(lines[i].split("=")[1], 10) || 0;
                if (currentLastDate !== todayStr && currentLastDate !== "") {
                    count = 0;
                }
                lines[i] = `Msg Sent Today=${count + 1}`;
                foundToday = true;
            }
            if (lines[i].startsWith("Last Sent Date=")) {
                foundLastDate = true;
            }
        }
        if (!foundMax) {
            updatedMax = 4999;
            lines.push(`Max Msg Count=4999`);
        }
        if (!foundRemaining)
            lines.push(`Remaining Msg Count=${updatedMax >= 0 ? updatedMax : 4999}`);
        if (!foundTotal)
            lines.push(`Total Msg Sent=1`);
        if (!foundToday)
            lines.push(`Msg Sent Today=1`);
        if (!foundLastDate)
            lines.push(`Last Sent Date=${todayStr}`);
        fs_1.default.writeFileSync(envPath, lines.join("\n"));
    }
    catch (err) {
        console.error("Failed to update stats in .env", err);
    }
    return updatedMax;
}
let cachedSession = null;
let lastSessionTime = 0;
// Log in to WhatsApp website using username & password and retrieve / generate the active API key and session
function getOrRefreshWhatsAppSession() {
    return __awaiter(this, void 0, void 0, function* () {
        var _a;
        const now = Date.now();
        // Reuse valid cached session for up to 6 hours
        if (cachedSession && (now - lastSessionTime < 6 * 60 * 60 * 1000) && cachedSession.apiKey && cachedSession.token) {
            return cachedSession;
        }
        const username = process.env.WHATSAPP_USERNAME;
        const password = process.env.WHATSAPP_PASSWORD;
        const phoneNoId = process.env.WHATSAPP_PHONE_ID;
        const apiHostUrl = process.env.WHATSAPP_API_HOST || "https://waapi.automationclub.in/api/v2/whatsapp-business/messages";
        let website = process.env.WHATSAPP_WEBSITE;
        if (!website) {
            try {
                website = new URL(apiHostUrl).origin;
            }
            catch (_b) {
                website = "https://waapi.automationclub.in";
            }
        }
        if (!username || !password) {
            throw new Error("WHATSAPP_USERNAME and WHATSAPP_PASSWORD environment variables are required for WhatsApp website login.");
        }
        const hostHeader = new URL(website).host;
        console.log(`[Direct WA] Logging into WhatsApp provider website at ${website}...`);
        const loginRes = yield fetch(`${website}/api/v1/login`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "X-Client-Host": hostHeader,
                "X-Forwarded-Host": hostHeader
            },
            body: JSON.stringify({ email: username, password })
        });
        if (!loginRes.ok) {
            const errText = yield loginRes.text();
            throw new Error(`WhatsApp website login failed (${loginRes.status}): ${errText}`);
        }
        const loginData = yield loginRes.json();
        const token = loginData.accessToken;
        const setCookie = loginRes.headers.get("set-cookie") || `vbAccessToken=${token}`;
        if (!token) {
            throw new Error("No access token returned from WhatsApp website login.");
        }
        // Check existing saved API key
        let apiKey = process.env.WHATSAPP_API_KEY || "";
        try {
            const keyRes = yield fetch(`${website}/api/v2/whatsapp-business/apikey`, {
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Cookie": `vbAccessToken=${token}`,
                    "X-Client-Host": hostHeader,
                    "X-Forwarded-Host": hostHeader
                }
            });
            if (keyRes.ok) {
                const keyData = yield keyRes.json();
                if ((_a = keyData === null || keyData === void 0 ? void 0 : keyData.credentials) === null || _a === void 0 ? void 0 : _a.apiKey) {
                    apiKey = keyData.credentials.apiKey;
                }
            }
        }
        catch (keyErr) {
            console.warn("[Direct WA] Error reading existing key:", keyErr);
        }
        // If no saved key, generate and save one
        if (!apiKey) {
            console.log("[Direct WA] Generating and saving a new API key...");
            const genRes = yield fetch(`${website}/api/v2/whatsapp-business/apikey`, {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Cookie": `vbAccessToken=${token}`,
                    "X-Client-Host": hostHeader,
                    "X-Forwarded-Host": hostHeader
                }
            });
            if (!genRes.ok) {
                throw new Error(`Failed to generate WhatsApp API key: ${yield genRes.text()}`);
            }
            const genData = yield genRes.json();
            apiKey = genData.apiKey;
            const saveRes = yield fetch(`${website}/api/v2/whatsapp-business/apikey/save`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`,
                    "Cookie": `vbAccessToken=${token}`,
                    "X-Client-Host": hostHeader,
                    "X-Forwarded-Host": hostHeader
                },
                body: JSON.stringify({
                    apiKey,
                    phoneNumbersId: phoneNoId ? [phoneNoId] : []
                })
            });
            if (!saveRes.ok) {
                console.warn("[Direct WA] Could not link phone number to API key:", yield saveRes.text());
            }
        }
        if (apiKey) {
            process.env.WHATSAPP_API_KEY = apiKey;
            try {
                const envPath = path_1.default.resolve(__dirname, "../.env");
                if (fs_1.default.existsSync(envPath)) {
                    let content = fs_1.default.readFileSync(envPath, "utf-8");
                    if (content.includes("WHATSAPP_API_KEY=")) {
                        content = content.replace(/WHATSAPP_API_KEY=.*/, `WHATSAPP_API_KEY=${apiKey}`);
                    }
                    else {
                        content += `\nWHATSAPP_API_KEY=${apiKey}`;
                    }
                    fs_1.default.writeFileSync(envPath, content);
                }
            }
            catch (envErr) {
                console.error("[Direct WA] Failed to persist refreshed WHATSAPP_API_KEY to .env", envErr);
            }
        }
        cachedSession = { apiKey, token, cookie: setCookie, website };
        lastSessionTime = now;
        return cachedSession;
    });
}
// Uploads receipt buffer to Automation Club's official cloud media storage (/api/s3-upload)
function uploadReceiptToCloudStorage(buffer, fileName) {
    return __awaiter(this, void 0, void 0, function* () {
        const session = yield getOrRefreshWhatsAppSession();
        const { token, website } = session;
        const host = new URL(website).host;
        console.log(`[Direct WA] Requesting presigned upload URL from ${website}/api/s3-upload...`);
        const s3Res = yield fetch(`${website}/api/s3-upload`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`,
                "Cookie": `vbAccessToken=${token}`,
                "X-Client-Host": host,
                "X-Forwarded-Host": host
            },
            body: JSON.stringify({
                fileName: fileName || "receipt.jpg",
                fileType: "image/jpeg",
                fileSize: buffer.length,
                subFolder: "file-manager"
            })
        });
        if (!s3Res.ok) {
            const errText = yield s3Res.text();
            throw new Error(`Cloud storage pre-sign failed (${s3Res.status}): ${errText}`);
        }
        const { url, s3Url } = (yield s3Res.json());
        if (!url || !s3Url) {
            throw new Error("Invalid response from cloud storage API: missing url or s3Url");
        }
        console.log(`[Direct WA] Uploading ${buffer.length} bytes to cloud storage...`);
        const putRes = yield fetch(url, {
            method: "PUT",
            headers: {
                "Content-Type": "image/jpeg"
            },
            body: new Uint8Array(buffer)
        });
        if (!putRes.ok) {
            const errText = yield putRes.text();
            throw new Error(`Uploading receipt to cloud storage failed (${putRes.status}): ${errText}`);
        }
        console.log(`[Direct WA] Receipt successfully stored on cloud storage: ${s3Url}`);
        return s3Url;
    });
}
// ─── Direct WhatsApp Share ───────────────────────────────────
app.post("/api/whatsapp/send-direct", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const { host, mobile, msg, base64Image, fileName, caption, mediaId } = req.body;
    const actualFileName = fileName || "receipt.jpg";
    // Allow self-signed certs for local IPs
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
    let bufferSize = 0;
    let cleanMobile = String(mobile || "").replace(/\D/g, "");
    if (cleanMobile.length === 10) {
        cleanMobile = `91${cleanMobile}`;
    }
    // Basic validation
    if (!base64Image) {
        const errMsg = "base64Image is required for customer receipt sharing in image format.";
        writeWaFitLog({ status: "FAILURE", fileName: actualFileName, fileSize: 0, mobile: cleanMobile || String(mobile), reason: errMsg });
        return res.status(400).json({ error: errMsg });
    }
    if (!cleanMobile || cleanMobile.length < 10) {
        const errMsg = `Valid mobile number is required (got '${mobile}').`;
        writeWaFitLog({ status: "FAILURE", fileName: actualFileName, fileSize: 0, mobile: cleanMobile || String(mobile), reason: errMsg });
        return res.status(400).json({ error: errMsg });
    }
    // Check quota limit in .env
    try {
        const envPath = path_1.default.resolve(__dirname, "../.env");
        if (fs_1.default.existsSync(envPath)) {
            const content = fs_1.default.readFileSync(envPath, "utf-8");
            const match = content.match(/Max Msg Count=(\d+)/);
            if (match && parseInt(match[1], 10) <= 0) {
                const errMsg = "Max Msg Count quota reached (0 remaining). Direct WhatsApp sharing paused.";
                writeWaFitLog({ status: "FAILURE", fileName: actualFileName, fileSize: 0, mobile: cleanMobile, reason: errMsg });
                return res.status(403).json({ error: errMsg });
            }
        }
    }
    catch (quotaErr) {
        console.warn("Could not check Max Msg Count quota:", quotaErr);
    }
    try {
        const rawBase64 = base64Image.replace(/^data:image\/\w+;base64,/, "");
        const buffer = Buffer.from(rawBase64, "base64");
        bufferSize = buffer.length;
        // Retrieve session and credentials
        const session = yield getOrRefreshWhatsAppSession();
        let apiKey = session.apiKey || process.env.WHATSAPP_API_KEY;
        const phoneNoId = process.env.WHATSAPP_PHONE_ID;
        const apiHostUrl = process.env.WHATSAPP_API_HOST || "https://waapi.automationclub.in/api/v2/whatsapp-business/messages";
        if (!phoneNoId) {
            throw new Error("WHATSAPP_PHONE_ID environment variable is missing.");
        }
        // Support both 'Send Image by Media ID' and 'Send Image by URL' methods per docs
        const effectiveMediaId = mediaId || process.env.WHATSAPP_MEDIA_ID;
        let imageUrl = "";
        if (!effectiveMediaId) {
            console.log(`[Direct WA] Uploading receipt image to Automation Club cloud storage...`);
            imageUrl = yield uploadReceiptToCloudStorage(buffer, actualFileName);
            console.log(`[Direct WA] Image URL ready: ${imageUrl}`);
        }
        // Extract bill number for approved template variable {{1}} (e.g. 'AS-000002')
        const billMatch = actualFileName.match(/^Receipt_([^_]+)/i) || actualFileName.match(/^([^_]+)_\d{8}\.[^.]+$/i);
        const billNo = billMatch ? billMatch[1] : actualFileName.replace(/\.[^/.]+$/, "");
        // 1. Primary: Approved Meta template "receipt" (delivers even if 24 hours have passed!)
        const headerParam = effectiveMediaId
            ? { type: "image", id: isNaN(Number(effectiveMediaId)) ? effectiveMediaId : Number(effectiveMediaId) }
            : { type: "image", url: imageUrl };
        const templatePayload = {
            to: cleanMobile,
            phoneNoId: phoneNoId,
            type: "template",
            name: "receipt",
            language: "en",
            headerParams: [headerParam],
            bodyParams: [billNo]
        };
        // 2. Secondary fallback: Direct image payload (caption removed)
        const directImagePayload = effectiveMediaId
            ? {
                to: cleanMobile,
                phoneNoId: phoneNoId,
                type: "image",
                id: isNaN(Number(effectiveMediaId)) ? effectiveMediaId : Number(effectiveMediaId)
            }
            : {
                to: cleanMobile,
                phoneNoId: phoneNoId,
                type: "image",
                url: imageUrl
            };
        if (caption && caption.trim()) {
            directImagePayload.caption = caption.trim();
        }
        console.log(`[Direct WA] Sending receipt to ${cleanMobile} via approved 'receipt' template...`);
        let sendPayload = templatePayload;
        let sendRes = yield fetch(apiHostUrl, {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${apiKey}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify(sendPayload)
        });
        // If template send returns error, fallback to direct image message
        if (!sendRes.ok) {
            console.warn(`[Direct WA] Template delivery failed (${sendRes.status}), attempting direct image message...`);
            sendPayload = directImagePayload;
            sendRes = yield fetch(apiHostUrl, {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${apiKey}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(sendPayload)
            });
        }
        // If 401 Unauthorized, re-authenticate session and retry
        if (sendRes.status === 401 && process.env.WHATSAPP_USERNAME && process.env.WHATSAPP_PASSWORD) {
            console.log("[Direct WA] API Key unauthorized (401), refreshing session...");
            cachedSession = null;
            const refreshed = yield getOrRefreshWhatsAppSession();
            apiKey = refreshed.apiKey;
            sendRes = yield fetch(apiHostUrl, {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${apiKey}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(sendPayload)
            });
        }
        // If 401 Unauthorized, re-authenticate session and retry
        if (sendRes.status === 401 && process.env.WHATSAPP_USERNAME && process.env.WHATSAPP_PASSWORD) {
            console.log("[Direct WA] API Key unauthorized (401), refreshing session...");
            cachedSession = null;
            const refreshed = yield getOrRefreshWhatsAppSession();
            apiKey = refreshed.apiKey;
            sendRes = yield fetch(apiHostUrl, {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${apiKey}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(sendPayload)
            });
        }
        if (!sendRes.ok) {
            const errText = yield sendRes.text();
            let parsedErr = errText;
            try {
                const errJson = JSON.parse(errText);
                parsedErr = errJson.message || ((_a = errJson.error) === null || _a === void 0 ? void 0 : _a.message) || errText;
            }
            catch (_b) { }
            throw new Error(`WhatsApp API delivery failed (${sendRes.status}): ${parsedErr}`);
        }
        const sendData = yield sendRes.json();
        // 3. Decrement 'Max Msg Count' in .env after successful share
        const newMaxCount = decrementMaxMsgCountInEnv();
        // 4. Log successful sharing activity in WA_FIT.log
        writeWaFitLog({
            status: "SUCCESS",
            fileName: actualFileName,
            fileSize: bufferSize,
            mobile: cleanMobile,
            maxMsgCount: newMaxCount
        });
        res.json({
            success: true,
            data: sendData,
            maxMsgCount: newMaxCount
        });
    }
    catch (err) {
        console.error("Direct WhatsApp Share error:", err);
        let errorMessage = err.message || "Unknown error";
        if (errorMessage.includes("fetch failed")) {
            errorMessage = `Fetch failed to WhatsApp API. Ensure host and network are accessible.`;
        }
        // Log failure with reason in WA_FIT.log
        writeWaFitLog({
            status: "FAILURE",
            fileName: actualFileName,
            fileSize: bufferSize,
            mobile: cleanMobile,
            reason: errorMessage
        });
        res.status(500).json({ error: errorMessage });
    }
}));
app.get("/api/whatsapp/stats", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const envPath = path_1.default.join(__dirname, "../.env");
        let content = "";
        if (fs_1.default.existsSync(envPath)) {
            content = fs_1.default.readFileSync(envPath, "utf-8");
        }
        const lines = content.split(/\r?\n/);
        let totalSent = 0;
        let todaySent = 0;
        let remainingMsgCount = 0;
        let lastSentDate = "";
        for (const line of lines) {
            if (line.startsWith("Total Msg Sent=")) {
                totalSent = parseInt(line.split("=")[1], 10) || 0;
            }
            if (line.startsWith("Msg Sent Today=")) {
                todaySent = parseInt(line.split("=")[1], 10) || 0;
            }
            if (line.startsWith("Last Sent Date=")) {
                lastSentDate = line.split("=")[1].trim();
            }
            if (line.startsWith("Remaining Msg Count=")) {
                remainingMsgCount = parseInt(line.split("=")[1], 10) || 0;
            }
        }
        const todayStr = new Date().toISOString().split("T")[0];
        if (lastSentDate !== todayStr) {
            todaySent = 0;
        }
        res.json({ totalSent, todaySent, remainingMsgCount });
    }
    catch (err) {
        res.status(500).json({ error: "Failed to read stats" });
    }
}));
// ─── Customer Sent Count Reset Routes ─────────────────────────
app.post("/api/customers/:id/reset-sent-count", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const repo = data_source_1.AppDataSource.getRepository(Customer_1.Customer);
        const customer = yield repo.findOneBy({ id: req.params.id });
        if (!customer)
            return res.status(404).json({ error: "Customer not found" });
        customer.totalSentCount = 0;
        yield repo.save(customer);
        yield logAudit("UPDATE", "Customer", customer.id, `Reset sent count for: ${customer.customerName}`);
        res.json(customer);
    }
    catch (err) {
        console.error("Error resetting sent count for", req.params.id, err);
        res.status(500).json({ error: "Failed to reset sent count", details: err.message });
    }
}));
app.post("/api/customers/reset-all-sent-counts", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const repo = data_source_1.AppDataSource.getRepository(Customer_1.Customer);
        const allCustomers = yield repo.find();
        for (const customer of allCustomers) {
            customer.totalSentCount = 0;
            yield repo.save(customer);
        }
        yield logAudit("UPDATE", "Customer", "all", `Reset sent count for ${allCustomers.length} customers`);
        res.json({ success: true, resetCount: allCustomers.length });
    }
    catch (err) {
        console.error("Error resetting all sent counts:", err);
        res.status(500).json({ error: "Failed to reset sent counts", details: err.message });
    }
}));
// ─── Bulk Delete All Entries ─────────────────────────────────
app.post("/api/entries/delete-all", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const repo = data_source_1.AppDataSource.getRepository(BoxEntry_1.BoxEntry);
        const countResult = yield repo.count();
        if (countResult === 0)
            return res.json({ success: true, deletedCount: 0, message: 'No entries to delete' });
        yield repo.delete({ id: (0, typeorm_1.Not)((0, typeorm_1.IsNull)()) }); // TypeORM workaround for "delete all"
        yield logAudit("DELETE", "BoxEntry", "all", `Deleted all ${countResult} entries`);
        // Also reset all customer sent counts to complete the fresh start
        const customerRepo = data_source_1.AppDataSource.getRepository(Customer_1.Customer);
        yield customerRepo.update({ id: (0, typeorm_1.Not)((0, typeorm_1.IsNull)()) }, { totalSentCount: 0 });
        yield logAudit("UPDATE", "Customer", "all", "Reset sent count for all customers after bulk entry deletion");
        res.json({ success: true, deletedCount: countResult });
    }
    catch (err) {
        console.error("Error deleting all entries:", err);
        res.status(500).json({ error: "Failed to delete entries", details: err.message });
    }
}));
// ─── System Clear All Data ──────────────────────────────────
app.post("/api/system/clear-all", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const queryRunner = data_source_1.AppDataSource.createQueryRunner();
    yield queryRunner.connect();
    yield queryRunner.startTransaction();
    try {
        const entryRepo = queryRunner.manager.getRepository(BoxEntry_1.BoxEntry);
        const customerRepo = queryRunner.manager.getRepository(Customer_1.Customer);
        const areaRepo = queryRunner.manager.getRepository(CustomerArea_1.CustomerArea);
        const sourceRepo = queryRunner.manager.getRepository(InventorySource_1.InventorySource);
        // Delete business records in order of dependencies (child first)
        yield entryRepo.delete({ id: (0, typeorm_1.Not)((0, typeorm_1.IsNull)()) });
        yield customerRepo.delete({ id: (0, typeorm_1.Not)((0, typeorm_1.IsNull)()) });
        yield sourceRepo.delete({ id: (0, typeorm_1.Not)((0, typeorm_1.IsNull)()) });
        yield areaRepo.delete({ id: (0, typeorm_1.Not)((0, typeorm_1.IsNull)()) });
        yield logAudit("DELETE", "SYSTEM", "all", "Full system data clear (business records only)");
        yield queryRunner.commitTransaction();
        res.json({ success: true, message: "All business records have been cleared." });
    }
    catch (err) {
        yield queryRunner.rollbackTransaction();
        console.error("Error during full system clear:", err);
        res.status(500).json({ error: "Failed to clear system data", details: err.message });
    }
    finally {
        yield queryRunner.release();
    }
}));
// ─── System Bulk Import ─────────────────────────────────────
app.post("/api/system/import", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { customers, sources, entries, areas, settings } = req.body;
    const queryRunner = data_source_1.AppDataSource.createQueryRunner();
    yield queryRunner.connect();
    yield queryRunner.startTransaction();
    try {
        const customerRepo = queryRunner.manager.getRepository(Customer_1.Customer);
        const sourceRepo = queryRunner.manager.getRepository(InventorySource_1.InventorySource);
        const entryRepo = queryRunner.manager.getRepository(BoxEntry_1.BoxEntry);
        const areaRepo = queryRunner.manager.getRepository(CustomerArea_1.CustomerArea);
        const settingsRepo = queryRunner.manager.getRepository(AppSettings_1.AppSettings);
        // 1. Restore Areas
        if (areas && Array.isArray(areas)) {
            for (const a of areas) {
                let existing = yield areaRepo.findOneBy({ id: a.id });
                if (existing)
                    Object.assign(existing, a);
                else
                    existing = areaRepo.create(a);
                yield areaRepo.save(existing);
            }
        }
        // 2. Restore Varieties (InventorySources)
        if (sources && Array.isArray(sources)) {
            for (const s of sources) {
                let existing = yield sourceRepo.findOneBy({ id: s.id });
                if (existing)
                    Object.assign(existing, s);
                else
                    existing = sourceRepo.create(s);
                yield sourceRepo.save(existing);
            }
        }
        // 3. Restore Customers
        if (customers && Array.isArray(customers)) {
            for (const c of customers) {
                let existing = yield customerRepo.findOneBy({ id: c.id });
                if (existing)
                    Object.assign(existing, c);
                else
                    existing = customerRepo.create(c);
                yield customerRepo.save(existing);
            }
        }
        // 4. Restore Entries
        if (entries && Array.isArray(entries)) {
            for (const e of entries) {
                let existing = yield entryRepo.findOneBy({ id: e.id });
                if (existing)
                    Object.assign(existing, e);
                else
                    existing = entryRepo.create(e);
                yield entryRepo.save(existing);
            }
        }
        // 5. Restore Settings
        if (settings) {
            let existing = yield settingsRepo.findOne({ where: {} });
            if (existing) {
                Object.assign(existing, settings);
                yield settingsRepo.save(existing);
            }
            else {
                const newSettings = settingsRepo.create(settings);
                yield settingsRepo.save(newSettings);
            }
        }
        yield logAudit("RESTORE", "SYSTEM", "all", "Bulk system data restore/import");
        yield queryRunner.commitTransaction();
        res.json({ success: true, message: "Data imported successfully." });
    }
    catch (err) {
        yield queryRunner.rollbackTransaction();
        console.error("Error during bulk import:", err);
        res.status(500).json({ error: "Failed to import data", details: err.message });
    }
    finally {
        yield queryRunner.release();
    }
}));
// ─── InventorySource Routes ──────────────────────────────────
app.get("/api/sources", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const repo = data_source_1.AppDataSource.getRepository(InventorySource_1.InventorySource);
    const sources = yield repo.find({ order: { sourceName: "ASC" } });
    res.json(sources);
}));
app.get("/api/sources/:id", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const repo = data_source_1.AppDataSource.getRepository(InventorySource_1.InventorySource);
    const source = yield repo.findOneBy({ id: req.params.id });
    if (!source)
        return res.status(404).json({ error: "Not found" });
    res.json(source);
}));
app.post("/api/sources", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const repo = data_source_1.AppDataSource.getRepository(InventorySource_1.InventorySource);
    const source = repo.create(req.body);
    yield repo.save(source);
    yield logAudit("CREATE", "Source", source.id, `Created source: ${source.sourceName}`);
    res.json(source);
}));
app.put("/api/sources/:id", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const repo = data_source_1.AppDataSource.getRepository(InventorySource_1.InventorySource);
    let source = yield repo.findOneBy({ id: req.params.id });
    if (!source)
        return res.status(404).json({ error: "Not found" });
    Object.assign(source, req.body);
    yield repo.save(source);
    yield logAudit("UPDATE", "Source", source.id, `Updated source: ${source.sourceName}`);
    res.json(source);
}));
app.delete("/api/sources/:id", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const repo = data_source_1.AppDataSource.getRepository(InventorySource_1.InventorySource);
    const source = yield repo.findOneBy({ id: req.params.id });
    if (!source)
        return res.status(404).json({ error: "Not found" });
    yield repo.remove(source);
    yield logAudit("DELETE", "Source", req.params.id, `Deleted source: ${source.sourceName}`);
    res.json({ success: true });
}));
// ─── BoxEntry Routes ───────────────────────────────────────
app.get("/api/entries", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const repo = data_source_1.AppDataSource.getRepository(BoxEntry_1.BoxEntry);
    const entries = yield repo.find({ order: { entryDate: "DESC" } });
    res.json(entries);
}));
app.get("/api/entries/customer/:customerId", catchAsync((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const repo = data_source_1.AppDataSource.getRepository(BoxEntry_1.BoxEntry);
    const entries = yield repo.find({
        where: { customerId: req.params.customerId },
        order: { entryDate: "DESC" }
    });
    res.json(entries);
})));
app.get("/api/entries/:id", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const repo = data_source_1.AppDataSource.getRepository(BoxEntry_1.BoxEntry);
    const entry = yield repo.findOneBy({ id: req.params.id });
    if (!entry)
        return res.status(404).json({ error: "Not found" });
    res.json(entry);
}));
app.post("/api/entries", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const repo = data_source_1.AppDataSource.getRepository(BoxEntry_1.BoxEntry);
    const entry = repo.create(req.body);
    yield repo.save(entry);
    yield logAudit("CREATE", "BoxEntry", entry.id, `Bill ${entry.billNumber} – ${entry.customerName}`);
    res.json(entry);
}));
app.put("/api/entries/:id", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const repo = data_source_1.AppDataSource.getRepository(BoxEntry_1.BoxEntry);
    let entry = yield repo.findOneBy({ id: req.params.id });
    if (!entry)
        return res.status(404).json({ error: "Not found" });
    Object.assign(entry, req.body);
    yield repo.save(entry);
    yield logAudit("UPDATE", "BoxEntry", entry.id, `Updated Bill ${entry.billNumber}`);
    res.json(entry);
}));
app.delete("/api/entries/:id", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const repo = data_source_1.AppDataSource.getRepository(BoxEntry_1.BoxEntry);
    const entry = yield repo.findOneBy({ id: req.params.id });
    if (!entry)
        return res.status(404).json({ error: "Not found" });
    yield repo.remove(entry);
    yield logAudit("DELETE", "BoxEntry", req.params.id, `Deleted Bill ${entry.billNumber}`);
    res.json({ success: true });
}));
// ─── Dashboard Stats ───────────────────────────────────────
// (For this prototype, it's easier to simply fetch all entries and compute stats locally in the frontend
//  or compute them here. Since the frontend logic already exists and we just need the data, we can 
//  let the frontend do `getDashboardStats()` locally after fetching APIs, OR we implement it here.)
// ─── Audit Log Routes ──────────────────────────────────────
// ─── CustomerArea Routes ─────────────────────────────────────
app.get("/api/customer-areas", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const repo = data_source_1.AppDataSource.getRepository(CustomerArea_1.CustomerArea);
    const areas = yield repo.find({ order: { areaName: "ASC" } });
    res.json(areas);
}));
app.get("/api/customer-areas/:id", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const repo = data_source_1.AppDataSource.getRepository(CustomerArea_1.CustomerArea);
    const area = yield repo.findOneBy({ id: req.params.id });
    if (!area)
        return res.status(404).json({ error: "Not found" });
    res.json(area);
}));
app.post("/api/customer-areas", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const repo = data_source_1.AppDataSource.getRepository(CustomerArea_1.CustomerArea);
    const area = repo.create(req.body);
    yield repo.save(area);
    yield logAudit("CREATE", "CustomerArea", area.id, `Created area: ${area.areaName}`);
    res.json(area);
}));
app.put("/api/customer-areas/:id", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const repo = data_source_1.AppDataSource.getRepository(CustomerArea_1.CustomerArea);
    let area = yield repo.findOneBy({ id: req.params.id });
    if (!area)
        return res.status(404).json({ error: "Not found" });
    Object.assign(area, req.body);
    yield repo.save(area);
    yield logAudit("UPDATE", "CustomerArea", area.id, `Updated area: ${area.areaName}`);
    res.json(area);
}));
app.delete("/api/customer-areas/:id", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const repo = data_source_1.AppDataSource.getRepository(CustomerArea_1.CustomerArea);
    const area = yield repo.findOneBy({ id: req.params.id });
    if (!area)
        return res.status(404).json({ error: "Not found" });
    yield repo.remove(area);
    yield logAudit("DELETE", "CustomerArea", req.params.id, `Deleted area: ${area.areaName}`);
    res.json({ success: true });
}));
// ─── Audit Log Routes ──────────────────────────────────────
app.get("/api/audit", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const repo = data_source_1.AppDataSource.getRepository(AuditLog_1.AuditLog);
    const logs = yield repo.find({ order: { timestamp: "DESC" } });
    res.json(logs);
}));
// ─── Auth Routes ────────────────────────────────────────────
app.post("/api/auth/login", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { username, password } = req.body;
    if (!username || !password)
        return res.status(400).json({ error: "Username and password required" });
    const repo = data_source_1.AppDataSource.getRepository(User_1.User);
    const user = yield repo.findOneBy({ username });
    if (!user)
        return res.status(401).json({ error: "Invalid credentials" });
    if (!user.isActive)
        return res.status(401).json({ error: "Account is deactivated" });
    const valid = yield bcryptjs_1.default.compare(password, user.passwordHash);
    if (!valid)
        return res.status(401).json({ error: "Invalid credentials" });
    res.json({
        id: user.id,
        username: user.username,
        displayName: user.displayName,
        isAdmin: user.isAdmin,
        isSystemAdmin: user.isSystemAdmin,
    });
}));
app.get("/api/auth/me", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    res.json({ loggedIn: false }); // sessionless, frontend manages auth state
}));
// ─── User Management Routes ───────────────────────────────────
// Helper: load the calling user from session token
function getCaller(req) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a;
        const token = (_a = req.headers['authorization']) === null || _a === void 0 ? void 0 : _a.replace('Bearer ', '');
        if (!token)
            return null;
        return data_source_1.AppDataSource.getRepository(User_1.User).findOneBy({ id: token });
    });
}
app.get("/api/users", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const repo = data_source_1.AppDataSource.getRepository(User_1.User);
    const users = yield repo.find({ order: { displayName: "ASC" } });
    res.json(users.map(({ id, username, displayName, isAdmin, isSystemAdmin, isActive, createdAt }) => ({
        id, username, displayName, isAdmin, isSystemAdmin, isActive, createdAt,
    })));
}));
app.post("/api/users", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { username, password, displayName, isAdmin } = req.body;
    if (!username || !password)
        return res.status(400).json({ error: "Username and password required" });
    const repo = data_source_1.AppDataSource.getRepository(User_1.User);
    // Check duplicate
    const exists = yield repo.findOneBy({ username });
    if (exists)
        return res.status(400).json({ error: "Username already exists" });
    const hash = yield bcryptjs_1.default.hash(password, 10);
    const u = repo.create({ username, passwordHash: hash, displayName: displayName || username, isAdmin: !!isAdmin, isSystemAdmin: false, isActive: true });
    yield repo.save(u);
    yield logAudit("CREATE", "User", u.id, `Created user: ${u.username}`);
    res.json({ id: u.id, username: u.username, displayName: u.displayName, isAdmin: u.isAdmin, isSystemAdmin: u.isSystemAdmin, isActive: u.isActive });
}));
app.put("/api/users/:id", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const repo = data_source_1.AppDataSource.getRepository(User_1.User);
    let user = yield repo.findOneBy({ id: req.params.id });
    if (!user)
        return res.status(404).json({ error: "Not found" });
    // No one can modify the System Admin account
    if (user.isSystemAdmin)
        return res.status(403).json({ error: "Cannot modify System Admin account" });
    if (req.body.password)
        req.body.passwordHash = yield bcryptjs_1.default.hash(req.body.password, 10);
    if (req.body.isAdmin !== undefined)
        Object.assign(user, { isAdmin: req.body.isAdmin });
    if (req.body.isSystemAdmin !== undefined && !req.body.isSystemAdmin)
        Object.assign(user, { isSystemAdmin: req.body.isSystemAdmin });
    if (req.body.isActive !== undefined)
        Object.assign(user, { isActive: req.body.isActive });
    if (req.body.displayName)
        Object.assign(user, { displayName: req.body.displayName });
    yield repo.save(user);
    res.json({ id: user.id, username: user.username, displayName: user.displayName, isAdmin: user.isAdmin, isSystemAdmin: user.isSystemAdmin, isActive: user.isActive });
}));
app.delete("/api/users/:id", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const repo = data_source_1.AppDataSource.getRepository(User_1.User);
    const user = yield repo.findOneBy({ id: req.params.id });
    if (!user)
        return res.status(404).json({ error: "Not found" });
    // Cannot delete System Admin
    if (user.isSystemAdmin)
        return res.status(403).json({ error: "Cannot delete System Admin account" });
    // Cannot delete Admin
    if (user.isAdmin && user.username === "Admin")
        return res.status(403).json({ error: "Cannot delete Admin account" });
    yield repo.remove(user);
    yield logAudit("DELETE", "User", user.id, `Deleted user: ${user.username}`);
    res.json({ success: true });
}));
// ─── Serve Frontend (Production) ──────────────────────────
// In production, serve the Vite-built frontend directly from Express.
// This eliminates the need for Nginx on single-machine deployments.
const frontendDist = path_1.default.resolve(__dirname, "../../dist");
if (fs_1.default.existsSync(frontendDist)) {
    console.log(`[Static] Serving frontend from ${frontendDist}`);
    app.use(express_1.default.static(frontendDist));
    // SPA catch-all: any non-API route returns index.html
    app.get("*", (req, res) => {
        if (!req.path.startsWith("/api")) {
            res.sendFile(path_1.default.join(frontendDist, "index.html"));
        }
    });
}
// ─── Global Error Middleware ───────────────────────────────
app.use((err, req, res, next) => {
    const status = err.status || 500;
    const message = err.message || "Internal Server Error";
    res.status(status).json({
        error: message,
        path: req.path,
        method: req.method
    });
});
data_source_1.AppDataSource.initialize()
    .then(() => __awaiter(void 0, void 0, void 0, function* () {
    console.log("Data Source has been initialized!");
    // Seed default System Admin user
    try {
        const userRepo = data_source_1.AppDataSource.getRepository(User_1.User);
        const sysAdmin = yield userRepo.findOneBy({ username: "System Admin" });
        if (!sysAdmin) {
            const hashed = yield bcryptjs_1.default.hash("Clasic@104", 10);
            const u = userRepo.create({ username: "System Admin", passwordHash: hashed, displayName: "System Admin", isAdmin: false, isSystemAdmin: true, isActive: true });
            yield userRepo.save(u);
            console.log("[Seed] System Admin user created.");
        }
        // Seed Admin user
        const admin = yield userRepo.findOneBy({ username: "Admin" });
        if (!admin) {
            const hashed = yield bcryptjs_1.default.hash("AS@traders", 10);
            const u = userRepo.create({ username: "Admin", passwordHash: hashed, displayName: "Admin", isAdmin: true, isSystemAdmin: false, isActive: true });
            yield userRepo.save(u);
            console.log("[Seed] Admin user created.");
        }
    }
    catch (err) {
        console.error("[Seed] Error seeding admin users:", err);
    }
    // Backfill totalSentCount from existing entries (one-time migration only)
    try {
        const customerRepo = data_source_1.AppDataSource.getRepository(Customer_1.Customer);
        const entryRepo = data_source_1.AppDataSource.getRepository(BoxEntry_1.BoxEntry);
        const allCustomers = yield customerRepo.find();
        for (const customer of allCustomers) {
            if (customer.id && customer.customerName) {
                const entries = yield entryRepo.findBy({ customerId: customer.id });
                const total = entries
                    .filter(e => e.entryType === 'dispatch' || e.entryType === 'opening_balance')
                    .reduce((sum, e) => sum + (e.totalBoxesSent || 0) + (e.currentQuantity || 0), 0);
                // Only backfill if the count is 0 and there are actual entries to migrate.
                // This respects user-initiated resets (which also set to 0) while populating
                // counts for customers who genuinely have entries but were never backfilled.
                if (customer.totalSentCount === 0 && total > 0) {
                    customer.totalSentCount = total;
                    yield customerRepo.save(customer);
                    console.log(`[Backfill] ${customer.customerName}: totalSentCount = ${total}`);
                }
            }
        }
        console.log("[Backfill] Sent count backfill complete.");
    }
    catch (err) {
        console.error("[Backfill] Error during sent count backfill:", err);
    }
    app.listen(3001, () => {
        console.log("Server is running on port 3001");
    });
}))
    .catch((err) => {
    console.error("Error during Data Source initialization:", err);
});
