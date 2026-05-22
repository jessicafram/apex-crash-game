import { Injectable, Inject } from '@nestjs/common';
import type { IGameRepository } from '../../domain/repositories/game-repository.interface';
import { PrismaService } from './prisma.service';
import type { Bet } from '@prisma/client-games';
@Injectable()
export class PrismaGameRepository implements IGameRepository {
    constructor(@Inject(PrismaService) private readonly prisma: PrismaService) { }

    async placeBet(roundId: string, userId: string, amount: bigint): Promise<Bet> {
        // TRANSAÇÃO ACID COM OUTBOX PATTERN!
        return await this.prisma.$transaction(async (tx) => {
            // 1. Salva a aposta como "PENDING" (Pendente)
            const bet = await tx.bet.create({
                data: {
                    roundId,
                    userId,
                    amount,
                    status: 'PENDING'
                }
            });

            // 2. Salva o evento que vai para o RabbitMQ na mesma transação!
            // Se o banco cair agora, ele desfaz a aposta e não manda mensagem falsa pra carteira.
            await tx.outboxEvent.create({
                data: {
                    topic: 'wallet.debit',
                    payload: {
                        betId: bet.id,
                        userId: userId,
                        amount: amount.toString(), // Convertemos bigint para string para salvar no JSON
                        referenceId: bet.id
                    }
                }
            });

            return bet;
        });
    }
    // ... coloque logo abaixo da função placeBet que já está aí:

    async cashOut(betId: string, userId: string, cashOutMultiplier: number): Promise<Bet> {
        return await this.prisma.$transaction(async (tx) => {
            // 1. Acha a aposta que já foi aceita pela carteira
            const bet = await tx.bet.findFirst({
                where: { id: betId, userId: userId, status: 'ACCEPTED' }
            });

            if (!bet) throw new Error('Aposta não encontrada ou já finalizada.');

            // 2. Calcula o prêmio! (Aposta * Multiplicador)
            const winAmount = BigInt(Math.floor(Number(bet.amount) * cashOutMultiplier));

            // 3. Atualiza a aposta pra CASHED_OUT (vencedora)
            const updatedBet = await tx.bet.update({
                where: { id: bet.id },
                data: {
                    status: 'CASHED_OUT',
                    cashOutMultiplier: cashOutMultiplier,
                    winAmount: winAmount
                }
            });

            // 4. Manda a carta pra Carteira dar o prêmio pro jogador!
            await tx.outboxEvent.create({
                data: {
                    topic: 'wallet.credit',
                    payload: {
                        betId: bet.id,
                        userId: userId,
                        amount: winAmount.toString(),
                        referenceId: bet.id
                    }
                }
            });

            return updatedBet;
        });
    }

    async createRound(serverSeed: string, crashPoint: any) {
        return await this.prisma.round.create({
            data: {
                status: 'BETTING_PHASE',
                serverSeed,
                crashPoint
            }
        });
    }
}
