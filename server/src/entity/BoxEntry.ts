import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from "typeorm";

@Entity()
export class BoxEntry {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column()
  billNumber!: string;

  @Column({ type: "date" })
  entryDate!: string;

  @Column()
  customerId!: string;

  @Column({ nullable: true })
  customerName?: string;

  @Column({ nullable: true })
  shopName?: string;

  @Column({ type: "text" })
  description!: string;

  @Column()
  entryType!: string; // 'opening_balance' | 'dispatch' | 'return'

  @Column("int")
  totalBoxesSent!: number;

  @Column("int")
  currentQuantity!: number;

  @Column("int")
  boxesReturned!: number;

  @Column("int")
  balanceBoxes!: number;

  @Column()
  driverName!: string;

  @Column()
  vehicleNumber!: string;

  @Column()
  isExternalSource!: boolean;

  @Column({ nullable: true })
  sourceId?: string;

  @Column({ nullable: true })
  sourceName?: string;

  @Column("int", { nullable: true })
  externalBoxCount?: number;

  @Column("int", { nullable: true })
  companyOwnQuantity?: number;

  @Column({ type: "json", nullable: true })
  openingStockSources?: any; // OpeningStockSource[]

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
