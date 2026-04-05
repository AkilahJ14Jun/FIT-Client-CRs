import express from "express";
import cors from "cors";
import { AppDataSource } from "./data-source";
import { Customer } from "./entity/Customer";
import { InventorySource } from "./entity/InventorySource";
import { BoxEntry } from "./entity/BoxEntry";
import { AppSettings } from "./entity/AppSettings";
import { AuditLog } from "./entity/AuditLog";
import { CustomerArea } from "./entity/CustomerArea";
import { User } from "./entity/User";
import bcrypt from "bcryptjs";

const app = express();
app.use(cors());
app.use(express.json());

// Helper to log audit
async function logAudit(action: string, entity: string, entityId: string, summary: string) {
  const auditRepo = AppDataSource.getRepository(AuditLog);
  const log = new AuditLog();
  log.action = action;
  log.entity = entity;
  log.entityId = entityId;
  log.summary = summary;
  await auditRepo.save(log);
}

// ─── Settings Routes ─────────────────────────────────────────
app.get("/api/settings", async (req, res) => {
  const repo = AppDataSource.getRepository(AppSettings);
  let settings = await repo.findOne({ where: {} });
  if (!settings) {
    settings = repo.create();
    await repo.save(settings);
  }
  res.json(settings);
});

app.put("/api/settings", async (req, res) => {
  const repo = AppDataSource.getRepository(AppSettings);
  let settings = await repo.findOne({ where: {} });
  if (!settings) settings = repo.create();
  Object.assign(settings, req.body);
  await repo.save(settings);
  res.json(settings);
});

// ─── Customer Routes ─────────────────────────────────────────
app.get("/api/customers", async (req, res) => {
  const repo = AppDataSource.getRepository(Customer);
  const customers = await repo.find({ order: { customerName: "ASC" } });
  res.json(customers);
});

app.get("/api/customers/:id", async (req, res) => {
  const repo = AppDataSource.getRepository(Customer);
  const customer = await repo.findOneBy({ id: req.params.id });
  if (!customer) return res.status(404).json({ error: "Not found" });
  res.json(customer);
});

app.post("/api/customers", async (req, res) => {
  const repo = AppDataSource.getRepository(Customer);
  const customer = repo.create(req.body) as any as Customer;
  await repo.save(customer);
  await logAudit("CREATE", "Customer", customer.id, `Created customer: ${customer.customerName}`);
  res.json(customer);
});

app.put("/api/customers/:id", async (req, res) => {
  const repo = AppDataSource.getRepository(Customer);
  let customer = await repo.findOneBy({ id: req.params.id });
  if (!customer) return res.status(404).json({ error: "Not found" });
  Object.assign(customer, req.body);
  await repo.save(customer);
  await logAudit("UPDATE", "Customer", customer.id, `Updated customer: ${customer.customerName}`);
  res.json(customer);
});

app.delete("/api/customers/:id", async (req, res) => {
  const repo = AppDataSource.getRepository(Customer);
  const customer = await repo.findOneBy({ id: req.params.id });
  if (!customer) return res.status(404).json({ error: "Not found" });
  await repo.remove(customer);
  await logAudit("DELETE", "Customer", req.params.id, `Deleted customer: ${customer.customerName}`);
  res.json({ success: true });
});

// ─── Customer Sent Count Reset Routes ─────────────────────────
app.post("/api/customers/:id/reset-sent-count", async (req, res) => {
  try {
    const repo = AppDataSource.getRepository(Customer);
    const customer = await repo.findOneBy({ id: req.params.id });
    if (!customer) return res.status(404).json({ error: "Customer not found" });
    customer.totalSentCount = 0;
    await repo.save(customer);
    await logAudit("UPDATE", "Customer", customer.id, `Reset sent count for: ${customer.customerName}`);
    res.json(customer);
  } catch (err) {
    console.error("Error resetting sent count for", req.params.id, err);
    res.status(500).json({ error: "Failed to reset sent count", details: (err as Error).message });
  }
});

app.post("/api/customers/reset-all-sent-counts", async (req, res) => {
  try {
    const repo = AppDataSource.getRepository(Customer);
    const allCustomers = await repo.find();
    for (const customer of allCustomers) {
      customer.totalSentCount = 0;
      await repo.save(customer);
    }
    await logAudit("UPDATE", "Customer", "all", `Reset sent count for ${allCustomers.length} customers`);
    res.json({ success: true, resetCount: allCustomers.length });
  } catch (err) {
    console.error("Error resetting all sent counts:", err);
    res.status(500).json({ error: "Failed to reset sent counts", details: (err as Error).message });
  }
});

