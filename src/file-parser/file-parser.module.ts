import { Global, Module } from '@nestjs/common';
import { FileParserService } from './file-parser.service';
import { StorageModule } from '../storage/storage.module';

@Global()
@Module({
  imports: [StorageModule],
  providers: [FileParserService],
  exports: [FileParserService],
})
export class FileParserModule {}
