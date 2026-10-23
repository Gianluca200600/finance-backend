import { Controller, Post, HttpCode, HttpStatus } from '@nestjs/common';
import { DataSource } from 'typeorm';

@Controller('system')
export class AppController {

  constructor(private readonly dataSource: DataSource) { }

  @Post('reset-data')
  @HttpCode(HttpStatus.OK)
  async resetAllData() {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    try {
      // Svuota in cascata transazioni, abbonamenti e conti mantenendo la struttura
      await queryRunner.query('TRUNCATE TABLE transactions, subscriptions, accounts CASCADE;');
      return { message: 'Database cleared successfully' };
    } finally {
      await queryRunner.release();
    }
  }

}
