import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

@Injectable()
export class TelegramService {
  private readonly logger = new Logger(TelegramService.name);

  constructor(private readonly configService: ConfigService) {}

  async sendNotification(message: string): Promise<void> {
    const botToken = this.configService.get<string>('TELEGRAM_BOT_TOKEN');
    const chatId = this.configService.get<string>('TELEGRAM_CHAT_ID');

    if (!botToken || !chatId) {
      this.logger.warn('⚠ Telegram not configured, skipping notification');
      this.logger.log('Message would have been:', message);
      return;
    }

    try {
      const url = `https://api.telegram.org/bot${botToken}/sendMessage`;

      await axios.post(url, {
        chat_id: chatId,
        text: message,
        parse_mode: 'Markdown',
      });

      this.logger.log('✓ Telegram notification sent');
    } catch (error) {
      this.logger.error('✗ Failed to send Telegram notification:', (error as Error).message);
    }
  }
}
