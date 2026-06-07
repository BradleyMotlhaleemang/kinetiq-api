import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import {
  EXPERIENCE_LEVEL_VALUES,
  ExperienceLevelValue,
  SubmitClassificationDto,
} from './dto/submit-classification.dto';

type DomainKey =
  | 'trainingConsistency'
  | 'progressionUnderstanding'
  | 'recoveryAwareness'
  | 'strengthDevelopment'
  | 'exerciseExecution'
  | 'selfRegulation';

const DOMAIN_QUESTIONS: Record<DomainKey, [number, number]> = {
  trainingConsistency: [0, 1],
  progressionUnderstanding: [2, 3],
  recoveryAwareness: [4, 5],
  strengthDevelopment: [6, 7],
  exerciseExecution: [8, 9],
  selfRegulation: [10, 11],
};

const DOMAIN_WEIGHTS: Record<DomainKey, number> = {
  trainingConsistency: 0.75,
  progressionUnderstanding: 1.5,
  recoveryAwareness: 1.25,
  strengthDevelopment: 1.25,
  exerciseExecution: 1.0,
  selfRegulation: 1.5,
};

function getRecommendedLevel(score: number): ExperienceLevelValue {
  if (score <= 16) return 'BEGINNER';
  if (score <= 27) return 'INTERMEDIATE';
  return 'ADVANCED';
}

function getRecommendationBand(score: number) {
  if (score <= 10) return 'BEGINNER_HIGH';
  if (score <= 16) return 'BEGINNER_LEANING_INTERMEDIATE';
  if (score <= 22) return 'INTERMEDIATE_HIGH';
  if (score <= 27) return 'INTERMEDIATE_LEANING_ADVANCED';
  return 'ADVANCED_HIGH';
}

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async create(email: string, password: string, displayName: string) {
    const passwordHash = await bcrypt.hash(password, 10);
    return this.prisma.user.create({
      data: { email: email.toLowerCase(), passwordHash, displayName, emailVerified: false },
    });
  }

  async findByEmail(email: string) {
    return this.prisma.user.findUnique({ where: { email: email.toLowerCase() } });
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
        classificationScore: true,
        recommendedLevel: true,
        levelOverrideAcknowledged: true,
        classificationConfidence: true,
        classificationCompletedAt: true,
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
        classificationScore: true,
        recommendedLevel: true,
        levelOverrideAcknowledged: true,
        classificationConfidence: true,
        classificationCompletedAt: true,
      },
    });
  }

  async submitClassification(userId: string, payload: SubmitClassificationDto) {
    const domainScores = Object.entries(DOMAIN_QUESTIONS).reduce((acc, [domain, indices]) => {
      acc[domain as DomainKey] = payload.answers[indices[0]] + payload.answers[indices[1]];
      return acc;
    }, {} as Record<DomainKey, number>);

    const weightedDomainScores = Object.entries(domainScores).reduce((acc, [domain, score]) => {
      acc[domain as DomainKey] = Number((score * DOMAIN_WEIGHTS[domain as DomainKey]).toFixed(2));
      return acc;
    }, {} as Record<DomainKey, number>);

    const totalScore = payload.answers.reduce((sum, value) => sum + value, 0);
    const recommendedLevel = getRecommendedLevel(totalScore);
    const scoredDomains = Object.entries(domainScores)
      .map(([domain, score]) => ({ domain: domain as DomainKey, score }))
      .sort((a, b) => b.score - a.score);

    const strongestDomains = scoredDomains.slice(0, 2).map((entry) => entry.domain);
    const weakestDomain = scoredDomains.at(-1)?.domain ?? 'trainingConsistency';

    const selectedRank = EXPERIENCE_LEVEL_VALUES.indexOf(payload.selectedLevel);
    const recommendedRank = EXPERIENCE_LEVEL_VALUES.indexOf(recommendedLevel);

    let overrideDirection: 'UP' | 'DOWN' | 'NONE' = 'NONE';
    if (selectedRank > recommendedRank) overrideDirection = 'UP';
    if (selectedRank < recommendedRank) overrideDirection = 'DOWN';

    const user = await this.prisma.user.update({
      where: { id: userId },
      data: {
        experienceLevel: payload.selectedLevel,
        recommendedLevel,
        classificationScore: totalScore,
        levelOverrideAcknowledged:
          overrideDirection === 'NONE'
            ? false
            : (payload.levelOverrideAcknowledged ?? false),
        classificationCompletedAt: new Date(),
      },
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
        classificationScore: true,
        recommendedLevel: true,
        levelOverrideAcknowledged: true,
        classificationConfidence: true,
        classificationCompletedAt: true,
      },
    });

    return {
      user,
      classification: {
        totalScore,
        recommendedLevel,
        recommendationBand: getRecommendationBand(totalScore),
        selectedLevel: payload.selectedLevel,
        overrideDirection,
        domainScores,
        weightedDomainScores,
        strongestDomains,
        weakestDomain,
      },
    };
  }

  async setResetToken(userId: string, token: string, expiry: Date) {
  return this.prisma.user.update({
    where: { id: userId },
    data: { passwordResetToken: token, passwordResetTokenExpiry: expiry },
  });
}

async findByResetToken(hashedToken: string) {
  return this.prisma.user.findFirst({
    where: { passwordResetToken: hashedToken },
  });
}

async updatePasswordAndClearToken(userId: string, passwordHash: string) {
  return this.prisma.user.update({
    where: { id: userId },
    data: {
      passwordHash,
      passwordResetToken: null,
      passwordResetTokenExpiry: null,
      refreshTokenHash: null,
      failedLoginAttempts: 0,
      lockedUntil: null,
    },
  });
}

  async setVerificationToken(userId: string, token: string, expiry: Date) {
    return this.prisma.user.update({
      where: { id: userId },
      data: {
        emailVerificationToken: token,
        emailVerificationTokenExpiry: expiry,
      },
    });
  }

  async findByVerificationToken(hashedToken: string) {
    return this.prisma.user.findFirst({
      where: { emailVerificationToken: hashedToken },
    });
  }

  async markEmailVerified(userId: string) {
    return this.prisma.user.update({
      where: { id: userId },
      data: {
        emailVerified: true,
        emailVerificationToken: null,
        emailVerificationTokenExpiry: null,
      },
    });
  }

  async setRefreshTokenHash(userId: string, hash: string) {
    return this.prisma.user.update({
      where: { id: userId },
      data: { refreshTokenHash: hash },
    });
  }

  async clearRefreshTokenHash(userId: string) {
    return this.prisma.user.update({
      where: { id: userId },
      data: { refreshTokenHash: null },
    });
  }

  async recordFailedLogin(userId: string, attempts: number, lockedUntil: Date | null) {
    return this.prisma.user.update({
      where: { id: userId },
      data: {
        failedLoginAttempts: attempts,
        lockedUntil,
      },
    });
  }

  async resetFailedLogin(userId: string) {
    return this.prisma.user.update({
      where: { id: userId },
      data: {
        failedLoginAttempts: 0,
        lockedUntil: null,
      },
    });
  }
}