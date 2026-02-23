import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { parse } from 'csv-parse/sync';
import { ethers } from 'ethers';
import { JsonStoreService } from '../storage/json-store.service';
import { PayrollData, Employee } from '../common/interfaces';

@Injectable()
export class PayrollService {
  private readonly logger = new Logger(PayrollService.name);

  constructor(private readonly jsonStore: JsonStoreService) {}

  async uploadCsv(fileBuffer: Buffer): Promise<{
    employeeCount: number;
    totalAmount: number;
    employees: Employee[];
  }> {
    const csvContent = fileBuffer.toString('utf-8');
    const records = parse(csvContent, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
    });

    const validationErrors: Array<{ row: number; name?: string; error: string }> = [];
    const employees: Employee[] = [];
    let totalAmount = 0;

    records.forEach((record: any, index: number) => {
      const rowNum = index + 2;

      if (!record.name || !record.wallet_address || !record.usdc_amount) {
        validationErrors.push({
          row: rowNum,
          error: 'Missing required fields (name, wallet_address, usdc_amount)',
        });
        return;
      }

      if (!ethers.isAddress(record.wallet_address)) {
        validationErrors.push({
          row: rowNum,
          name: record.name,
          error: `Invalid wallet address: ${record.wallet_address}`,
        });
        return;
      }

      const amount = parseFloat(record.usdc_amount);
      if (isNaN(amount) || amount <= 0) {
        validationErrors.push({
          row: rowNum,
          name: record.name,
          error: `Invalid amount: ${record.usdc_amount}`,
        });
        return;
      }

      employees.push({
        name: record.name.trim(),
        wallet_address: ethers.getAddress(record.wallet_address),
        usdc_amount: amount,
      });

      totalAmount += amount;
    });

    if (validationErrors.length > 0) {
      throw new BadRequestException({
        message: 'Validation failed',
        errors: validationErrors,
      });
    }

    if (employees.length === 0) {
      throw new BadRequestException('No valid employees found in CSV');
    }

    const payrollData: PayrollData = {
      employees,
      totalAmount,
      uploadedAt: new Date().toISOString(),
      status: 'pending',
    };

    await this.jsonStore.write('payroll.json', payrollData);

    return {
      employeeCount: employees.length,
      totalAmount,
      employees,
    };
  }

  async getCurrentPayroll(): Promise<PayrollData | null> {
    return this.jsonStore.read<PayrollData>('payroll.json');
  }
}
