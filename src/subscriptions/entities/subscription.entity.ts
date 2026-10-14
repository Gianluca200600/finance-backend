import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Account } from '../../accounts/entities/account.entity';
import { Category } from '../../categories/entities/category.entity';

@Entity('subscriptions')
export class Subscription {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  name!: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  amount!: number;

  @Column({ type: 'varchar', default: 'monthly' })
  billingCycle!: string; // 'weekly' | 'monthly' | 'yearly'

  @Column({ type: 'date' })
  nextChargeDate!: string;

  @Column({ type: 'boolean', default: true })
  active!: boolean;

  @ManyToOne(() => Account, { eager: true, onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'account_id' })
  account!: Account | null;

  @ManyToOne(() => Category, { eager: true, onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'category_id' })
  category!: Category | null;
}