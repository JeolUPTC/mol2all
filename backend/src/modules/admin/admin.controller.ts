import {
  Controller, Get, Post, Patch, Delete, Param, Body, UseGuards, HttpCode, HttpStatus,
} from '@nestjs/common'
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger'
import {
  IsArray, IsBoolean, IsEmail, IsEnum, IsIn, IsInt, IsNumber, IsNotEmpty,
  IsOptional, IsString, MaxLength, Max, Min, MinLength, ValidateNested,
} from 'class-validator'
import { Type } from 'class-transformer'
import { Role, QuestionStatus, QuestionType } from '@prisma/client'
import { AdminService } from './admin.service'
import { SeedService } from './seed.service'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'
import { RolesGuard } from '../auth/guards/roles.guard'
import { Roles } from '../../shared/decorators/roles.decorator'
import { CurrentUser } from '../../shared/decorators/current-user.decorator'
import type { User } from '@prisma/client'

class CreateTeacherDto {
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
}

class UpdateUserDto {
  @IsOptional()
  @IsBoolean()
  isActive?: boolean

  @IsOptional()
  @IsEnum(Role)
  role?: Role
}

class CreateGroupDto {
  @IsString()
  @MinLength(2)
  @MaxLength(64)
  name: string

  @IsOptional()
  @IsString()
  @MaxLength(256)
  description?: string

  @IsOptional()
  @IsString()
  teacherId?: string
}

class UpdateGroupDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(64)
  name?: string

  @IsOptional()
  @IsString()
  @MaxLength(256)
  description?: string

  @IsOptional()
  @IsString()
  teacherId?: string | null

  @IsOptional()
  @IsBoolean()
  isActive?: boolean
}

class UpdateLevelDto {
  @IsOptional()
  @IsString()
  @MaxLength(128)
  name?: string

  @IsOptional()
  @IsString()
  @MaxLength(512)
  description?: string

  @IsOptional()
  @IsNumber()
  @Min(0)
  xpReward?: number

  @IsOptional()
  @IsNumber()
  @Min(0)
  coinsReward?: number

  @IsOptional()
  @IsBoolean()
  isActive?: boolean
}

class AdminOptionDto {
  @IsIn(['a', 'b', 'c', 'd'])
  id: string

  @IsString()
  @IsNotEmpty()
  text: string
}

class AdminCreateQuestionDto {
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
  @Type(() => AdminOptionDto)
  options?: AdminOptionDto[]

  @IsNotEmpty()
  correctAnswer: object

  @IsString()
  @IsNotEmpty()
  explanation: string
}

class ReviewQuestionDto {
  @IsEnum(QuestionStatus)
  status: 'APPROVED' | 'REJECTED'

  @IsOptional()
  @IsString()
  @MaxLength(512)
  reviewNote?: string
}

@ApiTags('Admin')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
@Controller('admin')
export class AdminController {
  constructor(
    private readonly adminService: AdminService,
    private readonly seedService: SeedService,
  ) {}

  @Get('stats')
  @ApiOperation({ summary: 'Estadísticas globales' })
  getStats() {
    return this.adminService.getStats()
  }

  @Get('analytics')
  @ApiOperation({ summary: 'Analíticas detalladas para el dashboard de admin' })
  getAnalytics() {
    return this.adminService.getAnalytics()
  }

  // ── Users ──────────────────────────────────────────────────────────────────

  @Get('users')
  @ApiOperation({ summary: 'Listar todos los usuarios' })
  getUsers() {
    return this.adminService.getUsers()
  }

  @Post('users')
  @ApiOperation({ summary: 'Crear docente' })
  createTeacher(@Body() dto: CreateTeacherDto) {
    return this.adminService.createTeacher(dto)
  }

  @Patch('users/:id')
  @ApiOperation({ summary: 'Actualizar estado o rol de un usuario' })
  updateUser(@Param('id') id: string, @Body() dto: UpdateUserDto) {
    return this.adminService.updateUser(id, dto)
  }

  @Get('teachers')
  @ApiOperation({ summary: 'Listar docentes (para select)' })
  getTeachers() {
    return this.adminService.getTeachers()
  }

  // ── Groups ─────────────────────────────────────────────────────────────────

