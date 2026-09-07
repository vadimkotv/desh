import { Global, Module } from '@nestjs/common';
import { GraphGatewayClient } from './graph-gateway.client';

@Global()
@Module({
  providers: [GraphGatewayClient],
  exports: [GraphGatewayClient],
})
export class GraphModule {}
