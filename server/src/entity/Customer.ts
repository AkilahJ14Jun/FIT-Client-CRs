import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from "typeorm";

@Entity()
export class Customer {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column()
  customerName!: string;

  @Column()
  shopName!: string;

  @Column()
  address!: string;

  @Column()
  mobile!: string;

  @Column({ nullable: true })
  alternateMobile?: string;

  @Column({ nullable: true })
  email?: string;

  @Column({ type: "text", nullable: true })
  notes?: string;

  @Column({ type: "varchar", nullable: true })
  areaId?: string;

  @Column({ default: 0 })
  totalSentCount!: number;

  @Column({ default: true })
  isActive!: boolean;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
