import { Injectable, Inject, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../database/prisma.service';
import { ClientProxy } from '@nestjs/microservices';

@Injectable()
export class OutboxWorker {
    private readonly logger = new Logger(OutboxWorker.name);

    constructor(
        private readonly prisma: PrismaService,
        @Inject('RABBITMQ_SERVICE') private readonly rabbitClient: ClientProxy,
    ) { }

    @Cron(CronExpression.EVERY_SECOND)
    async processOutboxEvents() {
        // 1. Procura as apostas que não foram enviadas pro RabbitMQ ainda
        const events = await this.prisma.outboxEvent.findMany({
            where: { published: false },
            take: 10,
        });

        if (events.length === 0) return; // Se não tem carta, volta a dormir

        this.logger.log(`Encontrados ${events.length} eventos no Outbox. Processando...`);

        for (const event of events) {
            try {
                // 2. Manda pro RabbitMQ! (O subscribe() garante que a mensagem sai)
                this.rabbitClient.emit(event.topic, event.payload).subscribe();

                // 3. Marca no banco que já enviou
                await this.prisma.outboxEvent.update({
                    where: { id: event.id },
                    data: { published: true },
                });

                this.logger.log(`Evento ${event.id} publicado com sucesso!`);
            } catch (error) {
                this.logger.error(`Erro ao publicar evento:`, error);
            }
        }
    }
}