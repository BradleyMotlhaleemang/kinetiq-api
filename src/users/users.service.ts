import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

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
      select: {
        id: true,
        email: true,
        displayName: true,
        experienceLevel: true,
        trainingAgeMths: true,
        bodyweightKg: true,
        goalMode: true,
        gender: true,
        notificationsEnabled: true,
        preferredTrainingTime: true,
        onboardingCompletedAt: true,
        createdAt: true,
      },
    });
  }

  async updateOnboarding(userId: string, data: {
    gender?: string;
    dateOfBirth?: string;
    bodyweightKg?: number;
    goalMode?: string;
    experienceLevel?: string;
    trainingAgeMths?: number;
    notificationsEnabled?: boolean;
    preferredTrainingTime?: string;
  }) {
    return this.prisma.user.update({
      where: { id: userId },
      data: {
        ...data,
        dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : undefined,
        onboardingCompletedAt: new Date(),
      },
      select: {
        id: true,
        email: true,
        displayName: true,
        goalMode: true,
        gender: true,
        experienceLevel: true,
        trainingAgeMths: true,
        bodyweightKg: true,
        notificationsEnabled: true,
        preferredTrainingTime: true,
        onboardingCompletedAt: true,
      },
    });
  }
}