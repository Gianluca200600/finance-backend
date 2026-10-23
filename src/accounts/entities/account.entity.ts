import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity('accounts')
export class Account {

    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column()
    name!: string;

    @Column()
    type!: string;

    @Column(
        {
            type: 'decimal',
            precision: 10,
            scale: 2,
            default: 0
        }
    )
    balance!: number;

    @Column(
        {
            default: 'EUR'
        }
    )
    currency!: string;

}
