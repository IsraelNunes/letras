import { Module } from '@nestjs/common';
import { SessionModule } from '../modules/session/session.module';
import { SessionGateway } from './gateway/session.gateway';
import { PresenceService } from './presence/presence.service';

@Module({
  imports: [SessionModule],
  providers: [SessionGateway, PresenceService],
  exports: [PresenceService],
})
export class RealtimeModule {}
