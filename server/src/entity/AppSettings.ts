import { Entity, PrimaryGeneratedColumn, Column } from "typeorm";

@Entity()
export class AppSettings {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ default: "FIT – Fish Inventory Tracking" })
  companyName!: string;

  @Column({ default: "" })
  companyAddress!: string;

  @Column({ default: "" })
  companyPhone!: string;

  @Column({ nullable: true })
  companyEmail?: string;

  @Column({ nullable: true })
  traderName?: string;

  @Column({ nullable: true })
  gstNumber?: string;

  @Column({ default: "BILL" })
  billPrefix!: string;

  @Column({ default: "INR" })
  currency!: string;

  @Column({ default: "dd MMM yyyy" })
  dateFormat!: string;

  @Column({ default: true })
  autoBackup!: boolean;

  @Column({ nullable: true })
  lastBackup?: string;

  @Column({ default: "light" })
  theme!: string;

  @Column({ default: true })
  stockAlertEnabled!: boolean;

  @Column("int", { default: 30 })
  stockAlertThreshold!: number;

  @Column({ default: 'en' })
  language!: string;

  @Column({ nullable: true })
  stockAlertDismissedUntil?: string;
}
