import { Controller, Get, Param, ParseUUIDPipe, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { CollectDataRoomUseCase } from '../application/collect-data-room.usecase';
import { LatestSignalsQuery } from '../application/latest-signals.query';

@ApiTags('data-room')
@Controller('data-room')
export class DataRoomController {
  constructor(
    private readonly collect: CollectDataRoomUseCase,
    private readonly latest: LatestSignalsQuery,
  ) {}

  @Post('startups/:id/refresh')
  refresh(@Param('id', ParseUUIDPipe) id: string) {
    return this.collect.execute(id);
  }

  @Get('startups/:id/signals')
  signals(@Param('id', ParseUUIDPipe) id: string) {
    return this.latest.execute(id);
  }
}
