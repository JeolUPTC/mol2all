import { Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common'
import { PrismaService } from '../../prisma/prisma.service'
import * as bcrypt from 'bcrypt'

const SALT_ROUNDS = 12

interface UpdateMeDto {
  displayName?: string
}

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async findMe(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        username: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        profile: true,
      },
    })

    if (!user) throw new NotFoundException('Usuario no encontrado')
    return user
  }

  async updateMe(userId: string, dto: UpdateMeDto) {
    await this.prisma.profile.update({
      where: { userId },
      data: { displayName: dto.displayName },
    })
    return this.findMe(userId)
  }

  async resetProgress(userId: string) {
    await this.prisma.$transaction([
      this.prisma.progress.deleteMany({ where: { userId } }),
      this.prisma.profile.update({
        where: { userId },
        data: { totalXp: 0, totalCoins: 0 },
      }),
    ])
    return this.findMe(userId)
  }

  async changePassword(userId: string, currentPassword: string, newPassword: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } })
    if (!user) throw new NotFoundException('Usuario no encontrado')
    const valid = await bcrypt.compare(currentPassword, user.password)
    if (!valid) throw new UnauthorizedException('La contraseña actual es incorrecta.')
    const hashed = await bcrypt.hash(newPassword, SALT_ROUNDS)
    await this.prisma.user.update({ where: { id: userId }, data: { password: hashed } })
    return { message: 'Contraseña actualizada correctamente.' }
  }

  async findAchievements(userId: string) {
    return this.prisma.userAchievement.findMany({
      where: { userId },
      include: { achievement: true },
      orderBy: { unlockedAt: 'desc' },
    })
  }
}
