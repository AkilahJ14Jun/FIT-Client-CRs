import "reflect-metadata";
import * as dotenv from "dotenv";
dotenv.config();
import { DataSource } from "typeorm";
import { Customer } from "./entity/Customer";
import { InventorySource } from "./entity/InventorySource";
import { BoxEntry } from "./entity/BoxEntry";
import { AppSettings } from "./entity/AppSettings";
import { AuditLog } from "./entity/AuditLog";
import { CustomerArea } from "./entity/CustomerArea";
import { User } from "./entity/User";

export const AppDataSource = new DataSource({
  type: "mysql",
  host: process.env.DB_HOST || "localhost",
  port: Number(process.env.DB_PORT) || 3308,
  username: process.env.DB_USER || "fit_user",
  password: process.env.DB_PASSWORD || "fit_password",
  database: process.env.DB_NAME || "fit_db",
  synchronize: true, // Auto-create tables based on entities
  logging: false,
  entities: [Customer, InventorySource, BoxEntry, AppSettings, AuditLog, CustomerArea, User],
  migrations: [],
  subscribers: [],
});
