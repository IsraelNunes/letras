import { BadRequestException, Body, Controller, Get, ParseIntPipe, Post, Query } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { UploadedFile, UseInterceptors } from '@nestjs/common';
import { SyncEntityType } from '@prisma/client';
import { CreateAssetDto } from './dto/create-asset.dto';
import { CreateAtividadeDto } from './dto/create-atividade.dto';
import { CreateBlueprintDto } from './dto/create-blueprint.dto';
import { CreateModuloDto } from './dto/create-modulo.dto';
import { CreateTemaPainelDto } from './dto/create-tema.dto';
import { ImportBlueprintManifestDto } from './dto/import-blueprint-manifest.dto';
import { UploadAssetDto } from './dto/upload-asset.dto';
import { PainelService } from './painel.service';

@Controller('painel')
export class PainelController {
  constructor(private readonly painelService: PainelService) {}

  @Get('dashboard/admin')
  getDashboardAdmin() {
    return this.painelService.getDashboardAdmin();
  }

  @Get('dashboard/tutor')
  getDashboardTutor(@Query('tutorId') tutorId?: string) {
    if (!tutorId) {
      throw new BadRequestException('tutorId is required');
    }
    return this.painelService.getDashboardTutor(tutorId);
  }

  @Get('conteudo')
  getConteudo() {
    return this.painelService.getConteudo();
  }

  @Post('conteudo/temas')
  createTema(@Body() dto: CreateTemaPainelDto) {
    return this.painelService.createTema(dto);
  }

  @Post('conteudo/modulos')
  createModulo(@Body() dto: CreateModuloDto) {
    return this.painelService.createModulo(dto);
  }

  @Post('conteudo/atividades')
  createAtividade(@Body() dto: CreateAtividadeDto) {
    return this.painelService.createAtividade(dto);
  }

  @Post('conteudo/assets')
  createAsset(@Body() dto: CreateAssetDto) {
    return this.painelService.createAsset(dto);
  }

  @Post('conteudo/assets/upload')
  @UseInterceptors(
    FileInterceptor('file', {
      limits: {
        fileSize: 100 * 1024 * 1024,
      },
    }),
  )
  uploadAsset(
    @UploadedFile()
    file:
      | {
          buffer: Buffer;
          originalname: string;
          mimetype: string;
          size: number;
        }
      | undefined,
    @Body() dto: UploadAssetDto,
  ) {
    return this.painelService.uploadAssetFile(file, dto);
  }

  @Post('conteudo/blueprints')
  createBlueprint(@Body() dto: CreateBlueprintDto) {
    return this.painelService.createBlueprint(dto);
  }

  @Post('conteudo/blueprints/import-manifest')
  importBlueprintManifest(@Body() dto: ImportBlueprintManifestDto) {
    return this.painelService.importBlueprintManifest(dto);
  }

  @Get('fila')
  getFila() {
    return this.painelService.getFila();
  }

  @Get('ranking')
  getRanking() {
    return this.painelService.getRanking();
  }

  @Get('relatorios/inatividade')
  getRelatorioInatividade(@Query('days', new ParseIntPipe({ optional: true })) days?: number) {
    return this.painelService.getRelatorioInatividade(days);
  }

  @Get('grupos')
  getGrupos() {
    return this.painelService.getGrupos();
  }

  @Get('eventos')
  getEventos(
    @Query('limit', new ParseIntPipe({ optional: true })) limit?: number,
    @Query('entityType') entityType?: SyncEntityType,
  ) {
    return this.painelService.getEventos(limit, entityType);
  }
}
