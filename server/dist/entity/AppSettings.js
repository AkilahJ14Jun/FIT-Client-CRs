"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppSettings = void 0;
const typeorm_1 = require("typeorm");
let AppSettings = class AppSettings {
};
exports.AppSettings = AppSettings;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)("uuid"),
    __metadata("design:type", String)
], AppSettings.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: "FIT – Fish Inventory Tracking" }),
    __metadata("design:type", String)
], AppSettings.prototype, "companyName", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: "" }),
    __metadata("design:type", String)
], AppSettings.prototype, "companyAddress", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: "" }),
    __metadata("design:type", String)
], AppSettings.prototype, "companyPhone", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], AppSettings.prototype, "companyEmail", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], AppSettings.prototype, "traderName", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], AppSettings.prototype, "gstNumber", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: "BILL" }),
    __metadata("design:type", String)
], AppSettings.prototype, "billPrefix", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: "INR" }),
    __metadata("design:type", String)
], AppSettings.prototype, "currency", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: "dd MMM yyyy" }),
    __metadata("design:type", String)
], AppSettings.prototype, "dateFormat", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: true }),
    __metadata("design:type", Boolean)
], AppSettings.prototype, "autoBackup", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], AppSettings.prototype, "lastBackup", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: "light" }),
    __metadata("design:type", String)
], AppSettings.prototype, "theme", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: true }),
    __metadata("design:type", Boolean)
], AppSettings.prototype, "stockAlertEnabled", void 0);
__decorate([
    (0, typeorm_1.Column)("int", { default: 30 }),
    __metadata("design:type", Number)
], AppSettings.prototype, "stockAlertThreshold", void 0);
__decorate([
    (0, typeorm_1.Column)("int", { default: 50 }),
    __metadata("design:type", Number)
], AppSettings.prototype, "stockAlertThresholdCount", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: 'en' }),
    __metadata("design:type", String)
], AppSettings.prototype, "language", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], AppSettings.prototype, "stockAlertDismissedUntil", void 0);
exports.AppSettings = AppSettings = __decorate([
    (0, typeorm_1.Entity)()
], AppSettings);
