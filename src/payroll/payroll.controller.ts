import {
  Controller,
  Post,
  Get,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { PayrollService } from './payroll.service';
import { ExecutorService } from '../agent/executor.service';
import { TelegramService } from '../notification/telegram.service';

@Controller('payroll')
export class PayrollController {
  private readonly logger = new Logger(PayrollController.name);

  constructor(
    private readonly payrollService: PayrollService,
    private readonly executorService: ExecutorService,
    private readonly telegramService: TelegramService,
  ) {}

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  async uploadCsv(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    const result = await this.payrollService.uploadCsv(file.buffer);

    return {
      success: true,
      message: 'Payroll CSV uploaded successfully',
      data: result,
    };
  }

  @Get('current')
  async getCurrentPayroll() {
    const payroll = await this.payrollService.getCurrentPayroll();
    if (!payroll) {
      throw new BadRequestException('No payroll data found');
    }
    return payroll;
  }

  @Post('run')
  async runPayroll() {
    const payroll = await this.payrollService.getCurrentPayroll();

    if (!payroll || !payroll.employees || payroll.employees.length === 0) {
      throw new BadRequestException('No payroll data found. Please upload CSV first.');
    }

    const results = await this.executorService.executePayroll();

    const message = this.executorService.formatTelegramMessage(results);
    await this.telegramService.sendNotification(message);

    return {
      success: true,
      message: 'Payroll execution completed',
      results,
    };
  }
}
