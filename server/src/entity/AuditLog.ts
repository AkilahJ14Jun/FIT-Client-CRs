import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from "typeorm";

@Entity()
export class AuditLog {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column()
  action!: string; // 'CREATE' | 'UPDATE' | 'DELETE'

  @Column()
  entity!: string;

  @Column()
  entityId!: string;

  @Column({ type: "text" })
  summary!: string;

  @CreateDateColumn()
  timestamp!: Date;
}
