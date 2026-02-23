import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ethers } from 'ethers';
import { JsonStoreService } from '../storage/json-store.service';
import { SessionKeyRules, TransactionResult } from '../common/interfaces';

const USDC_ABI = [
  'function transfer(address to, uint256 amount) returns (bool)',
  'function balanceOf(address account) view returns (uint256)',
  'function decimals() view returns (uint8)',
];

@Injectable()
export class WalletService {
  private readonly logger = new Logger(WalletService.name);
  private provider: ethers.JsonRpcProvider;
  private wallet: ethers.Wallet | null = null;
  private usdcContract: ethers.Contract | null = null;

  constructor(
    private readonly configService: ConfigService,
    private readonly jsonStore: JsonStoreService,
  ) {
    const rpcUrl = this.configService.get<string>('RPC_URL');
    if (!rpcUrl) {
      throw new Error('RPC_URL not configured');
    }
    this.provider = new ethers.JsonRpcProvider(rpcUrl);
  }

  async onModuleInit(): Promise<void> {
    const privateKey = this.configService.get<string>('AGENT_PRIVATE_KEY');
    if (privateKey) {
      this.wallet = new ethers.Wallet(privateKey, this.provider);
      const usdcAddress = this.configService.get<string>('USDC_ADDRESS');
      if (!usdcAddress) {
        throw new Error('USDC_ADDRESS not configured');
      }
      this.usdcContract = new ethers.Contract(usdcAddress, USDC_ABI, this.wallet);
      this.logger.log(`✓ Agent wallet initialized: ${this.wallet.address}`);
    } else {
      this.logger.warn('⚠ No AGENT_PRIVATE_KEY found. Generate one with createSessionKey()');
    }
  }

  async createSessionKey(whitelist: string[], spendingLimit: number): Promise<{
    address: string;
    privateKey: string;
    expiresAt: string;
  }> {
    const newWallet = ethers.Wallet.createRandom();
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + 30);

    const rules: SessionKeyRules = {
      address: newWallet.address,
      privateKey: newWallet.privateKey,
      whitelist,
      spendingLimit,
      totalSpent: 0,
      createdAt: new Date().toISOString(),
      expiresAt: expiryDate.toISOString(),
      status: 'active',
    };

    await this.jsonStore.write('rules.json', rules);

    return {
      address: newWallet.address,
      privateKey: newWallet.privateKey,
      expiresAt: expiryDate.toISOString(),
    };
  }

  async getSessionKey(): Promise<SessionKeyRules | null> {
    return this.jsonStore.read<SessionKeyRules>('rules.json');
  }

  async revokeSessionKey(): Promise<boolean> {
    const rules = await this.getSessionKey();
    if (rules) {
      rules.status = 'revoked';
      rules.revokedAt = new Date().toISOString();
      await this.jsonStore.write('rules.json', rules);
      return true;
    }
    return false;
  }

  async validateTransaction(toAddress: string, amount: number): Promise<void> {
    const rules = await this.getSessionKey();

    if (!rules) {
      throw new Error('No session key found');
    }

    if (rules.status !== 'active') {
      throw new Error(`Session key is ${rules.status}`);
    }

    if (new Date(rules.expiresAt) < new Date()) {
      throw new Error('Session key has expired');
    }

    if (!rules.whitelist.includes(toAddress)) {
      throw new Error(`Address ${toAddress} not in whitelist`);
    }

    const newTotal = rules.totalSpent + amount;
    if (newTotal > rules.spendingLimit) {
      throw new Error(`Spending limit exceeded: ${newTotal} > ${rules.spendingLimit}`);
    }
  }

  async getBalance(): Promise<string> {
    if (!this.wallet || !this.usdcContract) {
      throw new Error('Wallet not initialized');
    }

    const balance = await this.usdcContract.balanceOf(this.wallet.address);
    const decimals = await this.usdcContract.decimals();
    return ethers.formatUnits(balance, decimals);
  }

  async sendUSDC(toAddress: string, amount: number): Promise<TransactionResult> {
    if (!this.wallet || !this.usdcContract) {
      throw new Error('Wallet not initialized');
    }

    await this.validateTransaction(toAddress, amount);

    const decimals = await this.usdcContract.decimals();
    const amountInWei = ethers.parseUnits(amount.toString(), decimals);

    const tx = await this.usdcContract.transfer(toAddress, amountInWei);
    const receipt = await tx.wait();

    const rules = await this.getSessionKey();
    if (rules) {
      rules.totalSpent += amount;
      await this.jsonStore.write('rules.json', rules);
    }

    return {
      hash: receipt.hash,
      blockNumber: receipt.blockNumber,
      from: this.wallet.address,
      to: toAddress,
      amount,
    };
  }

  getAddress(): string | null {
    return this.wallet ? this.wallet.address : null;
  }
}
