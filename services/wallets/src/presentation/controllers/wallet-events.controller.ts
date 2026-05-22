import { Controller, Inject } from '@nestjs/common';
import { EventPattern, Payload, ClientProxy } from '@nestjs/microservices';
import { DebitWalletUseCase } from '../../application/use-cases/debit-wallet.use-case';

@Controller()
export class WalletEventsController {
    constructor(
        private readonly debitWalletUseCase: DebitWalletUseCase,
        @Inject('RABBITMQ_SERVICE') private readonly rabbitClient: ClientProxy,
    ) { }

    // Quando o Jogo gritar "wallet.debit" no RabbitMQ, essa função acorda!
    @EventPattern('wallet.debit')
    async handleWalletDebit(@Payload() data: { betId: string; userId: string; amount: string; referenceId: string }) {
        console.log(` Recebido pedido de débito: R$ ${Number(data.amount) / 100} do usuário ${data.userId}`);

        try {
            // Tenta tirar o dinheiro...
            await this.debitWalletUseCase.execute(data.userId, BigInt(data.amount), data.referenceId);

            // Se deu certo, avisa o Jogo que a aposta tá valendo!
            console.log(` Débito aprovado! Avisando o jogo...`);
            this.rabbitClient.emit('bet.accepted', { betId: data.betId });

        } catch (error: any) {
            // Se não tem saldo, devolve o erro pro Jogo cancelar a aposta!
            console.log(` Débito negado: ${error.message}`);
            this.rabbitClient.emit('bet.rejected', { betId: data.betId, reason: error.message });
        }
    }
}