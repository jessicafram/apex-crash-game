import { Controller, Get, Post, Body, HttpException, HttpStatus } from "@nestjs/common";
import { HealthCheckResponseDto } from "../dtos/health-check-response.dto";
import { PlaceBetUseCase } from '../../application/use-cases/place-bet.use-case';
import { CashOutUseCase } from '../../application/use-cases/cash-out.use-case';
import { GameEngineService } from '../../application/services/game-engine.service';

export class BetDto { amount!: number; roundId!: string; }
export class CashOutDto { betId!: string; }

@Controller()
export class GamesController {
  constructor(
    private readonly placeBetUseCase: PlaceBetUseCase,
    private readonly cashOutUseCase: CashOutUseCase,
    private readonly gameEngine: GameEngineService // O Controller olha pro motor do jogo!
  ) { }

  @Get("health")
  check(): HealthCheckResponseDto {
    return { status: "ok", service: "games" };
  }

  @Get("games/current-round")
  getCurrentRound() {
    // Pro Front-end saber o que tá rolando na mesa agora!
    return {
      roundId: this.gameEngine.currentRoundId,
      multiplier: this.gameEngine.currentMultiplier
    };
  }

  @Post('games/bet')
  async placeBet(@Body() body: BetDto) {
    try {
      const bet = await this.placeBetUseCase.execute(body.roundId, "usuario-teste-123", BigInt(body.amount));
      return { message: 'Aposta registrada!', betId: bet.id };
    } catch (error: any) {
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }

  @Post('games/cashout')
  async cashOut(@Body() body: CashOutDto) {
    try {
      // Pega o multiplicador exato daquele milissegundo!
      const currentMultiplier = this.gameEngine.currentMultiplier;

      const bet = await this.cashOutUseCase.execute(body.betId, "usuario-teste-123", currentMultiplier);

      return {
        message: 'SAQUE REALIZADO COM SUCESSO! 🤑',
        ganho: Number(bet.winAmount) / 100,
        multiplicador: currentMultiplier
      };
    } catch (error: any) {
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }
}