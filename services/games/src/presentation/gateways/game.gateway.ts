import {
    WebSocketGateway,
    WebSocketServer,
    OnGatewayConnection,
    OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';

// O "cors: '*'" libera para qualquer frontend se conectar (ideal para nosso modo Hackathon local)
@WebSocketGateway({ cors: { origin: '*' } })
export class GameGateway implements OnGatewayConnection, OnGatewayDisconnect {
    @WebSocketServer()
    server!: Server;

    private readonly logger = new Logger(GameGateway.name);

    // Quando um jogador abre a tela do jogo
    handleConnection(client: Socket) {
        this.logger.log(`🟢 Jogador sintonizou na rádio do Cassino: ${client.id}`);
    }

    // Quando o jogador fecha a aba
    handleDisconnect(client: Socket) {
        this.logger.log(`🔴 Jogador desconectou: ${client.id}`);
    }

    // =========================================================
    // MÉTODOS QUE O "MOTOR DO JOGO" VAI CHAMAR PARA GRITAR PRO MUNDO
    // =========================================================

    // Avisa que abriu para apostas
    broadcastBettingPhase(roundId: string) {
        this.server.emit('game:betting_phase', { roundId, message: 'Apostas Abertas! 10 segundos!' });
    }

    // O "TICK" é o coração do jogo. Vai mandar o multiplicador subindo!
    broadcastTick(multiplier: number) {
        this.server.emit('game:tick', { multiplier: multiplier.toFixed(2) });
    }

    // Avisa que explodiu e mostra o valor exato!
    broadcastCrash(multiplier: number, serverSeed: string) {
        this.server.emit('game:crash', {
            multiplier: multiplier.toFixed(2),
            serverSeed: serverSeed, // Mandamos a semente para o cara poder auditar e ver que não roubamos!
            message: '💥 CRASH!'
        });
    }
}