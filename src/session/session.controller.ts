import { Controller, Post, Get } from '@nestjs/common';
import { SessionService } from './session.service';

@Controller('session')
export class SessionController {
  constructor(private readonly sessionService: SessionService) {}

  @Post('create')
  async createSessionKey() {
    return this.sessionService.createSessionKey();
  }

  @Get('status')
  async getSessionStatus() {
    return this.sessionService.getSessionStatus();
  }

  @Get('balance')
  async getBalance() {
    return this.sessionService.getBalance();
  }

  @Post('revoke')
  async revokeSessionKey() {
    return this.sessionService.revokeSessionKey();
  }
}
