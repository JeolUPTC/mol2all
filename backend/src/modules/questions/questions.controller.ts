import { Controller, Get, Post, Body, Query, ParseIntPipe, UseGuards, DefaultValuePipe } from '@nestjs/common'
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger'
import { IsNotEmpty, IsNumber, Min, Max } from 'class-validator'
import { QuestionsService } from './questions.service'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'
import { RolesGuard } from '../auth/guards/roles.guard'
import { Roles } from '../../shared/decorators/roles.decorator'
import { Role } from '@prisma/client'

class CheckAnswerDto {
  @IsNotEmpty()
  questionType: string

  @IsNotEmpty()
  correctAnswer: unknown

  @IsNotEmpty()
  submittedAnswer: unknown
}

class SaveQuestionDto {
  @IsNotEmpty()
  topic: string

  @IsNumber()
  @Min(1)
  @Max(3)
  difficulty: number
}

@ApiTags('Questions')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('questions')
export class QuestionsController {
  constructor(private readonly questionsService: QuestionsService) {}

  @Get('generate')
  @ApiOperation({ summary: 'Generar una pregunta procedural' })
  @ApiQuery({ name: 'topic', enum: ['molar_mass', 'balancing', 'stoichiometry', 'limiting_reagent', 'yield'] })
  @ApiQuery({ name: 'difficulty', enum: [1, 2, 3] })
  generate(
    @Query('topic') topic: string,
    @Query('difficulty', new DefaultValuePipe(1), ParseIntPipe) difficulty: number,
  ) {
    return this.questionsService.generate(topic, difficulty)
  }

  @Get('batch')
  @ApiOperation({ summary: 'Generar lote de preguntas procedurales' })
  @ApiQuery({ name: 'topic', enum: ['molar_mass', 'balancing', 'stoichiometry', 'limiting_reagent', 'yield'] })
  @ApiQuery({ name: 'difficulty', enum: [1, 2, 3] })
  @ApiQuery({ name: 'count', type: Number, description: 'Cantidad (1-20)', required: false })
  generateBatch(
    @Query('topic') topic: string,
    @Query('difficulty', new DefaultValuePipe(1), ParseIntPipe) difficulty: number,
    @Query('count', new DefaultValuePipe(5), ParseIntPipe) count: number,
  ) {
    return this.questionsService.generateBatch(topic, difficulty, count)
  }

  @Post('check')
  @ApiOperation({ summary: 'Verificar respuesta a una pregunta' })
  checkAnswer(@Body() dto: CheckAnswerDto) {
    return this.questionsService.checkAnswer(
      dto.questionType,
      dto.correctAnswer,
      dto.submittedAnswer,
    )
  }

  @Post('save-generated')
  @UseGuards(RolesGuard)
  @Roles(Role.TEACHER, Role.ADMIN)
  @ApiOperation({ summary: 'Generar y guardar pregunta en DB (Docente/Admin)' })
  saveGenerated(@Body() dto: SaveQuestionDto) {
    return this.questionsService.generateAndSave(dto.topic, dto.difficulty)
  }
}
