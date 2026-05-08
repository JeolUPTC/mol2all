import { ApiProperty } from '@nestjs/swagger'
import { IsEmail } from 'class-validator'

export class ForgotPasswordDto {
  @ApiProperty({ example: 'estudiante@escuela.edu' })
  @IsEmail()
  email!: string
}
