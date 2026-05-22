import { Controller, Get, Post, Body, Req, HttpException, HttpStatus } from '@nestjs/common';
import { DebitWalletUseCase } from '../../application/use-cases/debit-wallet.use-case';
import { CreditWalletUseCase } from '../../application/use-cases/credit-wallet.use-case'; // 👈 Olha a importação aqui!
import { PrismaWalletRepository } from '../../infrastructure/database/prisma-wallet.repository';
import { InsufficientFundsException } from '../../domain/exceptions/insufficient-funds.exception';

export class DebitDto {
  amount!: number;
  referenceId!: string;
}

@Controller('wallets')
export class WalletsController {
  // 👈 Olha o CreditWalletUseCase sendo injetado aqui no constructor!
  constructor(
    private readonly debitWalletUseCase: DebitWalletUseCase,
    private readonly creditWalletUseCase: CreditWalletUseCase,
    private readonly walletRepository: PrismaWalletRepository,
  ) { }

  @Get('me')
  async getMyWallet(@Req() req: any) {
    const userId = "usuario-teste-123";
    const balanceInCents = await this.walletRepository.getBalance(userId);

    return {
      userId: userId,
      balance: balanceInCents.toString(),
    };
  }

  @Post('debit')
  async debitWallet(@Body() body: DebitDto) {
    const userId = "usuario-teste-123";

    try {
      await this.debitWalletUseCase.execute(userId, BigInt(body.amount), body.referenceId);

      return {
        message: 'Débito realizado com sucesso!',
        amountDeducted: body.amount
      };

    } catch (error: any) {
      if (error instanceof InsufficientFundsException) {
        throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
      }
      throw new HttpException(error.message || 'Internal Server Error', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Post('credit')
  async creditWallet(@Body() body: DebitDto) {
    const userId = "usuario-teste-123";

    try {
      await this.creditWalletUseCase.execute(userId, BigInt(body.amount), body.referenceId);

      return {
        message: 'Crédito realizado com sucesso!',
        amountAdded: body.amount
      };
    } catch (error: any) {
      throw new HttpException(error.message || 'Internal Server Error', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}