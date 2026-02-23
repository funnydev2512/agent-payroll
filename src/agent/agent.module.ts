import { Module } from '@nestjs/common';
import { WalletService } from './wallet.service';
import { ExecutorService } from './executor.service';

@Module({
  providers: [WalletService, ExecutorService],
  exports: [WalletService, ExecutorService],
})
export class AgentModule {}
