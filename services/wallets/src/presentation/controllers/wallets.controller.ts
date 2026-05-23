import { Controller, Get, Post, Body, Req, HttpException, HttpStatus, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport'; 
import { DebitWalletUseCase } from '../../application/use-cases/debit-wallet.use-case';
import { CreditWalletUseCase } from '../../application/use-cases/credit-wallet.use-case';
import { PrismaWalletRepository } from '../../infrastructure/database/prisma-wallet.repository';
import { InsufficientFundsException } from '../../domain/exceptions/insufficient-funds.exception';

export class DebitDto {
  amount!: number;
  referenceId!: string;
}

@Controller('wallets')
@UseGuards(AuthGuard('jwt')) 
export class WalletsController {
  constructor(
    private readonly debitWalletUseCase: DebitWalletUseCase,
    private readonly creditWalletUseCase: CreditWalletUseCase,
    private readonly walletRepository: PrismaWalletRepository,
  ) { }

  @Get('me')
  async getMyWallet(@Req() req: any) {
    // Pegamos o ID real do usuário que o Guarda-Costas leu do Token!
    const userId = req.user.userId;
    const balanceInCents = await this.walletRepository.getBalance(userId);

    return {
      userId: userId,
      balance: balanceInCents.toString(),
    };
  }

  @Post('debit')
  async debitWallet(@Body() body: DebitDto, @Req() req: any) {
    const userId = req.user.userId; // ID real!

    try {
      await this.debitWalletUseCase.execute(userId, BigInt(body.amount), body.referenceId);
      return { message: 'Débito realizado com sucesso!', amountDeducted: body.amount };
    } catch (error: any) {
      if (error instanceof InsufficientFundsException) {
        throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
      }
      throw new HttpException(error.message || 'Internal Server Error', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Post('credit')
  async creditWallet(@Body() body: DebitDto, @Req() req: any) {
    const userId = req.user.userId; // ID real!

    try {
      await this.creditWalletUseCase.execute(userId, BigInt(body.amount), body.referenceId);
      return { message: 'Crédito realizado com sucesso!', amountAdded: body.amount };
    } catch (error: any) {
      throw new HttpException(error.message || 'Internal Server Error', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}