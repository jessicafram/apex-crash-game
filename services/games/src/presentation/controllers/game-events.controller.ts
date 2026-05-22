import { Controller, Logger } from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';
import { PrismaService } from '../../infrastructure/database/prisma.service';

@Controller()
export class GameEventsController {
    private readonly logger = new Logger(GameEventsController.name);

    constructor(private readonly prisma: PrismaService) { }

    // 1. Quando a Carteira disser que debitou o dinheiro com sucesso:
    @EventPattern('bet.accepted')
    async handleBetAccepted(@Payload() data: { betId: string }) {
        this.logger.log(`✅ Aposta ${data.betId} aceita pela carteira! Aposta valendo!`);

        // Atualiza a aposta no banco para ACCEPTED
        await this.prisma.bet.update({
            where: { id: data.betId },
            data: { status: 'ACCEPTED' },
        });
    }

    // 2. Quando a Carteira disser que o cara tá sem saldo:
    @EventPattern('bet.rejected')
    async handleBetRejected(@Payload() data: { betId: string; reason: string }) {
        this.logger.warn(`❌ Aposta ${data.betId} rejeitada: ${data.reason}`);

        // Atualiza a aposta no banco para REJECTED
        await this.prisma.bet.update({
            where: { id: data.betId },
            data: { status: 'REJECTED' },
        });
    }
}