// ─── Bulk Delete All Entries ─────────────────────────────────
app.post("/api/entries/delete-all", async (req, res) => {
  try {
    const repo = AppDataSource.getRepository(BoxEntry);
    const countResult = await repo.count();
    if (countResult === 0) return res.json({ success: true, deletedCount: 0, message: 'No entries to delete' });
    await repo.delete({}); // Delete all rows, keep table
    await logAudit("DELETE", "BoxEntry", "all", `Deleted all ${countResult} entries`);
    // Also reset all customer sent counts to complete the fresh start
    const customerRepo = AppDataSource.getRepository(Customer);
    await customerRepo.update({}, { totalSentCount: 0 });
    await logAudit("UPDATE", "Customer", "all", "Reset sent count for all customers after bulk entry deletion");
    res.json({ success: true, deletedCount: countResult });
  } catch (err) {
    console.error("Error deleting all entries:", err);
    res.status(500).json({ error: "Failed to delete entries", details: (err as Error).message });
  }
});

// ─── InventorySource Routes ──────────────────────────────────
app.get("/api/sources", async (req, res) => {
  const repo = AppDataSource.getRepository(InventorySource);
  const sources = await repo.find({ order: { sourceName: "ASC" } });
  res.json(sources);
});

app.get("/api/sources/:id", async (req, res) => {
  const repo = AppDataSource.getRepository(InventorySource);
  const source = await repo.findOneBy({ id: req.params.id });
  if (!source) return res.status(404).json({ error: "Not found" });
  res.json(source);
});

app.post("/api/sources", async (req, res) => {
  const repo = AppDataSource.getRepository(InventorySource);
  const source = repo.create(req.body) as any as InventorySource;
  await repo.save(source);
  await logAudit("CREATE", "Source", source.id, `Created source: ${source.sourceName}`);
  res.json(source);
});

app.put("/api/sources/:id", async (req, res) => {
  const repo = AppDataSource.getRepository(InventorySource);
  let source = await repo.findOneBy({ id: req.params.id });
  if (!source) return res.status(404).json({ error: "Not found" });
  Object.assign(source, req.body);
  await repo.save(source);
  await logAudit("UPDATE", "Source", source.id, `Updated source: ${source.sourceName}`);
  res.json(source);
});

app.delete("/api/sources/:id", async (req, res) => {
  const repo = AppDataSource.getRepository(InventorySource);
  const source = await repo.findOneBy({ id: req.params.id });
  if (!source) return res.status(404).json({ error: "Not found" });
  await repo.remove(source);
  await logAudit("DELETE", "Source", req.params.id, `Deleted source: ${source.sourceName}`);
  res.json({ success: true });
});

// ─── BoxEntry Routes ───────────────────────────────────────
app.get("/api/entries", async (req, res) => {
  const repo = AppDataSource.getRepository(BoxEntry);
  const entries = await repo.find({ order: { entryDate: "DESC" } });
  res.json(entries);
});

app.get("/api/entries/:id", async (req, res) => {
  const repo = AppDataSource.getRepository(BoxEntry);
  const entry = await repo.findOneBy({ id: req.params.id });
  if (!entry) return res.status(404).json({ error: "Not found" });
  res.json(entry);
});

app.post("/api/entries", async (req, res) => {
  const repo = AppDataSource.getRepository(BoxEntry);
  const entry = repo.create(req.body) as any as BoxEntry;
  await repo.save(entry);
  await logAudit("CREATE", "BoxEntry", entry.id, `Bill ${entry.billNumber} – ${entry.customerName}`);
  res.json(entry);
});

app.put("/api/entries/:id", async (req, res) => {
  const repo = AppDataSource.getRepository(BoxEntry);
  let entry = await repo.findOneBy({ id: req.params.id });
  if (!entry) return res.status(404).json({ error: "Not found" });
  Object.assign(entry, req.body);
  await repo.save(entry);
  await logAudit("UPDATE", "BoxEntry", entry.id, `Updated Bill ${entry.billNumber}`);
  res.json(entry);
});

app.delete("/api/entries/:id", async (req, res) => {
  const repo = AppDataSource.getRepository(BoxEntry);
  const entry = await repo.findOneBy({ id: req.params.id });
  if (!entry) return res.status(404).json({ error: "Not found" });
  await repo.remove(entry);
  await logAudit("DELETE", "BoxEntry", req.params.id, `Deleted Bill ${entry.billNumber}`);
  res.json({ success: true });
});

