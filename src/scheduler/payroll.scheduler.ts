import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ExecutorService } from '../agent/executor.service';
import { TelegramService } from '../notification/telegram.service';
import { JsonStoreService } from '../storage/json-store.service';
import { ScheduleConfig } from '../common/interfaces';

@Injectable()
export class PayrollScheduler {
  private readonly logger = new Logger(PayrollScheduler.name);
  private isEnabled = false;

  constructor(
    private readonly executorService: ExecutorService,
    private readonly telegramService: TelegramService,
    private readonly jsonStore: JsonStoreService,
  ) {}

  async onModuleInit() {
    const schedule = await this.getSchedule();
    if (schedule && schedule.enabled) {
      this.isEnabled = true;
      this.logger.log(`✓ Scheduler loaded: ${schedule.cronExpression}`);
      this.logger.log(`  Will run on day ${schedule.dayOfMonth} at ${schedule.hour}:${schedule.minute}`);
    }
  }

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async checkScheduledPayroll() {
    if (!this.isEnabled) {
      return;
    }

    const schedule = await this.getSchedule();
    if (!schedule || !schedule.enabled) {
      return;
    }

    const now = new Date();
    const shouldRun =
      now.getDate() === schedule.dayOfMonth &&
      now.getHours() === schedule.hour &&
      now.getMinutes() === schedule.minute;

    if (shouldRun) {
      this.logger.log('⏰ Scheduled payroll triggered');
      try {
        const results = await this.executorService.executePayroll();
        const message = this.executorService.formatTelegramMessage(results);
        await this.telegramService.sendNotification(message);
      } catch (error) {
        this.logger.error('Scheduled payroll failed:', error);
      }
    }
  }

  async setSchedule(dayOfMonth: number, hour: number, minute = 0): Promise<ScheduleConfig> {
    const cronExpression = `${minute} ${hour} ${dayOfMonth} * *`;

    const schedule: ScheduleConfig = {
      dayOfMonth,
      hour,
      minute,
      cronExpression,
      enabled: true,
      createdAt: new Date().toISOString(),
    };

    await this.jsonStore.write('schedule.json', schedule);
    this.isEnabled = true;

    this.logger.log(`✓ Scheduler configured: ${cronExpression}`);
    this.logger.log(`  Will run on day ${dayOfMonth} at ${hour}:${minute}`);

    return schedule;
  }

  async getSchedule(): Promise<ScheduleConfig | null> {
    return this.jsonStore.read<ScheduleConfig>('schedule.json');
  }

  async disableSchedule(): Promise<void> {
    const schedule = await this.getSchedule();
    if (schedule) {
      schedule.enabled = false;
      await this.jsonStore.write('schedule.json', schedule);
      this.isEnabled = false;
      this.logger.log('⏸ Scheduler disabled');
    }
  }
}
