import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from "typeorm";

@Entity()
export class InventorySource {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column()
  sourceName!: string;

  @Column()
  contactPerson!: string;

  @Column()
  mobile!: string;

  @Column()
  address!: string;

  @Column({ type: "text", nullable: true })
  notes?: string;

  @Column({ default: true })
  isActive!: boolean;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
