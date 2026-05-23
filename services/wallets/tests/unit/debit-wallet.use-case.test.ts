import { describe, it, expect, mock } from "bun:test";
import { DebitWalletUseCase } from '../../src/application/use-cases/debit-wallet.use-case';

describe('DebitWalletUseCase - Proteção de Saldo', () => {
    it('deve bloquear imediatamente uma aposta com valor ZERO ou negativo', async () => {

        // Criamos um "Dublê" (Mock) do banco de dados pra não precisar rodar o Prisma no teste
        const mockWalletRepository = {
            debit: mock(),
            credit: mock(),
            getBalance: mock(),
        };

        const useCase = new DebitWalletUseCase(mockWalletRepository);

        // O teste passa se o sistema "gritar" um erro na cara do usuário!
        expect(useCase.execute('user-1', 0n, 'ref-1')).rejects.toThrow('O valor do débito deve ser maior que zero.');
        expect(useCase.execute('user-1', -50n, 'ref-2')).rejects.toThrow('O valor do débito deve ser maior que zero.');

        // Garante que o banco de dados nem chegou a ser chamado
        expect(mockWalletRepository.debit).not.toHaveBeenCalled();
    });
});