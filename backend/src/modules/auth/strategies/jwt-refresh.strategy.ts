import { Injectable, UnauthorizedException } from '@nestjs/common'
import { PassportStrategy } from '@nestjs/passport'
import { ExtractJwt, Strategy } from 'passport-jwt'
import { Request } from 'express'
import { PrismaService } from '../../../prisma/prisma.service'
import type { JwtPayload } from './jwt.strategy'

@Injectable()
export class JwtRefreshStrategy extends PassportStrategy(Strategy, 'jwt-refresh') {
  constructor(private readonly prisma: PrismaService) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (req: Request) => req.cookies?.refresh_token ?? null,
      ]),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_REFRESH_SECRET ?? 'fallback_refresh_secret',
      passReqToCallback: true,
    })
  }

  async validate(req: Request, payload: JwtPayload) {
    const refreshToken = req.cookies?.refresh_token
    if (!refreshToken) throw new UnauthorizedException('Refresh token no encontrado')

    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
    })

    if (!user || user.refreshToken !== refreshToken) {
      throw new UnauthorizedException('Refresh token inválido')
    }

    return user
  }
}
