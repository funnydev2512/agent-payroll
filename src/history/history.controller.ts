import { Controller, Get, Param } from '@nestjs/common';
import { HistoryService } from './history.service';

@Controller('history')
export class HistoryController {
  constructor(private readonly historyService: HistoryService) {}

  @Get()
  async getAllHistory() {
    const history = await this.historyService.getAllHistory();
    return {
      success: true,
      count: history.length,
      history,
    };
  }

  @Get(':runId')
  async getRunById(@Param('runId') runId: string) {
    return this.historyService.getRunById(runId);
  }
}
