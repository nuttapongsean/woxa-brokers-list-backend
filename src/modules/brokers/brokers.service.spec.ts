import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { BrokersService } from './brokers.service';
import { Broker, BrokerType } from './entities/broker.entity';
import { StorageService } from '../../shared/storage/storage.service';
import type { UploadedFile } from '../../shared/storage/types';

const mockBroker: Broker = {
  id: 'uuid-1',
  name: 'Exness',
  slug: 'exness',
  description: 'A leading multi-asset broker with deep liquidity.',
  logoUrl: 'https://cdn.cloudinary.com/logo.jpg',
  imageUrl: 'https://cdn.cloudinary.com/cover.jpg',
  website: 'https://www.exness.com',
  brokerType: BrokerType.CFD,
  longDescription: 'Exness is a global multi-asset broker...',
  contactAddress: '123 Finance Street',
  contactEmail: 'support@exness.com',
  features: [],
  createdAt: new Date(),
  updatedAt: new Date(),
  deletedAt: null,
};

const makeFile = (name: string): UploadedFile => ({
  fieldname: name,
  originalname: `${name}.png`,
  encoding: '7bit',
  mimetype: 'image/png',
  size: 1024,
  buffer: Buffer.from(name),
});

const validDto = {
  name: 'Exness',
  brokerType: BrokerType.CFD,
  description: 'A leading multi-asset broker with deep liquidity.',
  longDescription: 'Exness is a global multi-asset broker...',
  website: 'https://www.exness.com',
  contactAddress: '123 Finance Street',
  contactEmail: 'support@exness.com',
};

const validFiles = {
  logo: [makeFile('logo')],
  coverImage: [makeFile('cover')],
};

const mockQueryBuilder = {
  leftJoinAndSelect: jest.fn().mockReturnThis(),
  where: jest.fn().mockReturnThis(),
  orderBy: jest.fn().mockReturnThis(),
  select: jest.fn().mockReturnThis(),
  getOne: jest.fn(),
  getRawMany: jest.fn(),
};

const mockManager = {
  save: jest.fn(),
  delete: jest.fn(),
  update: jest.fn(),
};

const mockRepo = {
  findOne: jest.fn(),
  findAndCount: jest.fn(),
  softDelete: jest.fn(),
  createQueryBuilder: jest.fn().mockReturnValue(mockQueryBuilder),
};

const mockDataSource = {
  transaction: jest.fn((cb: (manager: typeof mockManager) => Promise<void>) =>
    cb(mockManager),
  ),
};

const mockStorageService = {
  uploadImage: jest
    .fn()
    .mockResolvedValue('https://cdn.cloudinary.com/image.jpg'),
  uploadFile: jest
    .fn()
    .mockResolvedValue('https://cdn.cloudinary.com/file.pdf'),
};

