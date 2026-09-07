import { Global, Module } from '@nestjs/common';
import { HederaClientProvider } from './hedera-client.provider';

@Global()
@Module({
  providers: [HederaClientProvider],
  exports: [HederaClientProvider],
})
export class HederaModule {}
