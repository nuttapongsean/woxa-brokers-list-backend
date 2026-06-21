import {
  BadRequestException,
  ConflictException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import { createHash } from 'crypto';
import * as bcrypt from 'bcrypt';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { SessionsService } from './sessions.service';

jest.mock('bcrypt', () => ({
  hash: jest.fn().mockResolvedValue('$2b$12$hashed'),
  compare: jest.fn(),
}));

const now = new Date();

const mockUser = {
  id: 'uuid-1',
  fullName: 'John Doe',
  email: 'john@example.com',
  password: '$2b$12$hashed',
  passwordResetTokenHash: null as string | null,
  passwordResetExpiresAt: null as Date | null,
  createdAt: now,
  updatedAt: now,
  deletedAt: null,
};

const mockSession = {
  id: 'session-uuid-1',
  userId: 'uuid-1',
  tokenHash: 'stored-hash',
  deviceInfo: null,
  expiresAt: new Date(Date.now() + 86400000),
  lastUsedAt: now,
  createdAt: now,
};

const mockUsersService = {
  findByEmail: jest.fn(),
  findById: jest.fn(),
  findByResetTokenHash: jest.fn(),
  create: jest.fn(),
  setPasswordResetToken: jest.fn(),
  resetPassword: jest.fn(),
};

const mockSessionsService = {
  create: jest.fn(),
  findById: jest.fn(),
  rotate: jest.fn(),
  deleteById: jest.fn(),
  deleteAllByUserId: jest.fn(),
};

const mockJwtService = {
  sign: jest.fn(),
  verify: jest.fn(),
};

const mockConfigService = {
  get: jest.fn().mockReturnValue({
    secret: 'access-secret',
    accessExpiresIn: '15m',
    refreshSecret: 'refresh-secret',
    refreshExpiresIn: '1d',
  }),
};

describe('AuthService', () => {
  let service: AuthService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useValue: mockUsersService },
        { provide: SessionsService, useValue: mockSessionsService },
        { provide: JwtService, useValue: mockJwtService },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    jest.clearAllMocks();

    mockJwtService.sign
      .mockReturnValueOnce('mock-access-token')
      .mockReturnValueOnce('mock-refresh-token');
  });

  // SHA-256 hash of 'mock-refresh-token'
  const expectedRefreshHash = createHash('sha256')
    .update('mock-refresh-token')
    .digest('hex');

  describe('register', () => {
    it('creates user + session and returns token pair', async () => {
      mockUsersService.findByEmail.mockResolvedValue(null);
      mockUsersService.create.mockResolvedValue(mockUser);
      mockSessionsService.create.mockResolvedValue(mockSession);

      const result = await service.register({
        fullName: 'John Doe',
        email: 'john@example.com',
        password: 'P@ssw0rd!',
        agreeToTerms: true,
      });

      expect(result.accessToken).toBe('mock-access-token');
      expect(result.refreshToken).toBe('mock-refresh-token');
      expect(result.user.email).toBe('john@example.com');
      expect(mockUsersService.create).toHaveBeenCalledWith(
        expect.objectContaining({
          fullName: 'John Doe',
          email: 'john@example.com',
          password: '$2b$12$hashed',
          agreeToTerms: true,
        }),
      );
      expect(mockSessionsService.create).toHaveBeenCalledWith(
        expect.objectContaining({ tokenHash: expectedRefreshHash }),
      );
    });

    it('throws ConflictException when email already exists', async () => {
      mockUsersService.findByEmail.mockResolvedValue(mockUser);

      await expect(
        service.register({
          fullName: 'John Doe',
          email: 'john@example.com',
          password: 'P@ssw0rd!',
          agreeToTerms: true,
        }),
      ).rejects.toThrow(ConflictException);

      expect(mockUsersService.create).not.toHaveBeenCalled();
    });
  });

  describe('login', () => {
    it('returns token pair and creates session with valid credentials', async () => {
      mockUsersService.findByEmail.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      mockSessionsService.create.mockResolvedValue(mockSession);

      const result = await service.login({
        email: 'john@example.com',
        password: 'P@ssw0rd!',
      });

      expect(result.accessToken).toBe('mock-access-token');
      expect(result.user.id).toBe('uuid-1');
      expect(mockSessionsService.create).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'uuid-1',
          tokenHash: expectedRefreshHash,
        }),
      );
    });

    it('throws UnauthorizedException when user not found', async () => {
      mockUsersService.findByEmail.mockResolvedValue(null);

      await expect(
        service.login({ email: 'nobody@example.com', password: 'P@ssw0rd!' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('throws UnauthorizedException when password is wrong', async () => {
      mockUsersService.findByEmail.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(
        service.login({ email: 'john@example.com', password: 'wrong' }),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('logout', () => {
    it('deletes the session by sessionId', async () => {
      mockSessionsService.deleteById.mockResolvedValue(undefined);

      await service.logout('session-uuid-1');

      expect(mockSessionsService.deleteById).toHaveBeenCalledWith(
        'session-uuid-1',
      );
    });
  });

  describe('refresh', () => {
    it('returns new token pair and rotates the session', async () => {
      const incomingToken = 'incoming-refresh-token';
      const incomingHash = createHash('sha256')
        .update(incomingToken)
        .digest('hex');

      mockJwtService.verify.mockReturnValue({
        sub: 'uuid-1',
        sid: 'session-uuid-1',
      });
      mockSessionsService.findById.mockResolvedValue({
        ...mockSession,
        tokenHash: incomingHash,
      });
      mockUsersService.findById.mockResolvedValue(mockUser);
      mockSessionsService.rotate.mockResolvedValue(undefined);

      const result = await service.refresh({ refreshToken: incomingToken });

      expect(result.accessToken).toBe('mock-access-token');
      expect(mockSessionsService.rotate).toHaveBeenCalledWith(
        'session-uuid-1',
        expectedRefreshHash,
      );
    });

    it('throws UnauthorizedException when JWT verification fails', async () => {
      mockJwtService.verify.mockImplementation(() => {
        throw new Error('jwt expired');
      });

      await expect(
        service.refresh({ refreshToken: 'bad-token' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('throws UnauthorizedException when session not found', async () => {
      mockJwtService.verify.mockReturnValue({
        sub: 'uuid-1',
        sid: 'session-uuid-1',
      });
      mockSessionsService.findById.mockResolvedValue(null);

      await expect(
        service.refresh({ refreshToken: 'some-token' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('deletes session and throws on token reuse (hash mismatch)', async () => {
      mockJwtService.verify.mockReturnValue({
        sub: 'uuid-1',
        sid: 'session-uuid-1',
      });
      mockSessionsService.findById.mockResolvedValue({
        ...mockSession,
        tokenHash: 'hash-that-does-not-match',
      });
      mockSessionsService.deleteById.mockResolvedValue(undefined);

      await expect(
        service.refresh({ refreshToken: 'reused-token' }),
      ).rejects.toThrow(UnauthorizedException);

      expect(mockSessionsService.deleteById).toHaveBeenCalledWith(
        'session-uuid-1',
      );
    });
  });

  describe('forgotPassword', () => {
    it('returns silently when email does not exist (no enumeration)', async () => {
      mockUsersService.findByEmail.mockResolvedValue(null);

      await expect(
        service.forgotPassword({ email: 'nobody@example.com' }),
      ).resolves.toBeUndefined();

      expect(mockUsersService.setPasswordResetToken).not.toHaveBeenCalled();
    });

    it('sets a reset token when email exists', async () => {
      mockUsersService.findByEmail.mockResolvedValue(mockUser);
      mockUsersService.setPasswordResetToken.mockResolvedValue(undefined);

      await service.forgotPassword({ email: 'john@example.com' });

      expect(mockUsersService.setPasswordResetToken).toHaveBeenCalledWith(
        'uuid-1',
        expect.any(String),
        expect.any(Date),
      );
    });
  });

  describe('resetPassword', () => {
    it('throws BadRequestException when passwords do not match', async () => {
      await expect(
        service.resetPassword({
          token: 'tok',
          newPassword: 'NewP@ss1',
          confirmPassword: 'Different1',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('throws BadRequestException when token is not found', async () => {
      mockUsersService.findByResetTokenHash.mockResolvedValue(null);

      await expect(
        service.resetPassword({
          token: 'unknown-token',
          newPassword: 'NewP@ss1',
          confirmPassword: 'NewP@ss1',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('throws BadRequestException when token is expired', async () => {
      mockUsersService.findByResetTokenHash.mockResolvedValue({
        ...mockUser,
        passwordResetExpiresAt: new Date(Date.now() - 1000),
      });

      await expect(
        service.resetPassword({
          token: 'expired-token',
          newPassword: 'NewP@ss1',
          confirmPassword: 'NewP@ss1',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('resets password and invalidates all sessions', async () => {
      mockUsersService.findByResetTokenHash.mockResolvedValue({
        ...mockUser,
        passwordResetExpiresAt: new Date(Date.now() + 60_000),
      });
      mockUsersService.resetPassword.mockResolvedValue(undefined);
      mockSessionsService.deleteAllByUserId.mockResolvedValue(undefined);

      await service.resetPassword({
        token: 'valid-token',
        newPassword: 'NewP@ss1',
        confirmPassword: 'NewP@ss1',
      });

      expect(mockUsersService.resetPassword).toHaveBeenCalledWith(
        'uuid-1',
        '$2b$12$hashed',
      );
      expect(mockSessionsService.deleteAllByUserId).toHaveBeenCalledWith(
        'uuid-1',
      );
    });
  });
});
