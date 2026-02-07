import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from './user.entity';

@Entity('audit_logs')
export class AuditLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  userId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column()
  organizationId: string;

  @Column()
  action: string; // e.g., 'CREATE', 'UPDATE', 'DELETE'

  @Column()
  resource: string; // e.g., 'task', 'user'

  @Column()
  resourceId: string;

  @Column({ type: 'text', nullable: true })
  details?: string; // JSON stringified data

  @CreateDateColumn()
  timestamp: Date;
}
