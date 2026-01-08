import { Module } from '@nestjs/common';
import { MultiplayerGateway } from './multiplayer.gateway';
import { MultiplayerService } from './multiplayer.service';

@Module({
  providers: [MultiplayerGateway, MultiplayerService],
  exports: [MultiplayerService],
})
export class MultiplayerModule {}
