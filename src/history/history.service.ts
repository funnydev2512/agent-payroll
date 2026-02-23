import { Injectable, NotFoundException } from '@nestjs/common';
import { JsonStoreService } from '../storage/json-store.service';
import { PayrollRunResult } from '../common/interfaces';

@Injectable()
export class HistoryService {
  constructor(private readonly jsonStore: JsonStoreService) {}

  async getAllHistory(): Promise<PayrollRunResult[]> {
    const history = await this.jsonStore.read<PayrollRunResult[]>('history.json');
    return history || [];
  }

  async getRunById(runId: string): Promise<PayrollRunResult> {
    const history = await this.getAllHistory();
    const run = history.find((r) => r.runId === runId);

    if (!run) {
      throw new NotFoundException('Run not found');
    }

    return run;
  }
}
