import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { Transaction } from './entities/transaction.entity';
import { Account } from '../accounts/entities/account.entity';
import { Category } from '../categories/entities/category.entity';
import { UpdateTransactionDto } from './dto/update-transaction.dto';

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

  ) { }

  async create(createTransactionDto: CreateTransactionDto) {
    const { amount, type, date, description, accountId, toAccountId, categoryId } = createTransactionDto;

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // 1. Recupera il conto di origine
      const account = await queryRunner.manager.findOne(Account, {
        where: { id: accountId },
      });
      if (!account) {
        throw new NotFoundException(`Account with ID ${accountId} not found`);
      }

      const transactionAmount = Number(amount);
      let toAccount: Account | null = null;

      // 2. Logica in base al tipo
      const normalizedType = (type || '').toLowerCase();

      if (normalizedType === 'income') {
        account.balance = Number(account.balance) + transactionAmount;
        await queryRunner.manager.save(account);

      } else if (normalizedType === 'expense') {
        account.balance = Number(account.balance) - transactionAmount;
        await queryRunner.manager.save(account);

      } else if (normalizedType === 'transfer') {
        if (!toAccountId) {
          throw new BadRequestException('toAccountId is required for transfer transactions');
        }
        if (toAccountId === accountId) {
          throw new BadRequestException('Source and destination accounts must be different');
        }

        toAccount = await queryRunner.manager.findOne(Account, {
          where: { id: toAccountId },
        });
        if (!toAccount) {
          throw new NotFoundException(`Destination account with ID ${toAccountId} not found`);
        }

        // Scala dal conto di origine e accredita sul conto di destinazione
        account.balance = Number(account.balance) - transactionAmount;
        toAccount.balance = Number(toAccount.balance) + transactionAmount;

        await queryRunner.manager.save(account);
        await queryRunner.manager.save(toAccount);
      }

      // 3. Categoria (opzionale)
      let category: Category | null = null;
      if (categoryId) {
        category = await queryRunner.manager.findOne(Category, {
          where: { id: categoryId },
        });
      }

      // 4. Salva la transazione
      const transaction = queryRunner.manager.create(Transaction, {
        amount: transactionAmount,
        type: normalizedType as 'income' | 'expense' | 'transfer',
        date,
        description: description || (normalizedType === 'transfer' ? `Transfer to ${toAccount?.name}` : 'Movement'),
        account,
        toAccount,
        category,
      });

      const savedTransaction = await queryRunner.manager.save(transaction);

      await queryRunner.commitTransaction();
      return savedTransaction;

    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async update(id: string, dto: UpdateTransactionDto): Promise<Transaction> {
  const queryRunner = this.dataSource.createQueryRunner();
  await queryRunner.connect();
  await queryRunner.startTransaction();

  try {
    const existingTx = await queryRunner.manager.findOne(Transaction, {
      where: { id },
      relations: ['account', 'toAccount', 'category'] as any,
    });

    if (!existingTx) {
      throw new NotFoundException(`Transazione ${id} non trovata`);
    }

    const oldAmount = Number(existingTx.amount);
    const oldType = existingTx.type;

    // remove old
    const oldSourceAccount = await queryRunner.manager.findOne(Account, {
      where: { id: existingTx.account.id },
    });

    if (oldSourceAccount) {
      if (oldType === 'expense') {
        oldSourceAccount.balance = Number(oldSourceAccount.balance) + oldAmount;
      } else if (oldType === 'income') {
        oldSourceAccount.balance = Number(oldSourceAccount.balance) - oldAmount;
      } else if (oldType === 'transfer') {
        // Ripristina l'origine restituendo i fondi
        oldSourceAccount.balance = Number(oldSourceAccount.balance) + oldAmount;
        // Ripristina la destinazione togliendo i fondi
        if (existingTx.toAccount) {
          const oldDestAccount = await queryRunner.manager.findOne(Account, {
            where: { id: existingTx.toAccount.id },
          });
          if (oldDestAccount) {
            oldDestAccount.balance = Number(oldDestAccount.balance) - oldAmount;
            await queryRunner.manager.save(oldDestAccount);
          }
        }
      }
      await queryRunner.manager.save(oldSourceAccount);
    }

    // find new
    const newType = dto.type || existingTx.type;
    const newAmount = dto.amount !== undefined ? Number(dto.amount) : oldAmount;
    const targetAccountId = dto.accountId || existingTx.account.id;

    // Recupera il conto di origine/principale aggiornato
    const targetAccount = (targetAccountId === oldSourceAccount?.id)
      ? oldSourceAccount
      : await queryRunner.manager.findOne(Account, { where: { id: targetAccountId } });

    if (!targetAccount) {
      throw new NotFoundException('Conto principale non trovato');
    }

    let targetToAccount: Account | null = null;

    // update correction
    if (newType === 'expense') {
      targetAccount.balance = Number(targetAccount.balance) - newAmount;
    } else if (newType === 'income') {
      targetAccount.balance = Number(targetAccount.balance) + newAmount;
    } else if (newType === 'transfer') {
      const targetToId = dto.toAccountId || existingTx.toAccount?.id;
      if (!targetToId) {
        throw new BadRequestException('Il conto di destinazione (toAccountId) è obbligatorio per i trasferimenti');
      }
      if (targetToId === targetAccount.id) {
        throw new BadRequestException('Il conto di origine e di destinazione non possono coincidere');
      }

      targetToAccount = await queryRunner.manager.findOne(Account, { where: { id: targetToId } });
      if (!targetToAccount) {
        throw new NotFoundException('Conto di destinazione non trovato');
      }

      // Addebito sul conto sorgente e accredito su quello ricevente
      targetAccount.balance = Number(targetAccount.balance) - newAmount;
      targetToAccount.balance = Number(targetToAccount.balance) + newAmount;
      await queryRunner.manager.save(targetToAccount);
    }
    await queryRunner.manager.save(targetAccount);

    // update category
    let category = existingTx.category;
    if (newType === 'transfer') {
      category = null; // Nessuna categoria per i trasferimenti tra conti
    } else if (dto.categoryId !== undefined) {
      category = dto.categoryId
        ? await queryRunner.manager.findOne(Category, { where: { id: dto.categoryId } })
        : null;
    }

    // save correction
    existingTx.amount = newAmount;
    existingTx.type = newType;
    if (dto.date) existingTx.date = dto.date;
    if (dto.description !== undefined) existingTx.description = dto.description;
    existingTx.account = targetAccount;
    existingTx.toAccount = newType === 'transfer' ? targetToAccount : null;
    existingTx.category = category;

    const saved = await queryRunner.manager.save(existingTx);
    await queryRunner.commitTransaction();
    return saved;
  } catch (err) {
    await queryRunner.rollbackTransaction();
    throw err;
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