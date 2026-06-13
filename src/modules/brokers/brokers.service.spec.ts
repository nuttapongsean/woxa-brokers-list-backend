import { ConflictException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BrokersService } from './brokers.service';
import { Broker, BrokerType } from './entities/broker.entity';

const mockBroker: Broker = {
  id: 'uuid-1',
  name: 'Exness',
  slug: 'exness',
  description: 'A leading multi-asset broker with tight spreads.',
  logoUrl: 'https://cdn.example.com/exness.png',
  website: 'https://www.exness.com',
  brokerType: BrokerType.CFD,
  createdAt: new Date(),
  updatedAt: new Date(),
  deletedAt: null,
};

const mockRepo = {
  findOne: jest.fn(),
  findAndCount: jest.fn(),
  save: jest.fn(),
  update: jest.fn(),
  softDelete: jest.fn(),
};

describe('BrokersService', () => {
  let service: BrokersService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BrokersService,
        { provide: getRepositoryToken(Broker), useValue: mockRepo },
      ],
    }).compile();

    service = module.get<BrokersService>(BrokersService);
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('auto-generates slug from name when omitted', async () => {
      mockRepo.findOne.mockResolvedValue(null);
      mockRepo.save.mockResolvedValue({ ...mockBroker, slug: 'exness' });

      const result = await service.create({
        name: 'Exness',
        description: 'A leading multi-asset broker with tight spreads.',
        logoUrl: 'https://cdn.example.com/exness.png',
        website: 'https://www.exness.com',
        brokerType: BrokerType.CFD,
      });

      expect(result.slug).toBe('exness');
      expect(mockRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({ slug: 'exness' }),
      );
    });

    it('throws ConflictException when slug is taken', async () => {
      mockRepo.findOne.mockResolvedValue(mockBroker);

      await expect(
        service.create({
          name: 'Exness',
          description: 'A leading multi-asset broker.',
          logoUrl: 'https://cdn.example.com/exness.png',
          website: 'https://www.exness.com',
          brokerType: BrokerType.CFD,
        }),
      ).rejects.toThrow(ConflictException);
    });

    it('throws ConflictException when DB unique constraint fires (race condition)', async () => {
      mockRepo.findOne.mockResolvedValue(null);
      mockRepo.save.mockRejectedValue({ code: '23505' });

      await expect(
        service.create({
          name: 'Exness',
          description: 'A leading multi-asset broker with tight spreads.',
          logoUrl: 'https://cdn.example.com/exness.png',
          website: 'https://www.exness.com',
          brokerType: BrokerType.CFD,
        }),
      ).rejects.toThrow(ConflictException);
    });

    it('rethrows unknown errors from save', async () => {
      mockRepo.findOne.mockResolvedValue(null);
      mockRepo.save.mockRejectedValue(new Error('db connection lost'));

      await expect(
        service.create({
          name: 'Exness',
          description: 'A leading multi-asset broker with tight spreads.',
          logoUrl: 'https://cdn.example.com/exness.png',
          website: 'https://www.exness.com',
          brokerType: BrokerType.CFD,
        }),
      ).rejects.toThrow('db connection lost');
    });
  });

  describe('findAll', () => {
    it('returns paginated result', async () => {
      mockRepo.findAndCount.mockResolvedValue([[mockBroker], 1]);

      const result = await service.findAll({ page: 1, limit: 10 });

      expect(result.data).toHaveLength(1);
      expect(result.total).toBe(1);
      expect(result.totalPages).toBe(1);
    });

    it('filters by brokerType when provided', async () => {
      mockRepo.findAndCount.mockResolvedValue([[mockBroker], 1]);

      await service.findAll({ brokerType: BrokerType.CFD, page: 1, limit: 10 });

      expect(mockRepo.findAndCount).toHaveBeenCalledWith(
        expect.objectContaining({ where: { brokerType: BrokerType.CFD } }),
      );
    });
  });

  describe('findOne', () => {
    it('returns a broker by id', async () => {
      mockRepo.findOne.mockResolvedValue(mockBroker);
      const result = await service.findOne('uuid-1');
      expect(result).toEqual(mockBroker);
    });

    it('throws NotFoundException when broker does not exist', async () => {
      mockRepo.findOne.mockResolvedValue(null);
      await expect(service.findOne('bad-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('update', () => {
    it('throws NotFoundException when broker does not exist', async () => {
      mockRepo.findOne.mockResolvedValue(null);

      await expect(service.update('bad-id', { name: 'X' })).rejects.toThrow(
        NotFoundException,
      );
    });

    it('throws ConflictException when new slug is already taken', async () => {
      const otherBroker = { ...mockBroker, id: 'uuid-2', slug: 'icmarkets' };
      mockRepo.findOne
        .mockResolvedValueOnce(mockBroker) // findOne(id)
        .mockResolvedValueOnce(otherBroker); // slug conflict check

      await expect(
        service.update('uuid-1', { slug: 'icmarkets' }),
      ).rejects.toThrow(ConflictException);
    });

    it('skips slug conflict check when slug is unchanged', async () => {
      mockRepo.findOne
        .mockResolvedValueOnce(mockBroker) // findOne(id)
        .mockResolvedValueOnce(mockBroker); // findOne after update
      mockRepo.update.mockResolvedValue(undefined);

      await service.update('uuid-1', { slug: 'exness' });

      expect(mockRepo.findOne).toHaveBeenCalledTimes(2);
    });

    it('throws ConflictException when DB unique constraint fires during update (race condition)', async () => {
      mockRepo.findOne
        .mockResolvedValueOnce(mockBroker) // findOne(id)
        .mockResolvedValueOnce(null); // slug pre-check passes
      mockRepo.update.mockRejectedValue({ code: '23505' });

      await expect(
        service.update('uuid-1', { slug: 'new-slug' }),
      ).rejects.toThrow(ConflictException);
    });

    it('rethrows unknown errors from update', async () => {
      mockRepo.findOne.mockResolvedValueOnce(mockBroker);
      mockRepo.update.mockRejectedValue(new Error('db connection lost'));

      await expect(service.update('uuid-1', { name: 'X' })).rejects.toThrow(
        'db connection lost',
      );
    });

    it('returns the updated broker', async () => {
      const updated = { ...mockBroker, name: 'Exness Pro' };
      mockRepo.findOne
        .mockResolvedValueOnce(mockBroker) // findOne(id)
        .mockResolvedValueOnce(updated); // findOne after update
      mockRepo.update.mockResolvedValue(undefined);

      const result = await service.update('uuid-1', { name: 'Exness Pro' });

      expect(result.name).toBe('Exness Pro');
      expect(mockRepo.update).toHaveBeenCalledWith(
        { id: 'uuid-1' },
        { name: 'Exness Pro' },
      );
    });
  });

  describe('remove', () => {
    it('soft-deletes the broker', async () => {
      mockRepo.findOne.mockResolvedValue(mockBroker);
      mockRepo.softDelete.mockResolvedValue(undefined);

      await service.remove('uuid-1');

      expect(mockRepo.softDelete).toHaveBeenCalledWith({ id: 'uuid-1' });
    });
  });
});
