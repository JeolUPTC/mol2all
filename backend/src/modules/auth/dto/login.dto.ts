import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator'
import { ApiProperty } from '@nestjs/swagger'

export class LoginDto {
  @ApiProperty({ example: 'estudiante@escuela.edu' })
  @IsEmail({}, { message: 'Email inválido' })
  email: string

  @ApiProperty({ example: 'secreto123' })
  @IsString()
  @IsNotEmpty()
  @MinLength(8, { message: 'La contraseña debe tener al menos 8 caracteres' })
  password: string
}
