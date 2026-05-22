export interface IWalletRepository {
    // O amount é bigint porque estamos trabalhando em centavos!
    debit(userId: string, amount: bigint, reference: string): Promise<void>;
    credit(userId: string, amount: bigint, reference: string): Promise<void>;
    getBalance(userId: string): Promise<bigint>;
}