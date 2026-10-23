import { PartialType } from '@nestjs/mapped-types';
import { CreateAccountDto } from './create-account.dto';

export class UpdateAccountDto extends PartialType(CreateAccountDto) {

    amount?: number;
    type?: 'income' | 'expense' | 'transfer';
    date?: string;
    description?: string;
    accountId?: string;
    toAccountId?: string;
    categoryId?: string;

}