describe('BrokersService', () => {
  let service: BrokersService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BrokersService,
        { provide: getRepositoryToken(Broker), useValue: mockRepo },
        { provide: DataSource, useValue: mockDataSource },
        { provide: StorageService, useValue: mockStorageService },
      ],
    }).compile();

    service = module.get<BrokersService>(BrokersService);
    jest.clearAllMocks();
    mockRepo.createQueryBuilder.mockReturnValue(mockQueryBuilder);
    mockStorageService.uploadImage.mockResolvedValue(
      'https://cdn.cloudinary.com/image.jpg',
    );
    mockDataSource.transaction.mockImplementation(
      (cb: (manager: typeof mockManager) => Promise<void>) => cb(mockManager),
    );
  });

  describe('create', () => {
    it('throws BadRequestException when logo is missing', async () => {
      await expect(
        service.create(validDto, {}, { coverImage: validFiles.coverImage }),
      ).rejects.toThrow(BadRequestException);
    });

    it('throws BadRequestException when coverImage is missing', async () => {
      await expect(
        service.create(validDto, {}, { logo: validFiles.logo }),
      ).rejects.toThrow(BadRequestException);
    });

    it('throws ConflictException when slug is already taken', async () => {
      mockRepo.findOne.mockResolvedValue(mockBroker);

      await expect(service.create(validDto, {}, validFiles)).rejects.toThrow(
        ConflictException,
      );
    });

    it('auto-generates slug from name when omitted', async () => {
      mockRepo.findOne.mockResolvedValue(null);
      mockQueryBuilder.getOne.mockResolvedValue(mockBroker);

      await service.create(validDto, {}, validFiles);

      expect(mockManager.save).toHaveBeenCalledWith(
        Broker,
        expect.objectContaining({ slug: 'exness' }),
      );
    });

    it('uses provided slug when given', async () => {
      mockRepo.findOne.mockResolvedValue(null);
      mockQueryBuilder.getOne.mockResolvedValue(mockBroker);

      await service.create(
        { ...validDto, slug: 'custom-slug' },
        {},
        validFiles,
      );

      expect(mockManager.save).toHaveBeenCalledWith(
        Broker,
        expect.objectContaining({ slug: 'custom-slug' }),
      );
    });

    it('uploads logo and coverImage via StorageService', async () => {
      mockRepo.findOne.mockResolvedValue(null);
      mockQueryBuilder.getOne.mockResolvedValue(mockBroker);

      await service.create(validDto, {}, validFiles);

      expect(mockStorageService.uploadImage).toHaveBeenCalledTimes(2);
    });

    it('saves metrics from flat rawBody fields', async () => {
      mockRepo.findOne.mockResolvedValue(null);
      mockQueryBuilder.getOne.mockResolvedValue(mockBroker);

      await service.create(
        validDto,
        { 'metrics.aumGrowthYoY': '+34.2%' },
        validFiles,
      );

      expect(mockManager.save).toHaveBeenCalledWith(
        expect.any(Function),
        expect.objectContaining({ aumGrowthYoY: '+34.2%' }),
      );
    });

    it('throws ConflictException on DB unique constraint (race condition)', async () => {
      mockRepo.findOne.mockResolvedValue(null);
      mockStorageService.uploadImage.mockResolvedValue(
        'https://cdn.cloudinary.com/image.jpg',
      );
      mockDataSource.transaction.mockRejectedValue({ code: '23505' });

      await expect(service.create(validDto, {}, validFiles)).rejects.toThrow(
        ConflictException,
      );
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
    it('returns a broker by slug', async () => {
      mockQueryBuilder.getOne.mockResolvedValue(mockBroker);

      const result = await service.findOne('exness');

      expect(result).toEqual(mockBroker);
    });

    it('throws NotFoundException when broker does not exist', async () => {
      mockQueryBuilder.getOne.mockResolvedValue(null);

      await expect(service.findOne('bad-slug')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('update', () => {
    it('throws NotFoundException when broker does not exist', async () => {
      mockRepo.findOne.mockResolvedValue(null);

      await expect(
        service.update('bad-id', { name: 'X' }, {}, {}),
      ).rejects.toThrow(NotFoundException);
    });

    it('throws ConflictException when new slug is already taken', async () => {
      const otherBroker = { ...mockBroker, id: 'uuid-2', slug: 'icmarkets' };
      mockRepo.findOne
        .mockResolvedValueOnce(mockBroker)
        .mockResolvedValueOnce(otherBroker);

      await expect(
        service.update('uuid-1', { slug: 'icmarkets' }, {}, {}),
      ).rejects.toThrow(ConflictException);
    });

    it('skips slug conflict check when slug is unchanged', async () => {
      mockRepo.findOne.mockResolvedValueOnce(mockBroker);
      mockQueryBuilder.getOne.mockResolvedValue(mockBroker);

      await service.update('uuid-1', { slug: 'exness' }, {}, {});

      expect(mockRepo.findOne).toHaveBeenCalledTimes(1);
    });

    it('uploads new logo when provided', async () => {
      mockRepo.findOne.mockResolvedValueOnce(mockBroker);
      mockQueryBuilder.getOne.mockResolvedValue(mockBroker);

      await service.update('uuid-1', {}, {}, { logo: [makeFile('new-logo')] });

      expect(mockStorageService.uploadImage).toHaveBeenCalledTimes(1);
    });
  });

  describe('remove', () => {
    it('soft-deletes the broker', async () => {
      mockRepo.findOne.mockResolvedValue(mockBroker);
      mockRepo.softDelete.mockResolvedValue(undefined);

      await service.remove('uuid-1');

      expect(mockRepo.softDelete).toHaveBeenCalledWith({ id: 'uuid-1' });
    });

    it('throws NotFoundException when broker does not exist', async () => {
      mockRepo.findOne.mockResolvedValue(null);

      await expect(service.remove('bad-id')).rejects.toThrow(NotFoundException);
    });
  });
});
