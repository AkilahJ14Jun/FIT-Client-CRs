import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from "typeorm";

@Entity()
export class InventorySource {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column()
  sourceName!: string;

  @Column({ nullable: true })
  contactPerson!: string;

  @Column({ nullable: true })
  mobile!: string;

  @Column({ nullable: true })
  address!: string;

  @Column({ type: "text", nullable: true })
  notes?: string;

  @Column({ default: true })
  isActive!: boolean;

  @Column({ default: 0 })
  stockThreshold!: number;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
