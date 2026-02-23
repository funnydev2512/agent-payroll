import { Injectable, Logger } from '@nestjs/common';
import { promises as fs } from 'fs';
import { join } from 'path';

@Injectable()
export class JsonStoreService {
  private readonly logger = new Logger(JsonStoreService.name);
  private readonly dataDir = join(process.cwd(), 'data');

  private getFilePath(filename: string): string {
    return join(this.dataDir, filename);
  }

  async read<T>(filename: string): Promise<T | null> {
    try {
      const filePath = this.getFilePath(filename);
      const data = await fs.readFile(filePath, 'utf-8');
      return JSON.parse(data) as T;
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        return null;
      }
      this.logger.error(`Error reading ${filename}:`, error);
      throw error;
    }
  }

  async write<T>(filename: string, data: T): Promise<void> {
    try {
      const filePath = this.getFilePath(filename);
      await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf-8');
    } catch (error) {
      this.logger.error(`Error writing ${filename}:`, error);
      throw error;
    }
  }

  async append<T>(filename: string, item: T): Promise<void> {
    try {
      const existing = await this.read<T[]>(filename);
      const array = existing || [];
      array.unshift(item);
      
      if (array.length > 100) {
        array.length = 100;
      }
      
      await this.write(filename, array);
    } catch (error) {
      this.logger.error(`Error appending to ${filename}:`, error);
      throw error;
    }
  }
}
