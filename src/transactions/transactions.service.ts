import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { Transaction } from './entities/transaction.entity';
import { Account } from '../accounts/entities/account.entity';
import { Category } from '../categories/entities/category.entity';

@Injectable()
export class TransactionsService {
  
  constructor(

    @InjectRepository(Transaction)
    private readonly transactionsRepository: Repository<Transaction>,
    @InjectRepository(Account)
    private readonly accountsRepository: Repository<Account>,
    @InjectRepository(Category)
    private readonly categoriesRepository: Repository<Category>,
    private readonly dataSource: DataSource, // We need this for database transactions later
  
  ) {}

  async create(createTransactionDto: CreateTransactionDto) {
    
    const { amount, type, date, description, accountId, categoryId } = createTransactionDto;

    // Initialize the Database Transaction Runner
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {

      // Fetch the associated Account
      const account = await queryRunner.manager.findOne(Account, { 
        where: { id: accountId } 
      });
      if(!account) {
        throw new NotFoundException(`Account with ID ${accountId} not found`);
      }

      // Fetch the associated Category if provided
      let category: Category | null = null;
      if (categoryId) {
        category = await queryRunner.manager.findOne(Category, {
          where: { id: categoryId },
        });
        if (!category) {
          throw new NotFoundException(`Category with ID ${categoryId} not found`);
        }
      }

      // Calculate new balance
      const currentBalance = account.balance;
      const transactionAmount = amount;

      if (type === 'income')
        account.balance = currentBalance + transactionAmount;
      else if (type === 'expense')
        account.balance = currentBalance - transactionAmount;
      else if (type === 'transfer') {
        // For transfer, we might need to handle it differently, but for now, let's just log it.
        console.log('Transfer type transaction detected. Handle accordingly.');
      }

      // Ensure the balance doesn't go negative
      if (account.balance < 0) {
        throw new Error('Insufficient funds for this transaction');
      }

      // Save the updated account balance
      await queryRunner.manager.save(account);

      // Create the transaction
      const transaction = queryRunner.manager.create(Transaction, {
        amount: transactionAmount,
        type,
        date,
        description,
        account,
        category: category || null,
      });
      const savedTransaction = await queryRunner.manager.save(transaction);

      // Commit the transaction
      await queryRunner.commitTransaction();

      return savedTransaction;

    } catch (error) {

      await queryRunner.rollbackTransaction();
      throw error;

    } finally {

      await queryRunner.release();

    }

  }

  async findAll(): Promise<Transaction[]> {
    
    return this.transactionsRepository.find();
  
  }

  // Changed id from number to string
  async findOne(id: string): Promise<Transaction | null> {
    
    return this.transactionsRepository.findOne({ where: { id } });
  
  }

  // Changed id from number to string
  async remove(id: string): Promise<void> {
    
    await this.transactionsRepository.delete(id);
  
  }

}