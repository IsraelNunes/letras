import { Module } from '@nestjs/common';
import { SupabaseStorageService } from '../../common/supabase/supabase-storage.service';
import { PainelController } from './painel.controller';
import { PainelService } from './painel.service';
import { ProgressService } from '../progress/progress.service';

@Module({
  controllers: [PainelController],
  providers: [PainelService, SupabaseStorageService, ProgressService],
})
export class PainelModule {}
