import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { TelegramService } from './telegram.service';
import { WalletService } from '../agent/wallet.service';
import { ExecutorService } from '../agent/executor.service';
import { HistoryService } from '../history/history.service';
import { JsonStoreService } from '../storage/json-store.service';
import { PayrollData } from '../common/interfaces';

interface TelegramUpdate {
  update_id: number;
  message?: TelegramMessage;
}

interface TelegramMessage {
  message_id: number;
  from: { id: number; first_name: string; username?: string };
  chat: { id: number; type: string };
  text?: string;
  date: number;
}

@Injectable()
export class TelegramBotService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(TelegramBotService.name);
  private offset = 0;
  private pollingTimer: NodeJS.Timeout | null = null;
  private botToken: string | null = null;
  private allowedChatId: string | null = null;
  private isRunning = false;

  constructor(
    private readonly configService: ConfigService,
    private readonly telegramService: TelegramService,
    private readonly walletService: WalletService,
    private readonly executorService: ExecutorService,
    private readonly historyService: HistoryService,
    private readonly jsonStore: JsonStoreService,
  ) {}

  async onModuleInit(): Promise<void> {
    this.botToken = this.configService.get<string>('TELEGRAM_BOT_TOKEN') ?? null;
    this.allowedChatId = this.configService.get<string>('TELEGRAM_CHAT_ID') ?? null;

    if (!this.botToken) {
      this.logger.warn('⚠ TELEGRAM_BOT_TOKEN not set — bot commands disabled');
      return;
    }

    await this.skipOldMessages();
    this.startPolling();
    this.logger.log('✓ Telegram bot listening — commands: /start /status /balance /run /history');
  }

  onModuleDestroy(): void {
    this.stopPolling();
  }

  // ── Polling ──────────────────────────────────────────────────────────────

  private startPolling(): void {
    this.pollingTimer = setInterval(() => {
      this.poll().catch((e) => this.logger.debug('Poll error:', e.message));
    }, 2_000);
  }

  private stopPolling(): void {
    if (this.pollingTimer) {
      clearInterval(this.pollingTimer);
      this.pollingTimer = null;
    }
  }

  /** Skip messages that arrived before this process started. */
  private async skipOldMessages(): Promise<void> {
    try {
      const url = `https://api.telegram.org/bot${this.botToken}/getUpdates?offset=-1&limit=1`;
      const res = await axios.get<{ result: TelegramUpdate[] }>(url);
      if (res.data.result.length > 0) {
        this.offset = res.data.result[res.data.result.length - 1].update_id + 1;
        this.logger.debug(`Starting offset at ${this.offset}`);
      }
    } catch (_) { /* ok — start from 0 */ }
  }

  private async poll(): Promise<void> {
    const url = `https://api.telegram.org/bot${this.botToken}/getUpdates?offset=${this.offset}&timeout=0&limit=10`;
    const res = await axios.get<{ result: TelegramUpdate[] }>(url, { timeout: 5_000 });
    const updates = res.data.result;

    for (const update of updates) {
      this.offset = update.update_id + 1;
      if (update.message?.text) {
        await this.handleMessage(update.message).catch((e) =>
          this.logger.error('Handler error:', e.message),
        );
      }
    }
  }

  // ── Router ───────────────────────────────────────────────────────────────

  private async handleMessage(msg: TelegramMessage): Promise<void> {
    const chatId = msg.chat.id;

    // Security: only respond to authorized chat
    if (this.allowedChatId && String(chatId) !== this.allowedChatId) {
      await this.send(chatId, '🔒 *Unauthorized.* This bot is private.');
      return;
    }

    const text = (msg.text ?? '').trim();
    const command = text.split(' ')[0].toLowerCase().split('@')[0]; // handle /cmd@botname

    this.logger.log(`← Bot command from ${msg.from.first_name}: ${command}`);

    switch (command) {
      case '/start':
      case '/help':
        await this.cmdHelp(chatId, msg.from.first_name);
        break;
      case '/status':
        await this.cmdStatus(chatId);
        break;
      case '/balance':
        await this.cmdBalance(chatId);
        break;
      case '/payroll':
        await this.cmdPayroll(chatId);
        break;
      case '/run':
        await this.cmdRun(chatId);
        break;
      case '/history':
        await this.cmdHistory(chatId);
        break;
      case '/revoke':
        await this.cmdRevoke(chatId);
        break;
      default:
        await this.send(chatId, `❓ Unknown command.\n\nType /help to see available commands.`);
    }
  }

  // ── Commands ─────────────────────────────────────────────────────────────

  private async cmdHelp(chatId: number, name: string): Promise<void> {
    const msg = `👋 Hey ${name}\\! Welcome to *paychef*\\.

🍳 *Crypto Payroll Agent* — automated USDC payroll on Base Sepolia\\.

*Available commands:*
/status — Session key & wallet info
/balance — Current USDC balance
/payroll — Current payroll list
/run — ▶ Execute payroll now
/history — Last 5 payroll runs
/revoke — Revoke session key
/help — Show this menu`;

    await this.send(chatId, msg, 'MarkdownV2');
  }

  private async cmdStatus(chatId: number): Promise<void> {
    try {
      const [session, balance] = await Promise.allSettled([
        this.walletService.getSessionKey(),
        this.walletService.getBalance(),
      ]);

      const s = session.status === 'fulfilled' ? session.value : null;
      const b = balance.status === 'fulfilled' ? balance.value : null;

      if (!s) {
        await this.send(chatId, `📊 *Agent Status*\n\n⚠️ No session key found\.\nCreate one from the dashboard first\.`, 'MarkdownV2');
        return;
      }

      const isExpired = new Date(s.expiresAt) < new Date();
      const statusIcon = s.status === 'active' && !isExpired ? '🟢' : '🔴';
      const statusText = isExpired ? 'Expired' : s.status.charAt(0).toUpperCase() + s.status.slice(1);

      const addr = s.address;
      const addrShort = `${addr.slice(0, 8)}\.\.\.${addr.slice(-6)}`;
      const pct = s.spendingLimit > 0 ? Math.round((s.totalSpent / s.spendingLimit) * 100) : 0;
      const bar = buildProgressBar(pct);
      const exp = new Date(s.expiresAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
      const balStr = b ? `${parseFloat(b).toFixed(2)} USDC` : '—';

      const msg =
        `📊 *Agent Status*\n\n` +
        `${statusIcon} *Session Key:* ${statusText}\n` +
        `📍 Address: \`${addrShort}\`\n\n` +
        `*Spending Limit:*\n` +
        `${bar} ${pct}%\n` +
        `Spent: *${s.totalSpent}* / ${s.spendingLimit} USDC\n` +
        `Remaining: *${s.spendingLimit - s.totalSpent} USDC*\n\n` +
        `👥 Whitelist: ${s.whitelist.length} addresses\n` +
        `⏰ Expires: ${exp}\n\n` +
        `💰 Balance: *${balStr}*`;

      await this.send(chatId, msg);
    } catch (e) {
      await this.send(chatId, `❌ Error: ${(e as Error).message}`);
    }
  }

  private async cmdBalance(chatId: number): Promise<void> {
    try {
      const balance = await this.walletService.getBalance();
      const address = this.walletService.getAddress();
      const addrShort = address ? `${address.slice(0, 8)}...${address.slice(-6)}` : '—';

      const msg =
        `💰 *USDC Balance*\n\n` +
        `Amount: *${parseFloat(balance).toFixed(2)} USDC*\n` +
        `Address: \`${addrShort}\`\n` +
        `Network: Base Sepolia\n\n` +
        `[View on Explorer](https://sepolia.basescan.org/address/${address})`;

      await this.send(chatId, msg);
    } catch (e) {
      await this.send(chatId, `❌ ${(e as Error).message}\n\nMake sure AGENT_PRIVATE_KEY is set and server is restarted.`);
    }
  }

  private async cmdPayroll(chatId: number): Promise<void> {
    try {
      const payroll = await this.jsonStore.read<PayrollData>('payroll.json');

      if (!payroll?.employees?.length) {
        await this.send(chatId, `📋 *Current Payroll*\n\n⚠️ No payroll uploaded yet.`);
        return;
      }

      let msg = `📋 *Current Payroll*\n\n`;
      for (const emp of payroll.employees) {
        msg += `• ${emp.name}: *${emp.usdc_amount} USDC*\n`;
      }
      msg += `\n💵 *Total: ${payroll.totalAmount.toLocaleString()} USDC*`;
      msg += `\n👥 ${payroll.employees.length} employees`;
      msg += `\n📅 Uploaded: ${new Date(payroll.uploadedAt).toLocaleDateString()}`;

      await this.send(chatId, msg);
    } catch (_) {
      await this.send(chatId, `⚠️ No payroll data found.\nUpload a CSV first.`);
    }
  }

  private async cmdRun(chatId: number): Promise<void> {
    if (this.isRunning) {
      await this.send(chatId, `⏳ Payroll is already running, please wait...`);
      return;
    }

    this.isRunning = true;
    await this.send(chatId, `⚡ *Starting payroll execution...*\n\nThis may take a minute. I'll update you when done.`);

    try {
      const results = await this.executorService.executePayroll();

      const successCount = results.successful.length;
      const total = results.totalEmployees;
      const amount = results.successAmount;
      const explorerBase = this.configService.get<string>('EXPLORER_URL', 'https://sepolia.basescan.org');

      let msg = `✅ *Payroll Complete!*\n\n`;
      msg += `Paid: *${successCount}/${total}*\n`;
      msg += `Total: *${amount.toFixed(2)} USDC*`;

      if (results.failed.length > 0) {
        msg += `\nFailed: *${results.failed.length}*`;
      }

      msg += `\n\n*Transactions:*\n`;
      for (const tx of results.successful) {
        msg += `✓ ${tx.name}: ${tx.amount} USDC\n`;
        msg += `  [Tx ↗](${explorerBase}/tx/${tx.txHash})\n`;
      }
      for (const tx of results.failed) {
        msg += `✗ ${tx.name}: ${tx.error}\n`;
      }

      await this.send(chatId, msg);
    } catch (e) {
      await this.send(
        chatId,
        `❌ *Payroll failed*\n\n${(e as Error).message}`,
      );
    } finally {
      this.isRunning = false;
    }
  }

  private async cmdHistory(chatId: number): Promise<void> {
    try {
      const history = await this.historyService.getAllHistory();

      if (history.length === 0) {
        await this.send(chatId, `📜 *Payroll History*\n\nNo runs yet.`);
        return;
      }

      let msg = `📜 *Payroll History*\n\n`;

      for (const run of history.slice(0, 5)) {
        const date = new Date(run.timestamp).toLocaleDateString('en-US', {
          month: 'short', day: 'numeric', year: 'numeric',
        });
        const paid = run.successful.length;
        const total = run.totalEmployees;
        const amount = run.successAmount.toFixed(0);
        const icon = run.failed.length === 0 ? '✅' : run.successful.length > 0 ? '⚠️' : '❌';

        msg += `${icon} *${date}* — ${paid}/${total} paid · ${amount} USDC\n`;
      }

      if (history.length > 5) {
        msg += `\n_...and ${history.length - 5} more runs_`;
      }

      await this.send(chatId, msg);
    } catch (e) {
      await this.send(chatId, `❌ Error: ${(e as Error).message}`);
    }
  }

  private async cmdRevoke(chatId: number): Promise<void> {
    try {
      const success = await this.walletService.revokeSessionKey();
      if (success) {
        await this.send(
          chatId,
          `🔴 *Session Key Revoked*\n\nThe agent can no longer execute transactions.\nCreate a new Session Key from the dashboard to resume.`,
        );
      } else {
        await this.send(chatId, `⚠️ No active session key to revoke.`);
      }
    } catch (e) {
      await this.send(chatId, `❌ Error: ${(e as Error).message}`);
    }
  }

  // ── Internal send ─────────────────────────────────────────────────────────

  private async send(chatId: number, text: string, parseMode: 'Markdown' | 'MarkdownV2' = 'Markdown'): Promise<void> {
    if (!this.botToken) return;
    try {
      const url = `https://api.telegram.org/bot${this.botToken}/sendMessage`;
      await axios.post(url, { chat_id: chatId, text, parse_mode: parseMode }, { timeout: 8_000 });
    } catch (e) {
      this.logger.error('Failed to send reply:', (e as Error).message);
    }
  }
}

// ── Helpers ───────────────────────────────────────────────────────────────

function buildProgressBar(pct: number): string {
  const filled = Math.round(pct / 10);
  return '█'.repeat(filled) + '░'.repeat(10 - filled);
}
