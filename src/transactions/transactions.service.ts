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

      let splitSummary: { category: string; allocated: number }[] | null = null;
      if (type === 'income') {
        const categories = await queryRunner.manager.find(Category);
        splitSummary = categories.map((cat) => ({
          category: cat.name,
          allocated: Number(((transactionAmount * Number(cat.target_percent)) / 100).toFixed(2)),
        }));
      }

      await queryRunner.commitTransaction();

      return {
        ...savedTransaction,
        pocketSplit: splitSummary,
      };

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

  // Calculate the Pocket Split based on the provided income amount 
  // and the target percentages of each category
  async calculatePocketSplit(incomeAmount: number) {
    const categories = await this.categoriesRepository.find();
    return categories.map((category) => {
      const percentage = Number(category.target_percent);
      const allocatedAmount = (incomeAmount * percentage) / 100;
      return {
        categoryId: category.id,
        categoryName: category.name,
        percentage,
        allocatedAmount: Number(allocatedAmount.toFixed(2)),
      };
    });
  }

}