import { Controller, Get, Param, UseGuards } from '@nestjs/common'
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger'
import { ProgressService } from './progress.service'
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard'
import { CurrentUser } from '../../../shared/decorators/current-user.decorator'
import type { User } from '@prisma/client'

@ApiTags('Progress')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('progress')
export class ProgressController {
  constructor(private readonly progressService: ProgressService) {}

  @Get()
  @ApiOperation({ summary: 'Obtener todo el progreso del usuario' })
  findAll(@CurrentUser() user: User) {
    return this.progressService.findAll(user.id)
  }

  @Get(':levelId')
  @ApiOperation({ summary: 'Obtener progreso en un nivel específico' })
  findByLevel(@CurrentUser() user: User, @Param('levelId') levelId: string) {
    return this.progressService.findByLevel(user.id, levelId)
  }
}
