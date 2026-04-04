import { Injectable } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaClient) {}

  async create(email: string, password: string, displayName: string) {
    const passwordHash = await bcrypt.hash(password, 10);
    return this.prisma.user.create({
      data: { email, passwordHash, displayName },
    });
  }

  async findByEmail(email: string) {
    return this.prisma.user.findUnique({ where: { email } });
  }

  async findById(id: string) {
    return this.prisma.user.findUnique({
      where: { id },
      select: { id: true, email: true, displayName: true, experienceLevel: true,
                trainingAgeMths: true, bodyweightKg: true, createdAt: true },
    });
  }
}