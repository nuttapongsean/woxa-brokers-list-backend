import {
  BadRequestException,
  ConflictException,
  HttpException,
  HttpStatus,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { randomUUID } from 'crypto';
import { slugify } from '../../utils/slugify';
import { StorageService } from '../../shared/storage/storage.service';
import { Broker, BrokerType } from './entities/broker.entity';
import { BrokerFeature } from './entities/broker-feature.entity';
import { BrokerMetrics } from './entities/broker-metrics.entity';
import { BrokerMarkets } from './entities/broker-markets.entity';
import { CreateBrokerDto } from './dto/create-broker.dto';
import { UpdateBrokerDto } from './dto/update-broker.dto';
import { BrokerQueryDto } from './dto/broker-query.dto';
import type { CreateBrokerFeatureDto } from './dto/create-broker-feature.dto';
import type { UploadedFile } from '../../shared/storage/types';

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

interface BrokerFiles {
  logo?: UploadedFile[];
  coverImage?: UploadedFile[];
  prospectus?: UploadedFile[];
}

function extractMetrics(body: Record<string, string>) {
  const m = {
    aumGrowthYoY: body['metrics.aumGrowthYoY'] || undefined,
    liquidityAccess: body['metrics.liquidityAccess'] || undefined,
    clientRetention: body['metrics.clientRetention'] || undefined,
  };
  return Object.values(m).some(Boolean) ? m : undefined;
}

function extractMarkets(body: Record<string, string>) {
  const parse = (v: string | undefined) =>
    v !== undefined ? parseInt(v, 10) : undefined;
  const m = {
    forexPairs: parse(body['markets.forexPairs']),
    indices: parse(body['markets.indices']),
    commodities: parse(body['markets.commodities']),
    equities: parse(body['markets.equities']),
    sovereignBonds: parse(body['markets.sovereignBonds']),
    cryptoEtps: parse(body['markets.cryptoEtps']),
  };
  return Object.values(m).some((v) => v !== undefined) ? m : undefined;
}

function parseFeatures(json?: string): CreateBrokerFeatureDto[] | undefined {
  if (!json) return undefined;
  try {
    return JSON.parse(json) as CreateBrokerFeatureDto[];
  } catch {
    return [];
  }
}

@Injectable()
export class BrokersService {
  constructor(
    @InjectRepository(Broker) private readonly brokerRepo: Repository<Broker>,
    private readonly dataSource: DataSource,
    private readonly storageService: StorageService,
  ) {}

  async create(
    dto: CreateBrokerDto,
    rawBody: Record<string, string>,
    files: BrokerFiles,
  ): Promise<Broker> {
    const logoFile = files?.logo?.[0];
    const coverImageFile = files?.coverImage?.[0];
    const prospectusFile = files?.prospectus?.[0];

    if (!logoFile) throw new BadRequestException('logo file is required');
    if (!coverImageFile)
      throw new BadRequestException('coverImage file is required');

    const baseSlug = slugify(dto.name);
    let slug: string;

    if (dto.slug) {
      const conflict = await this.brokerRepo.findOne({
        where: { slug: dto.slug },
      });
      if (conflict) {
        throw new HttpException(
          {
            statusCode: HttpStatus.CONFLICT,
            message: 'common.SLUG_ALREADY_TAKEN',
            suggestions: await this.findSlugSuggestions(dto.slug),
          },
          HttpStatus.CONFLICT,
        );
      }
      slug = dto.slug;
    } else {
      slug = await this.resolveAvailableSlug(baseSlug);
    }

    const [logoUrl, imageUrl, prospectusUrl] = await Promise.all([
      this.storageService.uploadImage(logoFile, 'brokers/logos'),
      this.storageService.uploadImage(coverImageFile, 'brokers/covers'),
      prospectusFile
        ? this.storageService.uploadFile(prospectusFile, 'brokers/prospectus')
        : Promise.resolve(undefined),
    ]);

    const id = randomUUID();
    const { features: featuresJson, ...rest } = dto;
    const features = parseFeatures(featuresJson);
    const metrics = extractMetrics(rawBody);
    const markets = extractMarkets(rawBody);

    try {
      await this.dataSource.transaction(async (manager) => {
        await manager.save(Broker, {
          ...rest,
          id,
          slug,
          logoUrl,
          imageUrl,
          ...(prospectusUrl ? { prospectusUrl } : {}),
        });

        if (features?.length) {
          await manager.save(
            BrokerFeature,
            features.map((f) => ({
              id: randomUUID(),
              brokerId: id,
              title: f.title,
              description: f.description,
              sortOrder: f.sortOrder ?? 0,
            })),
          );
        }

        if (metrics) {
          await manager.save(BrokerMetrics, { brokerId: id, ...metrics });
        }

        if (markets) {
          await manager.save(BrokerMarkets, { brokerId: id, ...markets });
        }
      });
    } catch (e) {
      if ((e as Record<string, unknown>).code === '23505')
        throw new ConflictException('common.SLUG_ALREADY_TAKEN');
      throw e;
    }

    return this.findOne(slug);
  }

  private async signBroker(broker: Broker): Promise<Broker> {
    const sign = (
      key: string | null | undefined,
    ): Promise<string | undefined> =>
      key
        ? this.storageService.getPresignedUrl(key)
        : Promise.resolve(undefined);

    const signed = { ...broker };
    [signed.logoUrl, signed.imageUrl, signed.prospectusUrl] = await Promise.all(
      [
        sign(broker.logoUrl) as Promise<string>,
        sign(broker.imageUrl),
        sign(broker.prospectusUrl),
      ],
    );
    return signed;
  }

  async findAll(query: BrokerQueryDto): Promise<PaginatedResult<Broker>> {
    const { page = 1, limit = 10, brokerType } = query;

    const [data, total] = await this.brokerRepo.findAndCount({
      where: brokerType ? { brokerType } : {},
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    const signed = await Promise.all(data.map((b) => this.signBroker(b)));
    return {
      data: signed,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findSlugs(): Promise<string[]> {
    const rows = await this.brokerRepo
      .createQueryBuilder('broker')
      .select('broker.slug', 'slug')
      .orderBy('broker.slug', 'ASC')
      .getRawMany<{ slug: string }>();
    return rows.map((r) => r.slug);
  }

  async findTypes(): Promise<BrokerType[]> {
    const rows = await this.brokerRepo
      .createQueryBuilder('broker')
      .select('DISTINCT broker.brokerType', 'brokerType')
      .getRawMany<{ brokerType: BrokerType }>();
    return rows.map((r) => r.brokerType);
  }

  async findOne(slug: string): Promise<Broker> {
    const broker = await this.brokerRepo
      .createQueryBuilder('broker')
      .leftJoinAndSelect('broker.features', 'features')
      .leftJoinAndSelect('broker.metrics', 'metrics')
      .leftJoinAndSelect('broker.markets', 'markets')
      .where('broker.slug = :slug', { slug })
      .orderBy('features.sortOrder', 'ASC')
      .getOne();

    if (!broker) throw new NotFoundException('common.BROKER_NOT_FOUND');
    return this.signBroker(broker);
  }

  private async findById(id: string): Promise<Broker> {
    const broker = await this.brokerRepo.findOne({ where: { id } });
    if (!broker) throw new NotFoundException('common.BROKER_NOT_FOUND');
    return broker;
  }

  async update(
    id: string,
    dto: UpdateBrokerDto,
    rawBody: Record<string, string>,
    files: BrokerFiles,
  ): Promise<Broker> {
    const broker = await this.findById(id);
    const { features: featuresJson, ...dtoBrokerFields } = dto;

    if (dtoBrokerFields.slug && dtoBrokerFields.slug !== broker.slug) {
      const conflict = await this.brokerRepo.findOne({
        where: { slug: dtoBrokerFields.slug },
      });
      if (conflict) {
        throw new HttpException(
          {
            statusCode: HttpStatus.CONFLICT,
            message: 'common.SLUG_ALREADY_TAKEN',
            suggestions: await this.findSlugSuggestions(dtoBrokerFields.slug),
          },
          HttpStatus.CONFLICT,
        );
      }
    }

    const logoFile = files?.logo?.[0];
    const coverImageFile = files?.coverImage?.[0];
    const prospectusFile = files?.prospectus?.[0];

    const [logoUrl, imageUrl, prospectusUrl] = await Promise.all([
      logoFile
        ? this.storageService.uploadImage(logoFile, 'brokers/logos')
        : Promise.resolve(undefined),
      coverImageFile
        ? this.storageService.uploadImage(coverImageFile, 'brokers/covers')
        : Promise.resolve(undefined),
      prospectusFile
        ? this.storageService.uploadFile(prospectusFile, 'brokers/prospectus')
        : Promise.resolve(undefined),
    ]);

    const brokerFields = {
      ...dtoBrokerFields,
      ...(logoUrl ? { logoUrl } : {}),
      ...(imageUrl ? { imageUrl } : {}),
      ...(prospectusUrl ? { prospectusUrl } : {}),
    };

    const hasMetrics = [
      'metrics.aumGrowthYoY',
      'metrics.liquidityAccess',
      'metrics.clientRetention',
    ].some((k) => k in rawBody);
    const hasMarkets = [
      'markets.forexPairs',
      'markets.indices',
      'markets.commodities',
      'markets.equities',
      'markets.sovereignBonds',
      'markets.cryptoEtps',
    ].some((k) => k in rawBody);

    const features =
      featuresJson !== undefined ? parseFeatures(featuresJson) : undefined;
    const metrics = hasMetrics ? extractMetrics(rawBody) : undefined;
    const markets = hasMarkets ? extractMarkets(rawBody) : undefined;

    try {
      await this.dataSource.transaction(async (manager) => {
        if (Object.keys(brokerFields).length) {
          await manager.update(Broker, { id }, brokerFields);
        }

        if (features !== undefined) {
          await manager.delete(BrokerFeature, { brokerId: id });
          if (features.length) {
            await manager.save(
              BrokerFeature,
              features.map((f) => ({
                id: randomUUID(),
                brokerId: id,
                title: f.title,
                description: f.description,
                sortOrder: f.sortOrder ?? 0,
              })),
            );
          }
        }

        if (metrics !== undefined) {
          await manager.save(BrokerMetrics, { brokerId: id, ...metrics });
        }

        if (markets !== undefined) {
          await manager.save(BrokerMarkets, { brokerId: id, ...markets });
        }
      });
    } catch (e) {
      if ((e as Record<string, unknown>).code === '23505')
        throw new ConflictException('common.SLUG_ALREADY_TAKEN');
      throw e;
    }

    const updatedSlug = dtoBrokerFields.slug ?? broker.slug;
    return this.findOne(updatedSlug);
  }

  private async resolveAvailableSlug(base: string): Promise<string> {
    const rows = await this.brokerRepo
      .createQueryBuilder('broker')
      .select('broker.slug', 'slug')
      .where('broker.slug LIKE :pattern', { pattern: `${base}%` })
      .getRawMany<{ slug: string }>();

    const taken = new Set(rows.map((r) => r.slug));
    if (!taken.has(base)) return base;

    for (let i = 2; i <= 100; i++) {
      const candidate = `${base}-${i}`;
      if (!taken.has(candidate)) return candidate;
    }

    return `${base}-${Math.floor(10000 + Math.random() * 90000)}`;
  }

  private async findSlugSuggestions(base: string): Promise<string[]> {
    const rows = await this.brokerRepo
      .createQueryBuilder('broker')
      .select('broker.slug', 'slug')
      .where('broker.slug LIKE :pattern', { pattern: `${base}%` })
      .getRawMany<{ slug: string }>();

    const taken = new Set(rows.map((r) => r.slug));
    const suggestions: string[] = [];

    for (let i = 2; suggestions.length < 3 && i <= 20; i++) {
      const candidate = `${base}-${i}`;
      if (!taken.has(candidate)) suggestions.push(candidate);
    }

    while (suggestions.length < 3) {
      const suffix = Math.floor(10000 + Math.random() * 90000).toString();
      suggestions.push(`${base}-${suffix}`);
    }

    return suggestions;
  }

  async suggestSlug(name: string): Promise<{ slug: string }> {
    if (!name?.trim()) throw new BadRequestException('Name is required');
    const base = slugify(name);
    for (let i = 0; i < 10; i++) {
      const suffix = Math.floor(10000 + Math.random() * 90000).toString();
      const slug = `${base}-${suffix}`;
      const existing = await this.brokerRepo.findOne({ where: { slug } });
      if (!existing) return { slug };
    }
    throw new InternalServerErrorException('common.SLUG_GENERATION_FAILED');
  }

  async remove(id: string): Promise<void> {
    await this.findById(id);
    await this.brokerRepo.softDelete({ id });
  }
}
