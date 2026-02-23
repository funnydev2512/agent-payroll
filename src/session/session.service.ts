import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { WalletService } from '../agent/wallet.service';
import { PayrollService } from '../payroll/payroll.service';

@Injectable()
export class SessionService {
  constructor(
    private readonly walletService: WalletService,
    private readonly payrollService: PayrollService,
  ) {}

  async createSessionKey() {
    const payroll = await this.payrollService.getCurrentPayroll();

    if (!payroll || !payroll.employees || payroll.employees.length === 0) {
      throw new BadRequestException('No payroll data found. Upload CSV first.');
    }

    const whitelist = payroll.employees.map((emp) => emp.wallet_address);
    const spendingLimit = payroll.totalAmount;

    const sessionKey = await this.walletService.createSessionKey(whitelist, spendingLimit);

    return {
      success: true,
      message: 'Session key created successfully',
      sessionKey: {
        address: sessionKey.address,
        expiresAt: sessionKey.expiresAt,
        whitelist,
        spendingLimit,
      },
      instructions: {
        step1: 'Copy the private key and add it to your .env file as AGENT_PRIVATE_KEY',
        step2: 'Fund this address with USDC on Base Sepolia',
        step3: 'Restart the server to load the new session key',
        privateKey: sessionKey.privateKey,
      },
    };
  }

  async getSessionStatus() {
    const rules = await this.walletService.getSessionKey();

    if (!rules) {
      return {
        exists: false,
        message: 'No session key found',
      };
    }

    const isExpired = new Date(rules.expiresAt) < new Date();

    return {
      exists: true,
      address: rules.address,
      status: rules.status,
      isExpired,
      createdAt: rules.createdAt,
      expiresAt: rules.expiresAt,
      spendingLimit: rules.spendingLimit,
      totalSpent: rules.totalSpent,
      remaining: rules.spendingLimit - rules.totalSpent,
      whitelistCount: rules.whitelist.length,
    };
  }

  async revokeSessionKey() {
    const success = await this.walletService.revokeSessionKey();

    if (success) {
      return {
        success: true,
        message: 'Session key revoked successfully',
      };
    } else {
      throw new NotFoundException('No session key found to revoke');
    }
  }

  async getBalance() {
    const balance = await this.walletService.getBalance();
    const address = this.walletService.getAddress();

    return {
      address,
      balance,
      token: 'USDC',
      network: 'Base Sepolia',
    };
  }
}
