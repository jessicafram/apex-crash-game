import { Injectable, Inject } from '@nestjs/common';
import type { IWalletRepository } from '../../domain/repositories/wallet-repository.interface';

@Injectable()
export class DebitWalletUseCase {
    constructor(
        @Inject('IWalletRepository')
        private readonly walletRepository: IWalletRepository,
    ) { }

    async execute(userId: string, amountInCents: bigint, referenceId: string): Promise<void> {
        // Validação básica: Ninguém pode apostar R$ 0 ou valor negativo
        if (amountInCents <= 0n) {
            throw new Error('O valor do débito deve ser maior que zero.');
        }

        // O Repositório vai tentar debitar. Se não tiver saldo, ele lança a InsufficientFundsException
        await this.walletRepository.debit(userId, amountInCents, referenceId);
    }
}