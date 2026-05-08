import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import * as bcrypt from 'bcrypt'
import { createHash, randomBytes } from 'crypto'
import { PrismaService } from '../../prisma/prisma.service'
import { EmailService } from '../../shared/services/email.service'
import type { LoginDto } from './dto/login.dto'
import type { RegisterDto } from './dto/register.dto'
import type { ForgotPasswordDto } from './dto/forgot-password.dto'
import type { ResetPasswordDto } from './dto/reset-password.dto'

const SALT_ROUNDS = 12

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly email: EmailService,
  ) {}

  async register(dto: RegisterDto) {
    const exists = await this.prisma.user.findFirst({
      where: { OR: [{ email: dto.email }, { username: dto.username }] },
    })

    if (exists) {
      throw new ConflictException(
        exists.email === dto.email
          ? 'El email ya está registrado'
          : 'El nombre de usuario ya está en uso',
      )
    }

    const hashed = await bcrypt.hash(dto.password, SALT_ROUNDS)

    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        username: dto.username,
        password: hashed,
        role: dto.role ?? 'STUDENT',
        profile: {
          create: { displayName: dto.username },
        },
      },
      include: { profile: true },
    })

    return this.issueTokens(user)
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
      include: { profile: true },
    })

    if (!user || !(await bcrypt.compare(dto.password, user.password))) {
      throw new UnauthorizedException('Credenciales inválidas')
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Cuenta desactivada')
    }

    return this.issueTokens(user)
  }

  async refresh(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { profile: true },
    })

    if (!user) throw new UnauthorizedException()

    return this.issueTokens(user)
  }

  async logout(userId: string) {
    await this.prisma.user.update({
      where: { id: userId },
      data: { refreshToken: null },
    })
  }

  async forgotPassword(dto: ForgotPasswordDto) {
    const user = await this.prisma.user.findUnique({ where: { email: dto.email } })

    // Always respond OK — never reveal whether email exists
    if (!user || !user.isActive) {
      return { message: 'Si el correo existe recibirás un enlace en breve.' }
    }

    const plainToken = randomBytes(32).toString('hex')
    const hashedToken = createHash('sha256').update(plainToken).digest('hex')
    const expires = new Date(Date.now() + 60 * 60 * 1000) // 1 hour

    await this.prisma.user.update({
      where: { id: user.id },
      data: { passwordResetToken: hashedToken, passwordResetExpires: expires },
    })

    const frontendUrl = process.env.FRONTEND_URL ?? 'http://localhost:5173'
    const resetUrl = `${frontendUrl}/auth/reset-password?token=${plainToken}`

    await this.email.sendPasswordReset(user.email, resetUrl)

    return { message: 'Si el correo existe recibirás un enlace en breve.' }
  }

  async resetPassword(dto: ResetPasswordDto) {
    const hashedToken = createHash('sha256').update(dto.token).digest('hex')

    const user = await this.prisma.user.findFirst({
      where: {
        passwordResetToken: hashedToken,
        passwordResetExpires: { gt: new Date() },
      },
    })

    if (!user) {
      throw new BadRequestException('El enlace es inválido o ha expirado.')
    }

    const hashed = await bcrypt.hash(dto.password, SALT_ROUNDS)

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashed,
        passwordResetToken: null,
        passwordResetExpires: null,
        refreshToken: null, // invalidate active sessions
      },
    })

    return { message: 'Contraseña actualizada. Ya puedes iniciar sesión.' }
  }

  private async issueTokens(user: { id: string; email: string; role: string }) {
    const payload = { sub: user.id, email: user.email, role: user.role }

    const accessToken = this.jwt.sign(payload, {
      secret: process.env.JWT_SECRET,
      expiresIn: process.env.JWT_EXPIRES_IN ?? '15m',
    })

    const refreshToken = this.jwt.sign(payload, {
      secret: process.env.JWT_REFRESH_SECRET,
      expiresIn: process.env.JWT_REFRESH_EXPIRES_IN ?? '7d',
    })

    await this.prisma.user.update({
      where: { id: user.id },
      data: { refreshToken },
    })

    return { accessToken, refreshToken, user }
  }
}
