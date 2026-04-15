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
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const app = (0, express_1.default)();
app.use((0, cors_1.default)());
app.use(express_1.default.json());
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
        yield repo.delete({}); // Delete all rows, keep table
        yield logAudit("DELETE", "BoxEntry", "all", `Deleted all ${countResult} entries`);
        // Also reset all customer sent counts to complete the fresh start
        const customerRepo = data_source_1.AppDataSource.getRepository(Customer_1.Customer);
        yield customerRepo.update({}, { totalSentCount: 0 });
        yield logAudit("UPDATE", "Customer", "all", "Reset sent count for all customers after bulk entry deletion");
        res.json({ success: true, deletedCount: countResult });
    }
    catch (err) {
        console.error("Error deleting all entries:", err);
        res.status(500).json({ error: "Failed to delete entries", details: err.message });
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
