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
  ) { }

  async create(dto: CreateSubscriptionDto): Promise<Subscription> {
    const sub = this.subscriptionsRepository.create({
      name: dto.name,
      amount: dto.amount,
      billingCycle: dto.billingCycle || 'monthly',
      nextChargeDate: dto.nextChargeDate,
      active: dto.active ?? true,
      account: dto.accountId ? ({ id: dto.accountId } as any) : null,
      category: dto.categoryId ? ({ id: dto.categoryId } as any) : null,
    });
    return this.subscriptionsRepository.save(sub);
  }

  async findAll(): Promise<Subscription[]> {
    return this.subscriptionsRepository.find({
      relations: {
        account: true,
        category: true
      }
    });
  }

  async findOne(id: string): Promise<Subscription | null> {
    return this.subscriptionsRepository.findOne({ where: { id } });
  }

  async remove(id: string): Promise<void> {
    await this.subscriptionsRepository.delete(id);
  }
}