  @Get('groups')
  @ApiOperation({ summary: 'Listar grupos' })
  getGroups() {
    return this.adminService.getGroups()
  }

  @Post('groups')
  @ApiOperation({ summary: 'Crear grupo' })
  createGroup(@Body() dto: CreateGroupDto) {
    return this.adminService.createGroup(dto)
  }

  @Patch('groups/:id')
  @ApiOperation({ summary: 'Actualizar grupo' })
  updateGroup(@Param('id') id: string, @Body() dto: UpdateGroupDto) {
    return this.adminService.updateGroup(id, dto)
  }

  @Get('groups/:id/students')
  @ApiOperation({ summary: 'Estudiantes de un grupo' })
  getGroupStudents(@Param('id') id: string) {
    return this.adminService.getGroupStudents(id)
  }

  @Post('groups/:id/students/:studentId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Asignar estudiante a grupo' })
  assignStudent(@Param('id') groupId: string, @Param('studentId') studentId: string) {
    return this.adminService.assignStudentToGroup(groupId, studentId)
  }

  @Delete('groups/:id/students/:studentId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Quitar estudiante del grupo' })
  removeStudent(@Param('studentId') studentId: string) {
    return this.adminService.removeStudentFromGroup(studentId)
  }

  @Get('groups/stats')
  @ApiOperation({ summary: 'Estadísticas comparativas por grupo' })
  getGroupStats() {
    return this.adminService.getGroupStats()
  }

  // ── Levels ─────────────────────────────────────────────────────────────────

  @Get('levels')
  @ApiOperation({ summary: 'Listar niveles' })
  getLevels() {
    return this.adminService.getLevels()
  }

  @Patch('levels/:id')
  @ApiOperation({ summary: 'Actualizar nivel' })
  updateLevel(@Param('id') id: string, @Body() dto: UpdateLevelDto) {
    return this.adminService.updateLevel(id, dto)
  }

  // ── Questions ──────────────────────────────────────────────────────────────

  @Get('students/unassigned')
  @ApiOperation({ summary: 'Estudiantes sin grupo asignado' })
  getUnassigned() {
    return this.adminService.getUnassignedStudents()
  }

  @Get('questions/pending')
  @ApiOperation({ summary: 'Preguntas pendientes de revisión' })
  getPendingQuestions() {
    return this.adminService.getPendingQuestions()
  }

  @Post('questions')
  @ApiOperation({ summary: 'Crear pregunta (auto-aprobada, solo admin)' })
  createQuestion(@CurrentUser() user: User, @Body() dto: AdminCreateQuestionDto) {
    return this.adminService.createQuestion(user.id, dto)
  }

  @Get('questions/approved')
  @ApiOperation({ summary: 'Banco de preguntas aprobadas' })
  getApprovedQuestions() {
    return this.adminService.getApprovedQuestions()
  }

  @Patch('questions/:id')
  @ApiOperation({ summary: 'Editar pregunta del banco' })
  updateQuestion(@Param('id') id: string, @Body() dto: AdminCreateQuestionDto) {
    return this.adminService.updateQuestion(id, dto)
  }

  @Patch('questions/:id/review')
  @ApiOperation({ summary: 'Aprobar o rechazar pregunta' })
  reviewQuestion(@Param('id') id: string, @Body() dto: ReviewQuestionDto) {
    return this.adminService.reviewQuestion(id, dto)
  }

  @Patch('questions/:id/toggle')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Activar/desactivar pregunta del banco' })
  toggleQuestion(@Param('id') id: string) {
    return this.adminService.toggleQuestionActive(id)
  }

  // ── Seed / Sistema ─────────────────────────────────────────────────────────

  @Post('seed/reset')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reiniciar sistema — conserva admin y preguntas base' })
  seedReset() {
    return this.seedService.reset()
  }

  @Post('seed/demo')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Cargar datos demo — docentes, grupos, estudiantes, preguntas' })
  seedDemo() {
    return this.seedService.seedDemo()
  }

  @Post('seed/e2e')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Crear/actualizar usuarios fijos para tests E2E de Playwright' })
  seedE2e() {
    return this.seedService.seedE2e()
  }
}
