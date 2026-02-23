import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { PayrollScheduler } from './payroll.scheduler';
import { AgentModule } from '../agent/agent.module';

@Module({
  imports: [ScheduleModule.forRoot(), AgentModule],
  providers: [PayrollScheduler],
  exports: [PayrollScheduler],
})
export class PayrollSchedulerModule {}
