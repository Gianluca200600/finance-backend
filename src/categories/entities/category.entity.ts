import { PrimaryGeneratedColumn, Column, Entity } from "typeorm";

@Entity('categories')
export class Category {

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
    target_percent!: number;

}
