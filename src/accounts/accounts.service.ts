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

  ) { }

  async create(createAccountDto: CreateAccountDto): Promise<Account> {

    const newAccount = this.accountsRepository.create(createAccountDto);
    return this.accountsRepository.save(newAccount);

  }

  async findAll(): Promise<Account[]> {

    return this.accountsRepository.find();

  }

  async findOne(id: string): Promise<Account | null> {

    return this.accountsRepository.findOne({
      where: { id }
    });

  }

  async remove(id: string): Promise<void> {

    await this.accountsRepository.delete(id);

  }

  async getAccountTrend(accountId: string, range: '7D' | '1M' | '3M' | '1Y') {
    const intervals: Record<string, string> = {
      '7D': '7 days',
      '1M': '1 month',
      '3M': '3 months',
      '1Y': '1 year',
    };
    const interval = intervals[range] || '1 month';

    // 1. Recupera il conto per conoscere il saldo attuale
    const account = await this.accountsRepository.findOne({ where: { id: accountId } });
    if (!account) return [];

    const currentBal = Number(account.balance || 0);

    // 2. Query che estrae le variazioni nette per ogni data presente
    const query = `
    SELECT 
      DATE(t.date) as change_date,
      SUM(
        CASE 
          WHEN t.type = 'income' AND t.account_id = $1 THEN t.amount
          WHEN t.type = 'expense' AND t.account_id = $1 THEN -t.amount
          WHEN t.type = 'transfer' AND t.to_account_id = $1 THEN t.amount
          WHEN t.type = 'transfer' AND t.account_id = $1 THEN -t.amount
          ELSE 0 
        END
      ) as net_delta
    FROM transactions t
    WHERE (t.account_id = $1 OR t.to_account_id = $1)
      AND t.date >= NOW() - INTERVAL '${interval}'
    GROUP BY DATE(t.date)
    ORDER BY change_date DESC;
  `;

    const rawRows: { change_date: string; net_delta: string }[] =
      await this.accountsRepository.query(query, [accountId]);

    const startDate = new Date();
    if (range === '7D') startDate.setDate(startDate.getDate() - 7);
    else if (range === '1M') startDate.setMonth(startDate.getMonth() - 1);
    else if (range === '3M') startDate.setMonth(startDate.getMonth() - 3);
    else if (range === '1Y') startDate.setFullYear(startDate.getFullYear() - 1);

    const todayStr = new Date().toISOString().split('T')[0];
    const startStr = startDate.toISOString().split('T')[0];

    // 3. Se non ci sono movimenti nel periodo, restituisce estremi con saldo costante
    if (!rawRows || rawRows.length === 0) {
      return [
        { date: startStr, balance: currentBal },
        { date: todayStr, balance: currentBal },
      ];
    }

    // 4. Ricostruzione del saldo progressivo a ritroso
    let running = currentBal;
    const points: { date: string; balance: number }[] = [
      { date: todayStr, balance: running }
    ];

    for (const row of rawRows) {
      const rowDate = new Date(row.change_date).toISOString().split('T')[0];
      if (rowDate !== todayStr) {
        points.push({
          date: rowDate,
          balance: Math.round(running * 100) / 100,
        });
      }
      const delta = Number(row.net_delta || 0);
      running -= delta;
    }

    points.push({
      date: startStr,
      balance: Math.round(running * 100) / 100,
    });

    return points.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }

}
