import { Controller, Get, Patch, Post, Body, UseGuards } from '@nestjs/common'
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger'
import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator'
import { UsersService } from './users.service'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'
import { CurrentUser } from '../../shared/decorators/current-user.decorator'
import type { User } from '@prisma/client'

class UpdateMeDto {
  @IsOptional()
  @IsString()
  @MaxLength(64)
  displayName?: string
}

class ChangePasswordDto {
  @IsString()
  @MinLength(1)
  currentPassword: string

  @IsString()
  @MinLength(6)
  @MaxLength(64)
  newPassword: string
}

@ApiTags('Users')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  @ApiOperation({ summary: 'Obtener perfil del usuario autenticado' })
  getMe(@CurrentUser() user: User) {
    return this.usersService.findMe(user.id)
  }

  @Patch('me')
  @ApiOperation({ summary: 'Actualizar perfil del usuario autenticado' })
  updateMe(@CurrentUser() user: User, @Body() dto: UpdateMeDto) {
    return this.usersService.updateMe(user.id, dto)
  }

  @Post('me/reset')
  @ApiOperation({ summary: 'Reiniciar progreso del usuario (XP, monedas, niveles)' })
  resetProgress(@CurrentUser() user: User) {
    return this.usersService.resetProgress(user.id)
  }

  @Post('me/password')
  @ApiOperation({ summary: 'Cambiar contraseña del usuario autenticado' })
  changePassword(@CurrentUser() user: User, @Body() dto: ChangePasswordDto) {
    return this.usersService.changePassword(user.id, dto.currentPassword, dto.newPassword)
  }

  @Get('me/achievements')
  @ApiOperation({ summary: 'Listar logros del usuario' })
  getAchievements(@CurrentUser() user: User) {
    return this.usersService.findAchievements(user.id)
  }
}
