import { Injectable, Inject } from '@nestjs/common';
import type { IGameRepository } from '../../domain/repositories/game-repository.interface';

@Injectable()
export class CashOutUseCase {
    constructor(
        @Inject('IGameRepository')
        private readonly gameRepository: IGameRepository,
    ) { }

    async execute(betId: string, userId: string, currentMultiplier: number) {
        if (currentMultiplier <= 1.0) {
            throw new Error('Multiplicador inválido para saque.');
        }
        return await this.gameRepository.cashOut(betId, userId, currentMultiplier);
    }
}