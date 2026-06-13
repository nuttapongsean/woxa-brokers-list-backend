import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { randomUUID } from 'crypto';
import { slugify } from '../../utils/slugify';
import { Broker } from './entities/broker.entity';
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
  ) {}

  async create(dto: CreateBrokerDto): Promise<Broker> {
    const slug = dto.slug ?? slugify(dto.name);

    const existing = await this.brokerRepo.findOne({ where: { slug } });
    if (existing) throw new ConflictException('common.SLUG_ALREADY_TAKEN');

    try {
      return await this.brokerRepo.save({
        id: randomUUID(),
        name: dto.name,
        slug,
        description: dto.description,
        logoUrl: dto.logoUrl,
        website: dto.website,
        brokerType: dto.brokerType,
      });
    } catch (e) {
      if ((e as Record<string, unknown>).code === '23505')
        throw new ConflictException('common.SLUG_ALREADY_TAKEN');
      throw e;
    }
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

  async findOne(id: string): Promise<Broker> {
    const broker = await this.brokerRepo.findOne({ where: { id } });
    if (!broker) throw new NotFoundException('common.BROKER_NOT_FOUND');
    return broker;
  }

  async update(id: string, dto: UpdateBrokerDto): Promise<Broker> {
    const broker = await this.findOne(id);

    if (dto.slug && dto.slug !== broker.slug) {
      const conflict = await this.brokerRepo.findOne({
        where: { slug: dto.slug },
      });
      if (conflict) throw new ConflictException('common.SLUG_ALREADY_TAKEN');
    }

    try {
      await this.brokerRepo.update({ id }, dto);
    } catch (e) {
      if ((e as Record<string, unknown>).code === '23505')
        throw new ConflictException('common.SLUG_ALREADY_TAKEN');
      throw e;
    }
    return this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    await this.findOne(id);
    await this.brokerRepo.softDelete({ id });
  }
}