// ─── Dashboard Stats ───────────────────────────────────────
// (For this prototype, it's easier to simply fetch all entries and compute stats locally in the frontend
//  or compute them here. Since the frontend logic already exists and we just need the data, we can 
//  let the frontend do `getDashboardStats()` locally after fetching APIs, OR we implement it here.)

// ─── Audit Log Routes ──────────────────────────────────────
// ─── CustomerArea Routes ─────────────────────────────────────
app.get("/api/customer-areas", async (req, res) => {
  const repo = AppDataSource.getRepository(CustomerArea);
  const areas = await repo.find({ order: { areaName: "ASC" } });
  res.json(areas);
});

app.get("/api/customer-areas/:id", async (req, res) => {
  const repo = AppDataSource.getRepository(CustomerArea);
  const area = await repo.findOneBy({ id: req.params.id });
  if (!area) return res.status(404).json({ error: "Not found" });
  res.json(area);
});

app.post("/api/customer-areas", async (req, res) => {
  const repo = AppDataSource.getRepository(CustomerArea);
  const area = repo.create(req.body) as any as CustomerArea;
  await repo.save(area);
  await logAudit("CREATE", "CustomerArea", area.id, `Created area: ${area.areaName}`);
  res.json(area);
});

app.put("/api/customer-areas/:id", async (req, res) => {
  const repo = AppDataSource.getRepository(CustomerArea);
  let area = await repo.findOneBy({ id: req.params.id });
  if (!area) return res.status(404).json({ error: "Not found" });
  Object.assign(area, req.body);
  await repo.save(area);
  await logAudit("UPDATE", "CustomerArea", area.id, `Updated area: ${area.areaName}`);
  res.json(area);
});

app.delete("/api/customer-areas/:id", async (req, res) => {
  const repo = AppDataSource.getRepository(CustomerArea);
  const area = await repo.findOneBy({ id: req.params.id });
  if (!area) return res.status(404).json({ error: "Not found" });
  await repo.remove(area);
  await logAudit("DELETE", "CustomerArea", req.params.id, `Deleted area: ${area.areaName}`);
  res.json({ success: true });
});

// ─── Audit Log Routes ──────────────────────────────────────
app.get("/api/audit", async (req, res) => {
  const repo = AppDataSource.getRepository(AuditLog);
  const logs = await repo.find({ order: { timestamp: "DESC" } });
  res.json(logs);
});

// ─── Auth Routes ────────────────────────────────────────────
app.post("/api/auth/login", async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ error: "Username and password required" });
  const repo = AppDataSource.getRepository(User);
  const user = await repo.findOneBy({ username });
  if (!user) return res.status(401).json({ error: "Invalid credentials" });
  if (!user.isActive) return res.status(401).json({ error: "Account is deactivated" });
  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) return res.status(401).json({ error: "Invalid credentials" });
  res.json({
    id: user.id,
    username: user.username,
    displayName: user.displayName,
    isAdmin: user.isAdmin,
    isSystemAdmin: user.isSystemAdmin,
  });
});

app.get("/api/auth/me", async (req, res) => {
  res.json({ loggedIn: false }); // sessionless, frontend manages auth state
});

// ─── User Management Routes ───────────────────────────────────
// Helper: load the calling user from session token
async function getCaller(req: express.Request): Promise<User | null> {
  const token = req.headers['authorization']?.replace('Bearer ', '');
  if (!token) return null;
  return AppDataSource.getRepository(User).findOneBy({ id: token });
}

app.get("/api/users", async (req, res) => {
  const repo = AppDataSource.getRepository(User);
  const users = await repo.find({ order: { displayName: "ASC" } });
  res.json(users.map(({ id, username, displayName, isAdmin, isSystemAdmin, isActive, createdAt }) => ({
    id, username, displayName, isAdmin, isSystemAdmin, isActive, createdAt,
  })));
});

app.post("/api/users", async (req, res) => {
  const { username, password, displayName, isAdmin } = req.body;
  if (!username || !password) return res.status(400).json({ error: "Username and password required" });
  const repo = AppDataSource.getRepository(User);

  // Check duplicate
  const exists = await repo.findOneBy({ username });
  if (exists) return res.status(400).json({ error: "Username already exists" });

  const hash = await bcrypt.hash(password, 10);
  const u = repo.create({ username, passwordHash: hash, displayName: displayName || username, isAdmin: !!isAdmin, isSystemAdmin: false, isActive: true });
  await repo.save(u);
  await logAudit("CREATE", "User", u.id, `Created user: ${u.username}`);
  res.json({ id: u.id, username: u.username, displayName: u.displayName, isAdmin: u.isAdmin, isSystemAdmin: u.isSystemAdmin, isActive: u.isActive });
});

