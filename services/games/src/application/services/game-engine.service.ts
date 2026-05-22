import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import { GameGateway } from '../../presentation/gateways/game.gateway';
import { ProvablyFairService } from '../../domain/services/provably-fair.service';

@Injectable()
export class GameEngineService implements OnModuleInit {
    private readonly logger = new Logger(GameEngineService.name);

    // Guardamos o estado atual pra usar depois
    public currentRoundId: string | null = null;
    public currentMultiplier: number = 1.00;

    constructor(
        private readonly prisma: PrismaService,
        private readonly gateway: GameGateway,
    ) { }

    // Quando o servidor ligar, o NestJS chama essa função sozinha!
    onModuleInit() {
        this.runGameLoop();
    }

    // O Loop Infinito que nunca dorme 🔁
    private async runGameLoop() {
        while (true) {
            try {
                await this.playRound();
            } catch (error) {
                this.logger.error('Erro no motor do jogo. Reiniciando em 5s...', error);
                await this.sleep(5000);
            }
        }
    }

    private async playRound() {
        // 🟡 FASE 1: APOSTAS (BETTING)
        const serverSeed = ProvablyFairService.generateServerSeed();
        const crashPoint = ProvablyFairService.calculateCrashPoint(serverSeed);

        const round = await this.prisma.round.create({
            data: { status: 'BETTING_PHASE', serverSeed, crashPoint },
        });
        this.currentRoundId = round.id;

        // Spoiler nos logs de onde vai quebrar (só a gente vê)
        this.logger.log(`🟡 NOVA RODADA [${round.id}] - Vai explodir no secreto: ${crashPoint}x`);
        this.gateway.broadcastBettingPhase(round.id);

        // Relógio correndo... 10 segundos pros jogadores apostarem!
        await this.sleep(10000);

        // 🟢 FASE 2: GRÁFICO SUBINDO (IN PROGRESS)
        await this.prisma.round.update({ where: { id: round.id }, data: { status: 'IN_PROGRESS' } });
        this.currentMultiplier = 1.00;
        this.logger.log(`🚀 DECOLOU! O gráfico está subindo...`);

        let isCrashed = false;

        // Fica rodando enquanto não bater no limite calculado lá no começo
        while (!isCrashed) {
            await this.sleep(100); // Dá um "Tick" a cada 100 milissegundos

            // Matemática exponencial (o gráfico acelera à medida que sobe!)
            this.currentMultiplier += 0.01 * this.currentMultiplier;

            if (this.currentMultiplier >= crashPoint) {
                this.currentMultiplier = crashPoint; // Crava o número exato do crash
                isCrashed = true;
            } else {
                this.gateway.broadcastTick(this.currentMultiplier); // Grita na rádio pro front-end!
            }
        }

        // 🔴 FASE 3: EXPLOSÃO (CRASHED)
        await this.prisma.round.update({ where: { id: round.id }, data: { status: 'CRASHED' } });

        this.logger.warn(`💥 CRASHOU NO ${this.currentMultiplier.toFixed(2)}x!`);
        this.gateway.broadcastCrash(this.currentMultiplier, serverSeed); // Grita na rádio!

        // Limpa a mesa e espera 5 segundos pra próxima rodada
        this.currentRoundId = null;
        await this.sleep(5000);
    }

    // Função utilitária para fazer o código "pausar"
    private sleep(ms: number) {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }
}