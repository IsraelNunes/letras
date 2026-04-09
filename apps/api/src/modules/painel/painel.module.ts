import { Module } from '@nestjs/common';
import { SupabaseStorageService } from '../../common/supabase/supabase-storage.service';
import { PainelController } from './painel.controller';
import { PainelService } from './painel.service';

@Module({
  controllers: [PainelController],
  providers: [PainelService, SupabaseStorageService],
})
export class PainelModule {}
