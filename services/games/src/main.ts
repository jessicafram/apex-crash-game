import 'reflect-metadata';
import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Transport, MicroserviceOptions } from '@nestjs/microservices';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const rabbitMqUrl = process.env.RABBITMQ_URL || 'amqp://admin:admin@localhost:5672';
  const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 4001;

  // O Jogo também ouve o RabbitMQ (para saber se a aposta foi aceita ou negada)
  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.RMQ,
    options: {
      urls: [rabbitMqUrl],
      queue: 'game_queue',
      queueOptions: { durable: true },
    },
  });

  await app.startAllMicroservices();
  await app.listen(port);
  console.log(`🎮 Game Service rodando na porta ${port} com RabbitMQ ativado!`);
}
bootstrap();