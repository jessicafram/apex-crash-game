import { Injectable, Inject } from '@nestjs/common';
import type { IGameRepository } from '../../domain/repositories/game-repository.interface';

@Injectable()
export class PlaceBetUseCase {
    constructor(
        @Inject('IGameRepository')
        private readonly gameRepository: IGameRepository,
    ) { }

    async execute(roundId: string, userId: string, amountInCents: bigint) {
        // Validações de negócio exigidas no desafio!
        if (amountInCents < 100n) {
            throw new Error('Aposta mínima é de R$ 1,00 (100 centavos).');
        }
        if (amountInCents > 100000n) {
            throw new Error('Aposta máxima é de R$ 1000,00 (100000 centavos).');
        }

        return await this.gameRepository.placeBet(roundId, userId, amountInCents);
    }
}