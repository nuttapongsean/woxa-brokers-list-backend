import {
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ReviewsService } from './reviews.service';
import { Review } from './entities/review.entity';

const now = new Date();

const mockReview: Review = {
  id: 'review-1',
  rating: 4,
  comment: 'Great broker with tight spreads.',
  userId: 'user-1',
  brokerId: 'broker-1',
  user: {} as any,
  broker: {} as any,
  createdAt: now,
  updatedAt: now,
  deletedAt: null,
};

const mockQueryBuilder = {
  leftJoin: jest.fn().mockReturnThis(),
  addSelect: jest.fn().mockReturnThis(),
  where: jest.fn().mockReturnThis(),
  andWhere: jest.fn().mockReturnThis(),
  orderBy: jest.fn().mockReturnThis(),
  getMany: jest.fn(),
  getOne: jest.fn(),
};

const mockRepo = {
  findOne: jest.fn(),
  save: jest.fn(),
  update: jest.fn(),
  softDelete: jest.fn(),
  createQueryBuilder: jest.fn().mockReturnValue(mockQueryBuilder),
};

describe('ReviewsService', () => {
  let service: ReviewsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReviewsService,
        { provide: getRepositoryToken(Review), useValue: mockRepo },
      ],
    }).compile();

    service = module.get<ReviewsService>(ReviewsService);
    jest.clearAllMocks();
    mockRepo.createQueryBuilder.mockReturnValue(mockQueryBuilder);
  });

  describe('create', () => {
    it('saves and returns the new review', async () => {
      mockRepo.findOne.mockResolvedValue(null);
      mockRepo.save.mockResolvedValue(mockReview);

      const result = await service.create('user-1', {
        brokerId: 'broker-1',
        rating: 4,
        comment: 'Great broker with tight spreads.',
      });

      expect(result).toEqual(mockReview);
      expect(mockRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({ userId: 'user-1', brokerId: 'broker-1', rating: 4 }),
      );
    });

    it('saves with null comment when omitted', async () => {
      mockRepo.findOne.mockResolvedValue(null);
      mockRepo.save.mockResolvedValue({ ...mockReview, comment: null });

      await service.create('user-1', { brokerId: 'broker-1', rating: 3 });

      expect(mockRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({ comment: null }),
      );
    });

    it('throws ConflictException when user already reviewed this broker', async () => {
      mockRepo.findOne.mockResolvedValue(mockReview);

      await expect(
        service.create('user-1', { brokerId: 'broker-1', rating: 4 }),
      ).rejects.toThrow(ConflictException);
    });

    it('throws ConflictException on DB unique constraint (race condition)', async () => {
      mockRepo.findOne.mockResolvedValue(null);
      mockRepo.save.mockRejectedValue({ code: '23505' });

      await expect(
        service.create('user-1', { brokerId: 'broker-1', rating: 4 }),
      ).rejects.toThrow(ConflictException);
    });

    it('rethrows unknown errors from save', async () => {
      mockRepo.findOne.mockResolvedValue(null);
      mockRepo.save.mockRejectedValue(new Error('db connection lost'));

      await expect(
        service.create('user-1', { brokerId: 'broker-1', rating: 4 }),
      ).rejects.toThrow('db connection lost');
    });
  });

  describe('findByBroker', () => {
    it('returns reviews with user info via QueryBuilder', async () => {
      mockQueryBuilder.getMany.mockResolvedValue([mockReview]);

      const result = await service.findByBroker('broker-1');

      expect(result).toEqual([mockReview]);
      expect(mockQueryBuilder.where).toHaveBeenCalledWith(
        'review.brokerId = :brokerId',
        { brokerId: 'broker-1' },
      );
      expect(mockQueryBuilder.addSelect).toHaveBeenCalledWith([
        'user.id',
        'user.fullName',
      ]);
    });
  });

  describe('findOne', () => {
    it('returns review with user and broker via QueryBuilder', async () => {
      mockQueryBuilder.getOne.mockResolvedValue(mockReview);

      const result = await service.findOne('review-1');

      expect(result).toEqual(mockReview);
      expect(mockQueryBuilder.where).toHaveBeenCalledWith(
        'review.id = :id',
        { id: 'review-1' },
      );
    });

    it('throws NotFoundException when review does not exist', async () => {
      mockQueryBuilder.getOne.mockResolvedValue(null);

      await expect(service.findOne('bad-id')).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('updates rating and comment, returns updated review', async () => {
      const updated = { ...mockReview, rating: 5 };
      mockRepo.findOne.mockResolvedValue(mockReview); // findForOwnership
      mockRepo.update.mockResolvedValue(undefined);
      mockQueryBuilder.getOne.mockResolvedValue(updated); // findOne after update

      const result = await service.update('review-1', 'user-1', { rating: 5 });

      expect(mockRepo.update).toHaveBeenCalledWith({ id: 'review-1' }, { rating: 5 });
      expect(result.rating).toBe(5);
    });

    it('throws NotFoundException when review does not exist', async () => {
      mockRepo.findOne.mockResolvedValue(null);

      await expect(
        service.update('bad-id', 'user-1', { rating: 5 }),
      ).rejects.toThrow(NotFoundException);
    });

    it('throws ForbiddenException when user is not the owner', async () => {
      mockRepo.findOne.mockResolvedValue(mockReview); // owned by 'user-1'

      await expect(
        service.update('review-1', 'other-user', { rating: 5 }),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('remove', () => {
    it('soft-deletes the review', async () => {
      mockRepo.findOne.mockResolvedValue(mockReview);
      mockRepo.softDelete.mockResolvedValue(undefined);

      await service.remove('review-1', 'user-1');

      expect(mockRepo.softDelete).toHaveBeenCalledWith({ id: 'review-1' });
    });

    it('throws NotFoundException when review does not exist', async () => {
      mockRepo.findOne.mockResolvedValue(null);

      await expect(service.remove('bad-id', 'user-1')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('throws ForbiddenException when user is not the owner', async () => {
      mockRepo.findOne.mockResolvedValue(mockReview); // owned by 'user-1'

      await expect(service.remove('review-1', 'other-user')).rejects.toThrow(
        ForbiddenException,
      );
    });
  });
});
