import { Controller, Post, Patch, Param, Body, UseGuards } from '@nestjs/common'
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger'
import { IsNotEmpty, IsNumber, IsString, Min } from 'class-validator'
import { SessionsService } from './sessions.service'
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard'
import { CurrentUser } from '../../../shared/decorators/current-user.decorator'
import type { User } from '@prisma/client'

class CreateSessionDto {
  @IsString()
  @IsNotEmpty()
  levelId: string
}

class SubmitAnswerDto {
  @IsString()
  @IsNotEmpty()
  questionId: string

  @IsNotEmpty()
  answer: unknown

  @IsNumber()
  @Min(0)
  timeSpent: number
}

class CompleteSessionDto {
  @IsNumber()
  @Min(0)
  score: number

  @IsNumber()
  @Min(0)
  stars: number

  @IsNumber()
  @Min(0)
  timeSpent: number
}

@ApiTags('Game')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('game/sessions')
export class SessionsController {
  constructor(private readonly sessionsService: SessionsService) {}

  @Post()
  @ApiOperation({ summary: 'Iniciar sesión de juego' })
  create(@CurrentUser() user: User, @Body() dto: CreateSessionDto) {
    return this.sessionsService.create(user.id, dto)
  }

  @Patch(':id/answer')
  @ApiOperation({ summary: 'Registrar respuesta a pregunta' })
  submitAnswer(
    @Param('id') id: string,
    @CurrentUser() user: User,
    @Body() dto: SubmitAnswerDto,
  ) {
    return this.sessionsService.submitAnswer(id, user.id, dto)
  }

  @Post(':id/complete')
  @ApiOperation({ summary: 'Finalizar sesión de juego' })
  complete(
    @Param('id') id: string,
    @CurrentUser() user: User,
    @Body() dto: CompleteSessionDto,
  ) {
    return this.sessionsService.complete(id, user.id, dto)
  }
}
