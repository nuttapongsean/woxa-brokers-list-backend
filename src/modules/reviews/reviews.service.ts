import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { randomUUID } from 'crypto';
import { Review } from './entities/review.entity';
import { CreateReviewDto } from './dto/create-review.dto';
import { UpdateReviewDto } from './dto/update-review.dto';

@Injectable()
export class ReviewsService {
  constructor(
    @InjectRepository(Review) private readonly reviewRepo: Repository<Review>,
  ) {}

  async create(userId: string, dto: CreateReviewDto): Promise<Review> {
    const existing = await this.reviewRepo.findOne({
      where: { userId, brokerId: dto.brokerId },
    });
    if (existing) throw new ConflictException('common.ALREADY_REVIEWED');

    try {
      return await this.reviewRepo.save({
        id: randomUUID(),
        userId,
        brokerId: dto.brokerId,
        rating: dto.rating,
        comment: dto.comment ?? null,
      });
    } catch (e) {
      if ((e as Record<string, unknown>).code === '23505')
        throw new ConflictException('common.ALREADY_REVIEWED');
      throw e;
    }
  }

  async findByBroker(brokerId: string): Promise<Review[]> {
    return this.reviewRepo
      .createQueryBuilder('review')
      .leftJoin('review.user', 'user')
      .addSelect(['user.id', 'user.fullName'])
      .where('review.brokerId = :brokerId', { brokerId })
      .andWhere('review.deletedAt IS NULL')
      .orderBy('review.createdAt', 'DESC')
      .getMany();
  }

  async findOne(id: string): Promise<Review> {
    const review = await this.reviewRepo
      .createQueryBuilder('review')
      .leftJoin('review.user', 'user')
      .leftJoin('review.broker', 'broker')
      .addSelect([
        'user.id',
        'user.fullName',
        'user.email',
        'user.createdAt',
        'user.updatedAt',
      ])
      .addSelect([
        'broker.id',
        'broker.name',
        'broker.slug',
        'broker.brokerType',
        'broker.logoUrl',
        'broker.website',
        'broker.description',
      ])
      .where('review.id = :id', { id })
      .andWhere('review.deletedAt IS NULL')
      .getOne();
    if (!review) throw new NotFoundException('common.REVIEW_NOT_FOUND');
    return review;
  }

  async update(
    id: string,
    userId: string,
    dto: UpdateReviewDto,
  ): Promise<Review> {
    const review = await this.findForOwnership(id);
    if (review.userId !== userId)
      throw new ForbiddenException('common.REVIEW_FORBIDDEN_EDIT');

    await this.reviewRepo.update({ id }, dto);
    return this.findOne(id);
  }

  async remove(id: string, userId: string): Promise<void> {
    const review = await this.findForOwnership(id);
    if (review.userId !== userId)
      throw new ForbiddenException('common.REVIEW_FORBIDDEN_DELETE');
    await this.reviewRepo.softDelete({ id });
  }

  private async findForOwnership(id: string): Promise<Review> {
    const review = await this.reviewRepo.findOne({ where: { id } });
    if (!review) throw new NotFoundException('common.REVIEW_NOT_FOUND');
    return review;
  }
}
