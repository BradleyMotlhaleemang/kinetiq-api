import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

describe('AuthController', () => {
  let controller: AuthController;
  const mockAuthService = {
    register: jest.fn(),
    login: jest.fn(),
    refresh: jest.fn(),
    logout: jest.fn(),
    forgotPassword: jest.fn(),
    resetPassword: jest.fn(),
    verifyEmail: jest.fn(),
    resendVerification: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('delegates register to AuthService with audit context', async () => {
    mockAuthService.register.mockResolvedValue({ message: 'ok' });
    const req = { ip: '127.0.0.1', headers: {}, socket: {} } as any;

    await controller.register(
      { email: 'a@b.com', password: 'Pass123!', displayName: 'Test' },
      req,
    );

    expect(mockAuthService.register).toHaveBeenCalledWith(
      'a@b.com',
      'Pass123!',
      'Test',
      expect.objectContaining({ ipAddress: '127.0.0.1' }),
    );
  });

  it('delegates login to AuthService with audit context and response', async () => {
    mockAuthService.login.mockResolvedValue({ accessToken: 'token' });
    const req = { ip: '127.0.0.1', headers: {}, socket: {} } as any;
    const res = {} as any;

    await controller.login({ email: 'a@b.com', password: 'Pass123!' }, req, res);

    expect(mockAuthService.login).toHaveBeenCalledWith(
      'a@b.com',
      'Pass123!',
      expect.objectContaining({ ipAddress: '127.0.0.1' }),
      res,
    );
  });
});
