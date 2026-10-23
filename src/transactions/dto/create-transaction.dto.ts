export class CreateTransactionDto {

    amount!: number;
    type!: 'income' | 'expense' | 'transfer';
    date!: Date;
    description!: string | null;
    accountId!: string; // UUID of the Account
    toAccountId?: string; // UUID of the destination Account (optional, for transfers)
    categoryId?: string; // UUID of the Category (optional)

}
