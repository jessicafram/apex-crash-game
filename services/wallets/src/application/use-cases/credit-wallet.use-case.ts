import { Injectable, Inject } from '@nestjs/common';
import type { IWalletRepository } from '../../domain/repositories/wallet-repository.interface';

@Injectable()
export class CreditWalletUseCase {
    constructor(
        @Inject('IWalletRepository')
        private readonly walletRepository: IWalletRepository,
    ) { }

    async execute(userId: string, amountInCents: bigint, referenceId: string, type: 'DEPOSIT' | 'WIN' = 'DEPOSIT'): Promise<void> {
        // Ninguém pode depositar valor negativo ou zero
        if (amountInCents <= 0n) {
            throw new Error('O valor do crédito deve ser maior que zero.');
        }

        await this.walletRepository.credit(userId, amountInCents, referenceId);
    }
}