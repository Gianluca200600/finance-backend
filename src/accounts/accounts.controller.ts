import { Controller, Get, Post, Body, Param, Delete, Query } from '@nestjs/common';
import { AccountsService } from './accounts.service';
import { CreateAccountDto } from './dto/create-account.dto';

@Controller('accounts')
export class AccountsController {

  constructor(private readonly accountsService: AccountsService) { }

  @Post()
  create(@Body() createAccountDto: CreateAccountDto) {
    return this.accountsService.create(createAccountDto);
  }

  @Get()
  findAll() {
    return this.accountsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    // We removed the '+' so the UUID remains a string
    return this.accountsService.findOne(id);
  }

  @Get(':id/history-trend')
  getTrend(
    @Param('id') id: string,
    @Query('range') range: '7D' | '1M' | '3M' | '1Y',
  ) {
    return this.accountsService.getAccountTrend(id, range || '1M');
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.accountsService.remove(id);
  }

}