import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { randomUUID } from 'crypto';
import { slugify } from '../../utils/slugify';
import { Broker, BrokerType } from './entities/broker.entity';
import { BrokerFeature } from './entities/broker-feature.entity';
import { BrokerMetrics } from './entities/broker-metrics.entity';
import { BrokerMarkets } from './entities/broker-markets.entity';
import { CreateBrokerDto } from './dto/create-broker.dto';
import { UpdateBrokerDto } from './dto/update-broker.dto';
import { BrokerQueryDto } from './dto/broker-query.dto';

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

@Injectable()
export class BrokersService {
  constructor(
    @InjectRepository(Broker) private readonly brokerRepo: Repository<Broker>,
    @InjectRepository(BrokerFeature) private readonly featureRepo: Repository<BrokerFeature>,
    @InjectRepository(BrokerMetrics) private readonly metricsRepo: Repository<BrokerMetrics>,
    @InjectRepository(BrokerMarkets) private readonly marketsRepo: Repository<BrokerMarkets>,
    private readonly dataSource: DataSource,
  ) {}

  async create(dto: CreateBrokerDto): Promise<Broker> {
    const slug = dto.slug ?? slugify(dto.name);
    const existing = await this.brokerRepo.findOne({ where: { slug } });
    if (existing) throw new ConflictException('common.SLUG_ALREADY_TAKEN');

    const id = randomUUID();
    const { features, metrics, markets, slug: _slug, ...rest } = dto;

    try {
      await this.dataSource.transaction(async (manager) => {
        await manager.save(Broker, { ...rest, id, slug });

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

  async findAll(query: BrokerQueryDto): Promise<PaginatedResult<Broker>> {
    const { page = 1, limit = 10, brokerType } = query;

    const [data, total] = await this.brokerRepo.findAndCount({
      where: brokerType ? { brokerType } : {},
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
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
    return broker;
  }

  private async findById(id: string): Promise<Broker> {
    const broker = await this.brokerRepo.findOne({ where: { id } });
    if (!broker) throw new NotFoundException('common.BROKER_NOT_FOUND');
    return broker;
  }

  async update(id: string, dto: UpdateBrokerDto): Promise<Broker> {
    const broker = await this.findById(id);
    const { features, metrics, markets, ...brokerFields } = dto;

    if (brokerFields.slug && brokerFields.slug !== broker.slug) {
      const conflict = await this.brokerRepo.findOne({
        where: { slug: brokerFields.slug },
      });
      if (conflict) throw new ConflictException('common.SLUG_ALREADY_TAKEN');
    }

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

    const updatedSlug = brokerFields.slug ?? broker.slug;
    return this.findOne(updatedSlug);
  }

  async remove(id: string): Promise<void> {
    await this.findById(id);
    await this.brokerRepo.softDelete({ id });
  }
}
