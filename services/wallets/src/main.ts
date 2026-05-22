import 'dotenv/config'; 
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Transport, MicroserviceOptions } from '@nestjs/microservices';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Garantindo os tipos exatos pro TypeScript parar de chorar
  const rabbitMqUrl = process.env.RABBITMQ_URL || 'amqp://admin:admin@localhost:5672';
  const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 4002;

  // Ligando a antena do RabbitMQ!
  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.RMQ,
    options: {
      urls: [rabbitMqUrl],
      queue: 'wallet_queue',
      queueOptions: { durable: true },
    },
  });

  await app.startAllMicroservices();
  await app.listen(port);
  console.log(`🚀 Wallet Service rodando na porta ${port} com RabbitMQ ativado!`);
}
bootstrap();