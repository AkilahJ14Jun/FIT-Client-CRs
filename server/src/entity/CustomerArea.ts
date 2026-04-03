import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from "typeorm";

@Entity()
export class CustomerArea {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column()
  areaName!: string;

  @Column({ nullable: true })
  notes?: string;

  @Column({ default: true })
  isActive!: boolean;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
