import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Subscription } from './entities/subscription.entity';
import { CreateSubscriptionDto } from './dto/create-subscription.dto';
import { Account } from '../accounts/entities/account.entity';
import { Category } from '../categories/entities/category.entity';

@Injectable()
export class SubscriptionsService {
  constructor(
    @InjectRepository(Subscription)
    private readonly subscriptionsRepository: Repository<Subscription>,
    @InjectRepository(Account)
    private readonly accountsRepository: Repository<Account>,
    @InjectRepository(Category)
    private readonly categoriesRepository: Repository<Category>,
  ) {}

  async create(createSubscriptionDto: CreateSubscriptionDto): Promise<Subscription> {
    const { accountId, categoryId, ...rest } = createSubscriptionDto;

    let account: Account | null = null;
    if (accountId) {
      account = await this.accountsRepository.findOne({ where: { id: accountId } });
      if (!account) throw new NotFoundException(`Account with ID ${accountId} not found`);
    }

    let category: Category | null = null;
    if (categoryId) {
      category = await this.categoriesRepository.findOne({ where: { id: categoryId } });
      if (!category) throw new NotFoundException(`Category with ID ${categoryId} not found`);
    }

    const subscription = this.subscriptionsRepository.create({
      ...rest,
      account,
      category,
    });

    return this.subscriptionsRepository.save(subscription);
  }

  async findAll(): Promise<Subscription[]> {
    return this.subscriptionsRepository.find();
  }

  async findOne(id: string): Promise<Subscription | null> {
    return this.subscriptionsRepository.findOne({ where: { id } });
  }

  async remove(id: string): Promise<void> {
    await this.subscriptionsRepository.delete(id);
  }
}