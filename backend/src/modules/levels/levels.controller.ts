import { Controller, Get, Param, UseGuards } from '@nestjs/common'
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger'
import { LevelsService } from './levels.service'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'
import { CurrentUser } from '../../shared/decorators/current-user.decorator'
import type { User } from '@prisma/client'

@ApiTags('Levels')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('levels')
export class LevelsController {
  constructor(private readonly levelsService: LevelsService) {}

  @Get()
  @ApiOperation({ summary: 'Listar todos los niveles con progreso del usuario' })
  findAll(@CurrentUser() user: User) {
    return this.levelsService.findAllWithProgress(user.id)
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener nivel por ID' })
  findOne(@Param('id') id: string) {
    return this.levelsService.findOne(id)
  }

  @Get(':id/questions')
  @ApiOperation({ summary: 'Obtener preguntas de un nivel' })
  findQuestions(@Param('id') id: string) {
    return this.levelsService.findQuestions(id)
  }
}
