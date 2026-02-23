import { Module, Global } from '@nestjs/common';
import { JsonStoreService } from './json-store.service';

@Global()
@Module({
  providers: [JsonStoreService],
  exports: [JsonStoreService],
})
export class StorageModule {}
