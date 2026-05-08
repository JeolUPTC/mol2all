import {
  Controller, Get, Post, Delete, Patch, Param, Body, Res, UseGuards, HttpCode, HttpStatus,
} from '@nestjs/common'
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger'
import {
  IsEmail, IsEnum, IsIn, IsInt, IsNotEmpty, IsNumber, IsOptional,
  IsString, Max, MaxLength, Min, MinLength, ValidateIf, ValidateNested, IsArray,
} from 'class-validator'
import { Type } from 'class-transformer'
import type { Response } from 'express'
import type { User } from '@prisma/client'
import { QuestionType, Role } from '@prisma/client'
import { TeacherService } from './teacher.service'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'
import { RolesGuard } from '../auth/guards/roles.guard'
import { Roles } from '../../shared/decorators/roles.decorator'
import { CurrentUser } from '../../shared/decorators/current-user.decorator'

class CreateStudentDto {
  @IsEmail()
  email: string

  @IsString()
  @MinLength(3)
  @MaxLength(32)
  username: string

  @IsString()
  @MinLength(3)
  @MaxLength(64)
  displayName: string

  @IsString()
  @MinLength(6)
  @MaxLength(64)
  password: string

  @IsOptional()
  @IsString()
  groupId?: string
}

class OptionDto {
  @IsIn(['a', 'b', 'c', 'd'])
  id: string

  @IsString()
  @IsNotEmpty()
  text: string
}

class CreateQuestionDto {
  @IsEnum(QuestionType)
  type: QuestionType

  @IsString()
  @IsNotEmpty()
  topic: string

  @IsInt()
  @Min(1)
  @Max(3)
  difficulty: number

  @IsString()
  @IsNotEmpty()
  stem: string

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OptionDto)
  options?: OptionDto[]

  @IsNotEmpty()
  correctAnswer: object

  @IsString()
  @IsNotEmpty()
  explanation: string
}

@ApiTags('Teacher')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.TEACHER, Role.ADMIN)
@Controller('teacher')
export class TeacherController {
  constructor(private readonly teacherService: TeacherService) {}

  // ── Groups ──────────────────────────────────────────────────────────────────

  @Get('groups')
  @ApiOperation({ summary: 'Mis grupos' })
  getMyGroups(@CurrentUser() user: User) {
    return this.teacherService.getMyGroups(user.id)
  }

  @Get('groups/:groupId/students')
  @ApiOperation({ summary: 'Estudiantes de un grupo' })
  getGroupStudents(@Param('groupId') groupId: string, @CurrentUser() user: User) {
    return this.teacherService.getGroupStudents(groupId, user.id)
  }

  @Post('groups/:groupId/students/:studentId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Asignar estudiante a grupo' })
  assignStudent(
    @Param('groupId') groupId: string,
    @Param('studentId') studentId: string,
    @CurrentUser() user: User,
  ) {
    return this.teacherService.assignStudentToGroup(groupId, studentId, user.id)
  }

  @Delete('groups/:groupId/students/:studentId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Quitar estudiante del grupo' })
  removeStudent(
    @Param('groupId') groupId: string,
    @Param('studentId') studentId: string,
    @CurrentUser() user: User,
  ) {
    return this.teacherService.removeStudentFromGroup(groupId, studentId, user.id)
  }

  @Get('students/unassigned')
  @ApiOperation({ summary: 'Estudiantes sin grupo asignado' })
  getUnassigned() {
    return this.teacherService.getUnassignedStudents()
  }

  // ── Students ────────────────────────────────────────────────────────────────

  @Post('students')
  @ApiOperation({ summary: 'Crear estudiante' })
  createStudent(@CurrentUser() user: User, @Body() dto: CreateStudentDto) {
    return this.teacherService.createStudent(user.id, dto)
  }

  @Get('students/:id/progress')
  @ApiOperation({ summary: 'Ver progreso de un estudiante' })
  getStudentProgress(@Param('id') id: string) {
    return this.teacherService.getStudentProgress(id)
  }

  @Post('students/:id/reset')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reiniciar progreso de un estudiante' })
  resetStudentProgress(@Param('id') id: string) {
    return this.teacherService.resetStudentProgress(id)
  }

  // ── Reports ─────────────────────────────────────────────────────────────────

  @Get('analytics')
  @ApiOperation({ summary: 'Analíticas para el dashboard del docente' })
  getAnalytics(@CurrentUser() user: User) {
    return this.teacherService.getTeacherAnalytics(user.id)
  }

  @Get('summary')
  @ApiOperation({ summary: 'Resumen general' })
  getSummary() {
    return this.teacherService.getSummary()
  }

  @Get('report/csv')
  @ApiOperation({ summary: 'Reporte CSV de progreso' })
  async downloadReport(@Res() res: Response) {
    const csv = await this.teacherService.getProgressReport()
    const date = new Date().toISOString().slice(0, 10)
    res
      .setHeader('Content-Type', 'text/csv; charset=utf-8')
      .setHeader('Content-Disposition', `attachment; filename="reporte_mol2all_${date}.csv"`)
      .send('﻿' + csv)
  }

  // ── Question bank ───────────────────────────────────────────────────────────

  @Post('questions')
  @ApiOperation({ summary: 'Crear pregunta (queda PENDING)' })
  createQuestion(@CurrentUser() user: User, @Body() dto: CreateQuestionDto) {
    return this.teacherService.createQuestion(user.id, dto)
  }

  @Get('questions/mine')
  @ApiOperation({ summary: 'Mis preguntas enviadas' })
  getMyQuestions(@CurrentUser() user: User) {
    return this.teacherService.getMyQuestions(user.id)
  }

  @Get('questions/stats')
  @ApiOperation({ summary: 'Estadísticas de errores por pregunta' })
  getQuestionStats() {
    return this.teacherService.getQuestionStats()
  }

  @Get('questions/bank')
  @ApiOperation({ summary: 'Ver banco de preguntas aprobadas' })
  getBankQuestions() {
    return this.teacherService.getBankQuestions()
  }

  @Patch('questions/:id')
  @ApiOperation({ summary: 'Editar pregunta propia' })
  updateQuestion(
    @Param('id') id: string,
    @CurrentUser() user: User,
    @Body() dto: CreateQuestionDto,
  ) {
    return this.teacherService.updateQuestion(user.id, id, dto)
  }
}
