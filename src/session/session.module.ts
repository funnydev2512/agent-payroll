import { Module } from '@nestjs/common';
import { SessionController } from './session.controller';
import { SessionService } from './session.service';
import { AgentModule } from '../agent/agent.module';
import { PayrollModule } from '../payroll/payroll.module';

@Module({
  imports: [AgentModule, PayrollModule],
  controllers: [SessionController],
  providers: [SessionService],
})
export class SessionModule {}
