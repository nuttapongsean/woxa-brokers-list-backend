import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { UsersService } from './users.service';
import { User } from './entities/user.entity';

const now = new Date();

const mockUser: User = {
  id: 'uuid-1',
  fullName: 'John Doe',
  email: 'john@example.com',
  password: '$2b$12$hashed',
  refreshTokenHash: null,
  passwordResetTokenHash: null,
  passwordResetExpiresAt: null,
  createdAt: now,
  updatedAt: now,
  deletedAt: null,
};

const mockRepo = {
  findOne: jest.fn(),
  save: jest.fn(),
  update: jest.fn(),
  softDelete: jest.fn(),
};

describe('UsersService', () => {
  let service: UsersService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: getRepositoryToken(User), useValue: mockRepo },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    jest.clearAllMocks();
  });

  describe('findByEmail', () => {
    it('returns user when found', async () => {
      mockRepo.findOne.mockResolvedValue(mockUser);
      const result = await service.findByEmail('john@example.com');
      expect(result).toEqual(mockUser);
      expect(mockRepo.findOne).toHaveBeenCalledWith({
        where: { email: 'john@example.com' },
        withDeleted: false,
      });
    });

    it('returns null when not found', async () => {
      mockRepo.findOne.mockResolvedValue(null);
      const result = await service.findByEmail('nobody@example.com');
      expect(result).toBeNull();
    });

    it('passes withDeleted=true when specified', async () => {
      mockRepo.findOne.mockResolvedValue(mockUser);
      await service.findByEmail('john@example.com', true);
      expect(mockRepo.findOne).toHaveBeenCalledWith({
        where: { email: 'john@example.com' },
        withDeleted: true,
      });
    });
  });

  describe('findById', () => {
    it('returns user when found', async () => {
      mockRepo.findOne.mockResolvedValue(mockUser);
      const result = await service.findById('uuid-1');
      expect(result).toEqual(mockUser);
    });

    it('returns null when not found', async () => {
      mockRepo.findOne.mockResolvedValue(null);
      expect(await service.findById('bad-id')).toBeNull();
    });
  });

  describe('create', () => {
    it('saves user with null reset token fields', async () => {
      mockRepo.save.mockResolvedValue(mockUser);

      await service.create({
        id: 'uuid-1',
        fullName: 'John Doe',
        email: 'john@example.com',
        password: '$2b$12$hashed',
        refreshTokenHash: 'hash',
      });

      expect(mockRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({
          passwordResetTokenHash: null,
          passwordResetExpiresAt: null,
        }),
      );
    });
  });

  describe('updateRefreshToken', () => {
    it('updates refreshTokenHash to given hash', async () => {
      mockRepo.update.mockResolvedValue(undefined);
      await service.updateRefreshToken('uuid-1', 'new-hash');
      expect(mockRepo.update).toHaveBeenCalledWith(
        { id: 'uuid-1' },
        { refreshTokenHash: 'new-hash' },
      );
    });

    it('clears refreshTokenHash when null is passed', async () => {
      mockRepo.update.mockResolvedValue(undefined);
      await service.updateRefreshToken('uuid-1', null);
      expect(mockRepo.update).toHaveBeenCalledWith(
        { id: 'uuid-1' },
        { refreshTokenHash: null },
      );
    });
  });

  describe('getProfile', () => {
    it('returns profile dto without sensitive fields', async () => {
      mockRepo.findOne.mockResolvedValue(mockUser);
      const result = await service.getProfile('uuid-1');

      expect(result).toEqual({
        id: mockUser.id,
        fullName: mockUser.fullName,
        email: mockUser.email,
        createdAt: mockUser.createdAt,
        updatedAt: mockUser.updatedAt,
      });
      expect(result).not.toHaveProperty('password');
      expect(result).not.toHaveProperty('refreshTokenHash');
    });

    it('throws NotFoundException when user not found', async () => {
      mockRepo.findOne.mockResolvedValue(null);
      await expect(service.getProfile('bad-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('updateProfile', () => {
    it('updates fullName and returns new profile', async () => {
      const updated = { ...mockUser, fullName: 'Jane Doe' };
      mockRepo.update.mockResolvedValue(undefined);
      mockRepo.findOne.mockResolvedValue(updated);

      const result = await service.updateProfile('uuid-1', {
        fullName: 'Jane Doe',
      });

      expect(mockRepo.update).toHaveBeenCalledWith(
        { id: 'uuid-1' },
        { fullName: 'Jane Doe' },
      );
      expect(result.fullName).toBe('Jane Doe');
    });
  });

  describe('softDelete', () => {
    it('clears refresh token then soft-deletes', async () => {
      mockRepo.update.mockResolvedValue(undefined);
      mockRepo.softDelete.mockResolvedValue(undefined);

      await service.softDelete('uuid-1');

      expect(mockRepo.update).toHaveBeenCalledWith(
        { id: 'uuid-1' },
        { refreshTokenHash: null },
      );
      expect(mockRepo.softDelete).toHaveBeenCalledWith({ id: 'uuid-1' });
    });
  });

  describe('resetPassword', () => {
    it('updates password and clears all token fields', async () => {
      mockRepo.update.mockResolvedValue(undefined);

      await service.resetPassword('uuid-1', '$2b$12$new-hash');

      expect(mockRepo.update).toHaveBeenCalledWith(
        { id: 'uuid-1' },
        {
          password: '$2b$12$new-hash',
          refreshTokenHash: null,
          passwordResetTokenHash: null,
          passwordResetExpiresAt: null,
        },
      );
    });
  });
});
