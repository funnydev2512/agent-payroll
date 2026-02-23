import { Module, Global } from '@nestjs/common';
import { TelegramService } from './telegram.service';
import { TelegramBotService } from './telegram-bot.service';
import { AgentModule } from '../agent/agent.module';
import { HistoryModule } from '../history/history.module';

@Global()
@Module({
  imports: [AgentModule, HistoryModule],
  providers: [TelegramService, TelegramBotService],
  exports: [TelegramService, TelegramBotService],
})
export class NotificationModule {}
