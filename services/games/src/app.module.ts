import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { ScheduleModule } from '@nestjs/schedule';
import { GamesController } from './presentation/controllers/games.controller';
import { GameEventsController } from './presentation/controllers/game-events.controller';
import { GameGateway } from './presentation/gateways/game.gateway';
import { PlaceBetUseCase } from './application/use-cases/place-bet.use-case';
import { CashOutUseCase } from './application/use-cases/cash-out.use-case';
import { PrismaGameRepository } from './infrastructure/database/prisma-game.repository';
import { PrismaService } from './infrastructure/database/prisma.service';
import { OutboxWorker } from './infrastructure/messaging/outbox.worker';
import { GameEngineService } from './application/services/game-engine.service';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    ClientsModule.register([
      {
        name: 'RABBITMQ_SERVICE',
        transport: Transport.RMQ,
        options: {
          urls: [process.env.RABBITMQ_URL || 'amqp://admin:admin@localhost:5672'],
          queue: 'wallet_queue',
          queueOptions: { durable: true },
        },
      },
    ]),
  ],
  controllers: [GamesController, GameEventsController],
  providers: [
    GameGateway,
    GameEngineService,
    PlaceBetUseCase,
    CashOutUseCase,
    PrismaGameRepository,
    PrismaService,
    OutboxWorker,
    {
      provide: 'IGameRepository',
      useExisting: PrismaGameRepository,
    }
  ],
})
export class AppModule { }