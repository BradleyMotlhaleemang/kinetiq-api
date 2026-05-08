import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './users.service';
import { PrismaService } from '../prisma/prisma.service';
import { SubmitClassificationDto } from './dto/submit-classification.dto';

describe('UsersService', () => {
  let service: UsersService;
  const mockPrisma = {
    user: {
      update: jest.fn(),
    },
  };

  const baseUser = {
    id: 'user-1',
    email: 'user@example.com',
    displayName: 'Test User',
    experienceLevel: 'INTERMEDIATE',
    trainingAgeMths: 24,
    bodyweightKg: 80,
    goalMode: 'MUSCLE_GAIN',
    gender: 'MALE',
    notificationsEnabled: true,
    preferredTrainingTime: 'MORNING',
    onboardingCompletedAt: new Date('2026-01-01'),
    classificationScore: null,
    recommendedLevel: null,
    levelOverrideAcknowledged: false,
    classificationConfidence: null,
    classificationCompletedAt: null,
  };

  function buildPayload(
    answers: number[],
    selectedLevel: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED' = 'INTERMEDIATE',
    acknowledged?: boolean,
  ): SubmitClassificationDto {
    return {
      answers,
      selectedLevel,
      levelOverrideAcknowledged: acknowledged,
    };
  }

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: PrismaService,
          useValue: mockPrisma,
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('classifies BEGINNER_HIGH for very low score', async () => {
    mockPrisma.user.update.mockResolvedValue({
      ...baseUser,
      experienceLevel: 'BEGINNER',
      recommendedLevel: 'BEGINNER',
      classificationScore: 0,
    });

    const result = await service.submitClassification(
      'user-1',
      buildPayload(new Array(12).fill(0), 'BEGINNER'),
    );

    expect(result.classification.totalScore).toBe(0);
    expect(result.classification.recommendedLevel).toBe('BEGINNER');
    expect(result.classification.recommendationBand).toBe('BEGINNER_HIGH');
    expect(result.classification.overrideDirection).toBe('NONE');
  });

  it('maps score 16 to BEGINNER_LEANING_INTERMEDIATE', async () => {
    const answers = [1, 1, 2, 1, 1, 1, 2, 1, 2, 1, 2, 1]; // total 16
    mockPrisma.user.update.mockResolvedValue({
      ...baseUser,
      recommendedLevel: 'BEGINNER',
      classificationScore: 16,
    });

    const result = await service.submitClassification(
      'user-1',
      buildPayload(answers, 'BEGINNER'),
    );

    expect(result.classification.totalScore).toBe(16);
    expect(result.classification.recommendationBand).toBe('BEGINNER_LEANING_INTERMEDIATE');
    expect(result.classification.recommendedLevel).toBe('BEGINNER');
  });

  it('maps score 22 to INTERMEDIATE_HIGH', async () => {
    const answers = [2, 1, 2, 2, 1, 2, 2, 2, 2, 2, 2, 2]; // total 22
    mockPrisma.user.update.mockResolvedValue({
      ...baseUser,
      recommendedLevel: 'INTERMEDIATE',
      classificationScore: 22,
    });

    const result = await service.submitClassification(
      'user-1',
      buildPayload(answers, 'INTERMEDIATE'),
    );

    expect(result.classification.totalScore).toBe(22);
    expect(result.classification.recommendationBand).toBe('INTERMEDIATE_HIGH');
    expect(result.classification.recommendedLevel).toBe('INTERMEDIATE');
  });

  it('maps score 27 to INTERMEDIATE_LEANING_ADVANCED', async () => {
    const answers = [2, 2, 3, 2, 2, 2, 2, 2, 2, 2, 3, 3]; // total 27
    mockPrisma.user.update.mockResolvedValue({
      ...baseUser,
      recommendedLevel: 'INTERMEDIATE',
      classificationScore: 27,
    });

    const result = await service.submitClassification(
      'user-1',
      buildPayload(answers, 'INTERMEDIATE'),
    );

    expect(result.classification.totalScore).toBe(27);
    expect(result.classification.recommendationBand).toBe('INTERMEDIATE_LEANING_ADVANCED');
    expect(result.classification.recommendedLevel).toBe('INTERMEDIATE');
  });

  it('maps score 36 to ADVANCED_HIGH', async () => {
    mockPrisma.user.update.mockResolvedValue({
      ...baseUser,
      experienceLevel: 'ADVANCED',
      recommendedLevel: 'ADVANCED',
      classificationScore: 36,
    });

    const result = await service.submitClassification(
      'user-1',
      buildPayload(new Array(12).fill(3), 'ADVANCED'),
    );

    expect(result.classification.totalScore).toBe(36);
    expect(result.classification.recommendationBand).toBe('ADVANCED_HIGH');
    expect(result.classification.recommendedLevel).toBe('ADVANCED');
  });

  it('flags upward override and persists acknowledgment', async () => {
    const answers = [1, 1, 2, 1, 1, 1, 2, 1, 2, 1, 2, 1]; // total 16 => BEGINNER
    mockPrisma.user.update.mockResolvedValue({
      ...baseUser,
      experienceLevel: 'ADVANCED',
      recommendedLevel: 'BEGINNER',
      classificationScore: 16,
      levelOverrideAcknowledged: true,
    });

    const result = await service.submitClassification(
      'user-1',
      buildPayload(answers, 'ADVANCED', true),
    );

    expect(result.classification.overrideDirection).toBe('UP');
    expect(mockPrisma.user.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          levelOverrideAcknowledged: true,
          experienceLevel: 'ADVANCED',
          recommendedLevel: 'BEGINNER',
        }),
      }),
    );
  });

  it('flags downward override and does not auto-acknowledge', async () => {
    const answers = new Array(12).fill(3); // total 36 => ADVANCED
    mockPrisma.user.update.mockResolvedValue({
      ...baseUser,
      experienceLevel: 'BEGINNER',
      recommendedLevel: 'ADVANCED',
      classificationScore: 36,
      levelOverrideAcknowledged: false,
    });

    const result = await service.submitClassification(
      'user-1',
      buildPayload(answers, 'BEGINNER'),
    );

    expect(result.classification.overrideDirection).toBe('DOWN');
    expect(mockPrisma.user.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          levelOverrideAcknowledged: false,
        }),
      }),
    );
  });

  it('returns strongestDomains and weakestDomain deterministically', async () => {
    const answers = [3, 3, 3, 3, 0, 0, 2, 1, 1, 1, 3, 3];
    mockPrisma.user.update.mockResolvedValue({
      ...baseUser,
      recommendedLevel: 'INTERMEDIATE',
      classificationScore: answers.reduce((a, b) => a + b, 0),
    });

    const result = await service.submitClassification(
      'user-1',
      buildPayload(answers, 'INTERMEDIATE'),
    );

    expect(result.classification.strongestDomains).toEqual([
      'trainingConsistency',
      'progressionUnderstanding',
    ]);
    expect(result.classification.weakestDomain).toBe('recoveryAwareness');
  });
});
