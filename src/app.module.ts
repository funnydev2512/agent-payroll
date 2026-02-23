import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { StorageModule } from './storage/storage.module';
import { NotificationModule } from './notification/notification.module';
import { AgentModule } from './agent/agent.module';
import { PayrollModule } from './payroll/payroll.module';
import { SessionModule } from './session/session.module';
import { HistoryModule } from './history/history.module';
import { PayrollSchedulerModule } from './scheduler/scheduler.module';
import { AppController } from './app.controller';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    StorageModule,
    NotificationModule,
    AgentModule,
    PayrollModule,
    SessionModule,
    HistoryModule,
    PayrollSchedulerModule,
  ],
  controllers: [AppController],
})
export class AppModule {}