app.put("/api/users/:id", async (req, res) => {
  const repo = AppDataSource.getRepository(User);
  let user = await repo.findOneBy({ id: req.params.id });
  if (!user) return res.status(404).json({ error: "Not found" });

  // No one can modify the System Admin account
  if (user.isSystemAdmin) return res.status(403).json({ error: "Cannot modify System Admin account" });

  if (req.body.password) req.body.passwordHash = await bcrypt.hash(req.body.password, 10);
  if (req.body.isAdmin !== undefined) Object.assign(user, { isAdmin: req.body.isAdmin });
  if (req.body.isSystemAdmin !== undefined && !req.body.isSystemAdmin) Object.assign(user, { isSystemAdmin: req.body.isSystemAdmin });
  if (req.body.isActive !== undefined) Object.assign(user, { isActive: req.body.isActive });
  if (req.body.displayName) Object.assign(user, { displayName: req.body.displayName });
  await repo.save(user);
  res.json({ id: user.id, username: user.username, displayName: user.displayName, isAdmin: user.isAdmin, isSystemAdmin: user.isSystemAdmin, isActive: user.isActive });
});

app.delete("/api/users/:id", async (req, res) => {
  const repo = AppDataSource.getRepository(User);
  const user = await repo.findOneBy({ id: req.params.id });
  if (!user) return res.status(404).json({ error: "Not found" });

  // Cannot delete System Admin
  if (user.isSystemAdmin) return res.status(403).json({ error: "Cannot delete System Admin account" });
  // Cannot delete Admin
  if (user.isAdmin && user.username === "Admin") return res.status(403).json({ error: "Cannot delete Admin account" });

  await repo.remove(user);
  await logAudit("DELETE", "User", user.id, `Deleted user: ${user.username}`);
  res.json({ success: true });
});

AppDataSource.initialize()
  .then(async () => {
    console.log("Data Source has been initialized!");

    // Seed default System Admin user
    try {
      const userRepo = AppDataSource.getRepository(User);
      const sysAdmin = await userRepo.findOneBy({ username: "System Admin" });
      if (!sysAdmin) {
        const hashed = await bcrypt.hash("Clasic@104", 10);
        const u = userRepo.create({ username: "System Admin", passwordHash: hashed, displayName: "System Admin", isAdmin: false, isSystemAdmin: true, isActive: true });
        await userRepo.save(u);
        console.log("[Seed] System Admin user created.");
      }

      // Seed Admin user
      const admin = await userRepo.findOneBy({ username: "Admin" });
      if (!admin) {
        const hashed = await bcrypt.hash("AS@traders", 10);
        const u = userRepo.create({ username: "Admin", passwordHash: hashed, displayName: "Admin", isAdmin: true, isSystemAdmin: false, isActive: true });
        await userRepo.save(u);
        console.log("[Seed] Admin user created.");
      }
    } catch (err) {
      console.error("[Seed] Error seeding admin users:", err);
    }

    // Backfill totalSentCount from existing entries (one-time migration only)
    try {
      const customerRepo = AppDataSource.getRepository(Customer);
      const entryRepo = AppDataSource.getRepository(BoxEntry);
      const allCustomers = await customerRepo.find();
      for (const customer of allCustomers) {
        if (customer.id && customer.customerName) {
          const entries = await entryRepo.findBy({ customerId: customer.id });
          const total = entries
            .filter(e => e.entryType === 'dispatch' || e.entryType === 'opening_balance')
            .reduce((sum, e) => sum + (e.totalBoxesSent || 0) + (e.currentQuantity || 0), 0);
          // Only backfill if the count is 0 and there are actual entries to migrate.
          // This respects user-initiated resets (which also set to 0) while populating
          // counts for customers who genuinely have entries but were never backfilled.
          if (customer.totalSentCount === 0 && total > 0) {
            customer.totalSentCount = total;
            await customerRepo.save(customer);
            console.log(`[Backfill] ${customer.customerName}: totalSentCount = ${total}`);
          }
        }
      }
      console.log("[Backfill] Sent count backfill complete.");
    } catch (err) {
      console.error("[Backfill] Error during sent count backfill:", err);
    }

    app.listen(3001, () => {
      console.log("Server is running on port 3001");
    });
  })
  .catch((err) => {
    console.error("Error during Data Source initialization:", err);
  });
