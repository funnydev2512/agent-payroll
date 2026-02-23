import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { WalletService } from './wallet.service';
import { JsonStoreService } from '../storage/json-store.service';
import { PayrollData, PayrollRunResult } from '../common/interfaces';

@Injectable()
export class ExecutorService {
  private readonly logger = new Logger(ExecutorService.name);

  constructor(
    private readonly walletService: WalletService,
    private readonly jsonStore: JsonStoreService,
    private readonly configService: ConfigService,
  ) {}

  async executePayroll(): Promise<PayrollRunResult> {
    this.logger.log('🚀 Starting payroll execution...');

    const payroll = await this.jsonStore.read<PayrollData>('payroll.json');

    if (!payroll || !payroll.employees || payroll.employees.length === 0) {
      throw new Error('No payroll data found');
    }

    const results: PayrollRunResult = {
      runId: Date.now().toString(),
      timestamp: new Date().toISOString(),
      totalEmployees: payroll.employees.length,
      successful: [],
      failed: [],
      totalAmount: 0,
      successAmount: 0,
    };

    for (const employee of payroll.employees) {
      this.logger.log(`💸 Processing payment for ${employee.name}...`);

      try {
        const txResult = await this.walletService.sendUSDC(
          employee.wallet_address,
          employee.usdc_amount,
        );

        results.successful.push({
          name: employee.name,
          address: employee.wallet_address,
          amount: employee.usdc_amount,
          txHash: txResult.hash,
          status: 'success',
        });

        results.successAmount += employee.usdc_amount;
        this.logger.log(`✓ Paid ${employee.usdc_amount} USDC to ${employee.name}`);
        this.logger.log(`  Tx: ${txResult.hash}`);
      } catch (error) {
        this.logger.error(`✗ Failed to pay ${employee.name}:`, (error as Error).message);

        results.failed.push({
          name: employee.name,
          address: employee.wallet_address,
          amount: employee.usdc_amount,
          error: (error as Error).message,
          status: 'failed',
        });
      }

      results.totalAmount += employee.usdc_amount;
    }

    await this.jsonStore.append('history.json', results);

    this.logger.log(`\n✅ Payroll complete: ${results.successful.length}/${results.totalEmployees} paid`);

    return results;
  }

  formatTelegramMessage(results: PayrollRunResult): string {
    const successRate = `${results.successful.length}/${results.totalEmployees}`;
    const failCount = results.failed.length;
    const explorerUrl = this.configService.get<string>('EXPLORER_URL', 'https://sepolia.basescan.org');

    let message = `🎉 *Payroll Complete*\n\n`;
    message += `✅ Paid: ${successRate}\n`;
    message += `💰 Total: ${results.successAmount.toFixed(2)} USDC\n`;

    if (failCount > 0) {
      message += `❌ Failed: ${failCount}\n`;
    }

    message += `\n*Successful Transactions:*\n`;

    results.successful.forEach((tx, idx) => {
      const txUrl = `${explorerUrl}/tx/${tx.txHash}`;
      message += `${idx + 1}. ${tx.name}: ${tx.amount} USDC\n`;
      message += `   [View Tx](${txUrl})\n`;
    });

    if (results.failed.length > 0) {
      message += `\n*Failed Transactions:*\n`;
      results.failed.forEach((tx, idx) => {
        message += `${idx + 1}. ${tx.name}: ${tx.error}\n`;
      });
    }

    return message;
  }
}
