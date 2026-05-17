import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Card } from '../cards/card.entity';
import { User } from '../users/user.entity';

@Entity('expenses')
export class Expense {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ type: 'uuid' })
  cardId: string;

  @Index()
  @Column({ type: 'uuid' })
  userId: string;

  @Column({ type: 'varchar', length: 255 })
  concept: string;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  amount: number;

  @Index()
  @Column({ type: 'date' })
  transactionDate: string;

  @Column({ type: 'boolean', default: false })
  isMSI: boolean;

  @Column({ type: 'int', nullable: true })
  totalInstallments: number;

  @Column({ type: 'int', nullable: true })
  currentInstallment: number;

  @Index()
  @Column({ type: 'uuid', nullable: true })
  installmentGroupId: string;

  @Column({ type: 'boolean', default: false })
  isRecurring: boolean;

  @Column({ type: 'int', nullable: true })
  recurringTotalMonths: number;

  @Column({ type: 'int', nullable: true })
  recurringCurrentMonth: number;

  @Index()
  @Column({ type: 'uuid', nullable: true })
  recurringGroupId: string;

  @Column({ type: 'boolean', default: false })
  isSplit: boolean;

  @Index()
  @Column({ type: 'uuid', nullable: true })
  splitGroupId: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne(() => Card, (card) => card.expenses)
  @JoinColumn({ name: 'cardId' })
  card: Card;

  @ManyToOne(() => User, (user) => user.expenses)
  @JoinColumn({ name: 'userId' })
  user: User;
}
