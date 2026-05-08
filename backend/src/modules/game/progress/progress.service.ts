import { Injectable } from '@nestjs/common'
import { PrismaService } from '../../../prisma/prisma.service'

@Injectable()
export class ProgressService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(userId: string) {
    return this.prisma.progress.findMany({
      where: { userId },
      include: { level: true },
      orderBy: { level: { order: 'asc' } },
    })
  }

  async findByLevel(userId: string, levelId: string) {
    return this.prisma.progress.findUnique({
      where: { userId_levelId: { userId, levelId } },
    })
  }
}
