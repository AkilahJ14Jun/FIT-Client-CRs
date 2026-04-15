"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppDataSource = void 0;
require("reflect-metadata");
const dotenv = __importStar(require("dotenv"));
dotenv.config();
const typeorm_1 = require("typeorm");
const Customer_1 = require("./entity/Customer");
const InventorySource_1 = require("./entity/InventorySource");
const BoxEntry_1 = require("./entity/BoxEntry");
const AppSettings_1 = require("./entity/AppSettings");
const AuditLog_1 = require("./entity/AuditLog");
const CustomerArea_1 = require("./entity/CustomerArea");
const User_1 = require("./entity/User");
exports.AppDataSource = new typeorm_1.DataSource({
    type: "mysql",
    host: process.env.DB_HOST || "localhost",
    port: Number(process.env.DB_PORT) || 3308,
    username: process.env.DB_USER || "fit_user",
    password: process.env.DB_PASSWORD || "fit_password",
    database: process.env.DB_NAME || "fit_db",
    synchronize: true, // Auto-create tables based on entities
    logging: false,
    entities: [Customer_1.Customer, InventorySource_1.InventorySource, BoxEntry_1.BoxEntry, AppSettings_1.AppSettings, AuditLog_1.AuditLog, CustomerArea_1.CustomerArea, User_1.User],
    migrations: [],
    subscribers: [],
});
