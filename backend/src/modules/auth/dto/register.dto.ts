import { IsEmail, IsEnum, IsNotEmpty, IsOptional, IsString, Matches, MinLength } from 'class-validator'
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { Role } from '@prisma/client'

export class RegisterDto {
  @ApiProperty({ example: 'moleculero42' })
  @IsString()
  @IsNotEmpty()
  @Matches(/^[a-zA-Z0-9_]{3,30}$/, {
    message: 'El usuario solo puede contener letras, números y guiones bajos (3-30 caracteres)',
  })
  username: string

  @ApiProperty({ example: 'estudiante@escuela.edu' })
  @IsEmail({}, { message: 'Email inválido' })
  email: string

  @ApiProperty({ example: 'secreto123' })
  @IsString()
  @MinLength(8, { message: 'La contraseña debe tener al menos 8 caracteres' })
  password: string

  @ApiPropertyOptional({ enum: Role, default: Role.STUDENT })
  @IsOptional()
  @IsEnum(Role)
  role?: Role
}
