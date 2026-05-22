import { Injectable } from '@nestjs/common';
import { TransactionType } from '@prisma/client'; // Importando o Enum oficial do Prisma
import type { IWalletRepository } from '../../domain/repositories/wallet-repository.interface';
import { InsufficientFundsException } from '../../domain/exceptions/insufficient-funds.exception';
import { PrismaService } from './prisma.service';

@Injectable()
export class PrismaWalletRepository implements IWalletRepository {

    constructor(private readonly prisma: PrismaService) { }

    async debit(userId: string, amount: bigint, reference: string): Promise<void> {
        await this.prisma.$transaction(async (tx) => {
            const result = await tx.wallet.updateMany({
                where: {
                    userId: userId,
                    balance: { gte: amount }
                },
                data: {
                    balance: { decrement: amount } // O Prisma cuida do updatedAt automaticamente!
                }
            });

            if (result.count === 0) {
                throw new InsufficientFundsException();
            }

            await tx.walletTransaction.create({
                data: {
                    walletId: (await this.getWalletId(tx, userId)),
                    amount: -amount,
                    type: TransactionType.BET, // Usando o Enum!
                    reference: reference,
                }
            });
        });
    }

    async credit(userId: string, amount: bigint, reference: string): Promise<void> {
        await this.prisma.$transaction(async (tx) => {

            const wallet = await tx.wallet.upsert({
                where: { userId: userId },
                update: {
                    balance: { increment: amount }
                },
                create: {
                    userId: userId,
                    balance: amount,
                }
            });

            await tx.walletTransaction.create({
                data: {
                    walletId: wallet.id,
                    amount: amount,
                    type: TransactionType.DEPOSIT, // Usando o Enum!
                    reference: reference,
                }
            });
        });
    }

    async getBalance(userId: string): Promise<bigint> {
        // Corrigido para "this.prisma"
        const wallet = await this.prisma.wallet.findUnique({ where: { userId } });
        return wallet?.balance ?? 0n;
    }

    private async getWalletId(tx: any, userId: string): Promise<string> {
        const wallet = await tx.wallet.findUnique({ where: { userId }, select: { id: true } });
        if (!wallet) throw new Error("Carteira não encontrada");
        return wallet.id;
    }
}