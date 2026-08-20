export class CreateTransactionDto {

    amount!: number;
    type!: 'income' | 'expense' | 'transfer';
    date!: Date;
    description!: string | null;

    accountId!: string; // UUID of the Account
    categoryId?: string; // UUID of the Category (optional)

}
