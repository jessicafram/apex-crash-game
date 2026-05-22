import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { WalletsController } from './presentation/controllers/wallets.controller';
import { WalletEventsController } from './presentation/controllers/wallet-events.controller';
import { DebitWalletUseCase } from './application/use-cases/debit-wallet.use-case';
import { CreditWalletUseCase } from './application/use-cases/credit-wallet.use-case';
import { PrismaWalletRepository } from './infrastructure/database/prisma-wallet.repository';
import { PrismaService } from './infrastructure/database/prisma.service';

@Module({
  imports: [
    // Registrando a nossa "boca" pra falar com o RabbitMQ
    ClientsModule.register([
      {
        name: 'RABBITMQ_SERVICE',
        transport: Transport.RMQ,
        options: {
          urls: [process.env.RABBITMQ_URL || 'amqp://admin:admin@localhost:5672'],
          queue: 'game_queue', // Onde o Jogo vai estar escutando
          queueOptions: { durable: true },
        },
      },
    ]),
  ],
  controllers: [WalletsController, WalletEventsController],
  providers: [
    DebitWalletUseCase,
    CreditWalletUseCase,
    PrismaWalletRepository,
    PrismaService,
    {
      provide: 'IWalletRepository',
      useExisting: PrismaWalletRepository,
    }
  ],
})
export class AppModule { }