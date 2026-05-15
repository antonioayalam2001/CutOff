import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn,
  ManyToOne, JoinColumn, OneToMany,
} from 'typeorm';
import { Group } from '../groups/group.entity';
import { Expense } from '../expenses/expense.entity';

@Entity('cards')
export class Card {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  groupId: string;

  @Column({ type: 'varchar', length: 100 })
  name: string;

  @Column({ type: 'varchar', length: 4 })
  lastFourDigits: string;

  @Column({ type: 'int' })
  cutOffDay: number;

  @Column({ type: 'int' })
  paymentDeadlineDay: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne(() => Group, (group) => group.cards)
  @JoinColumn({ name: 'groupId' })
  group: Group;

  @OneToMany(() => Expense, (expense) => expense.card)
  expenses: Expense[];
}
