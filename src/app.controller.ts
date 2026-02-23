import { Controller, Get } from '@nestjs/common';
import { WalletService } from './agent/wallet.service';

@Controller()
export class AppController {
  constructor(private readonly walletService: WalletService) {}

  @Get('health')
  getHealth() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      wallet: this.walletService.getAddress() || 'not initialized',
    };
  }
}
