import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {

const app = await NestFactory.create(AppModule);
  
  // Abilita le chiamate cross-origin per Angular (localhost:4200)
  app.enableCors({
    origin: ['http://localhost:4200', 'http://127.0.0.1:4200'],
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });

  await app.listen(3000);

}
bootstrap();
