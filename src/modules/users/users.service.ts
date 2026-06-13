import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { UserProfileDto } from './dto/user-profile.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User) private readonly userRepo: Repository<User>,
  ) {}

  findByEmail(email: string, withDeleted = false): Promise<User | null> {
    return this.userRepo.findOne({ where: { email }, withDeleted });
  }

  findById(id: string): Promise<User | null> {
    return this.userRepo.findOne({ where: { id } });
  }

  findByResetTokenHash(tokenHash: string): Promise<User | null> {
    return this.userRepo.findOne({
      where: { passwordResetTokenHash: tokenHash },
    });
  }

  create(data: {
    id: string;
    fullName: string;
    email: string;
    password: string;
    refreshTokenHash: string;
  }): Promise<User> {
    return this.userRepo.save({
      ...data,
      passwordResetTokenHash: null,
      passwordResetExpiresAt: null,
    });
  }

  async updateRefreshToken(id: string, hash: string | null): Promise<void> {
    await this.userRepo.update({ id }, { refreshTokenHash: hash });
  }

  async setPasswordResetToken(
    id: string,
    tokenHash: string,
    expiresAt: Date,
  ): Promise<void> {
    await this.userRepo.update(
      { id },
      { passwordResetTokenHash: tokenHash, passwordResetExpiresAt: expiresAt },
    );
  }

  async resetPassword(id: string, hashedPassword: string): Promise<void> {
    await this.userRepo.update(
      { id },
      {
        password: hashedPassword,
        refreshTokenHash: null,
        passwordResetTokenHash: null,
        passwordResetExpiresAt: null,
      },
    );
  }

  async getProfile(id: string): Promise<UserProfileDto> {
    const user = await this.userRepo.findOne({ where: { id } });
    if (!user) throw new NotFoundException('common.USER_NOT_FOUND');
    return {
      id: user.id,
      fullName: user.fullName,
      email: user.email,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }

  async updateProfile(
    id: string,
    dto: UpdateProfileDto,
  ): Promise<UserProfileDto> {
    await this.userRepo.update({ id }, { fullName: dto.fullName });
    return this.getProfile(id);
  }

  async softDelete(id: string): Promise<void> {
    await this.userRepo.update({ id }, { refreshTokenHash: null });
    await this.userRepo.softDelete({ id });
  }
}
