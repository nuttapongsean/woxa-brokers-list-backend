import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Session } from './entities/session.entity';

@Injectable()
export class SessionsService {
  constructor(
    @InjectRepository(Session)
    private readonly repo: Repository<Session>,
  ) {}

  create(data: {
    id: string;
    userId: string;
    tokenHash: string;
    expiresAt: Date;
    deviceInfo?: string;
  }): Promise<Session> {
    const now = new Date();
    return this.repo.save({
      id: data.id,
      userId: data.userId,
      tokenHash: data.tokenHash,
      expiresAt: data.expiresAt,
      deviceInfo: data.deviceInfo ?? null,
      lastUsedAt: now,
    });
  }

  findById(id: string): Promise<Session | null> {
    return this.repo.findOne({ where: { id } });
  }

  async rotate(id: string, newTokenHash: string): Promise<void> {
    await this.repo.update(
      { id },
      { tokenHash: newTokenHash, lastUsedAt: new Date() },
    );
  }

  async deleteById(id: string): Promise<void> {
    await this.repo.delete({ id });
  }

  async deleteAllByUserId(userId: string): Promise<void> {
    await this.repo.delete({ userId });
  }
}
