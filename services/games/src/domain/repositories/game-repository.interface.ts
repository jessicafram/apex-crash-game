import type { Bet } from '@prisma/client-games';

export interface IGameRepository {
    placeBet(roundId: string, userId: string, amount: bigint): Promise<Bet>;
    cashOut(betId: string, userId: string, cashOutMultiplier: number): Promise<Bet>;
}