import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateAccountDto } from './dto/create-account.dto';
import { UpdateAccountDto } from './dto/update-account.dto';
import { Account } from './entities/account.entity';

@Injectable()
export class AccountsService {

  constructor(

    @InjectRepository(Account)
    private readonly accountsRepository: Repository<Account>,

  ) {}

  async create(createAccountDto: CreateAccountDto): Promise<Account> {
    
    const newAccount = this.accountsRepository.create(createAccountDto);
    return this.accountsRepository.save(newAccount);

  }

  async findAll(): Promise<Account[]> {

    return this.accountsRepository.find();
  
  }

  findOne(id: string): Promise<Account | null> {

    return this.accountsRepository.findOne({
      where: { id } 
    });

  }

  async remove(id: string): Promise<void> {
    
    await this.accountsRepository.delete(id);
  
  }

}
