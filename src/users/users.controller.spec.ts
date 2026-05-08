import { Test, TestingModule } from '@nestjs/testing';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

describe('UsersController', () => {
  let controller: UsersController;
  const mockUsersService = {
    findById: jest.fn(),
    updateOnboarding: jest.fn(),
    submitClassification: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        {
          provide: UsersService,
          useValue: mockUsersService,
        },
      ],
    }).compile();

    controller = module.get<UsersController>(UsersController);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('returns transformed classification payload from service', async () => {
    mockUsersService.submitClassification.mockResolvedValue({
      user: {
        id: 'user-1',
        goalMode: 'MUSCLE_GAIN',
        experienceLevel: 'BEGINNER',
      },
      classification: {
        totalScore: 14,
        recommendedLevel: 'BEGINNER',
        recommendationBand: 'BEGINNER_LEANING_INTERMEDIATE',
        selectedLevel: 'BEGINNER',
        overrideDirection: 'NONE',
        domainScores: {},
        weightedDomainScores: {},
        strongestDomains: ['selfRegulation', 'progressionUnderstanding'],
        weakestDomain: 'recoveryAwareness',
      },
    });

    const result = await controller.submitClassification(
      { user: { userId: 'user-1' } } as any,
      {
        answers: new Array(12).fill(1),
        selectedLevel: 'BEGINNER',
      },
    );

    expect(mockUsersService.submitClassification).toHaveBeenCalledWith(
      'user-1',
      expect.objectContaining({ selectedLevel: 'BEGINNER' }),
    );
    expect(result.classification.recommendedLevel).toBe('BEGINNER');
    expect(result.user.experienceLevelLabel).toBe('Beginner');
  });
});
