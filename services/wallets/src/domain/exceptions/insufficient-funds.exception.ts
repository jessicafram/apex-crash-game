export class InsufficientFundsException extends Error {
    constructor() {
        super('Saldo insuficiente para realizar esta transação.');
        this.name = 'InsufficientFundsException';
    }
}