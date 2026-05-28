import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { TutorLearnerLinkStatus } from '@prisma/client';
import { CadastrosService } from './cadastros.service';
import { CreateAlfabetizadorDto } from './dto/create-alfabetizador.dto';
import { CreateAlfabetizandoDto } from './dto/create-alfabetizando.dto';
import { CreateVinculoDto } from './dto/create-vinculo.dto';
import { UpdateVinculoDto } from './dto/update-vinculo.dto';

@Controller('cadastros')
export class CadastrosController {
  constructor(private readonly cadastrosService: CadastrosService) {}

  @Get('alfabetizadores')
  getAlfabetizadores() {
    return this.cadastrosService.listAlfabetizadores();
  }

  @Post('alfabetizadores')
  createAlfabetizador(@Body() dto: CreateAlfabetizadorDto) {
    return this.cadastrosService.createAlfabetizador(dto);
  }

  @Get('alfabetizandos')
  getAlfabetizandos(@Query('educatorId') educatorId?: string) {
    return this.cadastrosService.listAlfabetizandos(educatorId);
  }

  @Get('alfabetizandos/:id')
  getAlfabetizandoById(@Param('id') id: string) {
    return this.cadastrosService.getAlfabetizandoById(id);
  }

  @Post('alfabetizandos')
  createAlfabetizando(@Body() dto: CreateAlfabetizandoDto) {
    return this.cadastrosService.createAlfabetizando(dto);
  }

  @Get('vinculos')
  getVinculos(@Query('status') status?: TutorLearnerLinkStatus) {
    return this.cadastrosService.listVinculos(status);
  }

  @Post('vinculos')
  createVinculo(@Body() dto: CreateVinculoDto) {
    return this.cadastrosService.createVinculo(dto);
  }

  @Patch('vinculos/:id')
  updateVinculo(@Param('id') id: string, @Body() dto: UpdateVinculoDto) {
    return this.cadastrosService.updateVinculo(id, dto);
  }
}
