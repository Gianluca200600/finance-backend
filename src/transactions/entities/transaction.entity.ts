import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Category } from '../../categories/entities/category.entity';
import { Account } from '../../accounts/entities/account.entity';

@Entity('transactions')
export class Transaction {

    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ type: 'decimal', precision: 10, scale: 2 })
    amount!: number;

    @Column()
    type!: 'income' | 'expense' | 'transfer';

    @Column({ type: 'timestamp' })
    date!: Date;

    @Column({ type: 'varchar', nullable: true })
    description!: string | null;


    // RELATIONS
    @ManyToOne(
        () => Account, {eager: true, onDelete: 'CASCADE' }
    )
    @JoinColumn(
        { name: 'account_id' }
    )
    account!: Account;

    @ManyToOne(
        () => Category, {eager: true, onDelete: 'SET NULL', nullable: true }
    )
    @JoinColumn(
        { name: 'category_id' }
    )
    category!: Category | null;

}
