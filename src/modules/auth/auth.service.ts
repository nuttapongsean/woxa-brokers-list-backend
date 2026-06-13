import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { createHash, randomBytes, randomUUID } from 'crypto';
import * as bcrypt from 'bcrypt';
import { JwtConfig } from '@config/jwt.config';
import { UsersService } from '../users/users.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { AuthTokensDto } from './dto/auth-tokens.dto';

const BCRYPT_ROUNDS = 12;
const RESET_TOKEN_TTL_MS = 60 * 60 * 1000; // 1 hour

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private readonly jwtCfg: JwtConfig;

  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    configService: ConfigService,
  ) {
    this.jwtCfg = configService.get<JwtConfig>('jwt')!;
  }

  async register(dto: RegisterDto): Promise<AuthTokensDto> {
    const existing = await this.usersService.findByEmail(dto.email, true);
    if (existing) throw new ConflictException('common.EMAIL_ALREADY_EXISTS');

    const id = randomUUID();
    const password = await bcrypt.hash(dto.password, BCRYPT_ROUNDS);
    const { accessToken, refreshToken, refreshTokenHash } = this.makeTokenPair(
      id,
      dto.email,
    );

    await this.usersService.create({
      id,
      fullName: dto.fullName,
      email: dto.email,
      password,
      refreshTokenHash,
    });

    return {
      accessToken,
      refreshToken,
      user: { id, fullName: dto.fullName, email: dto.email },
    };
  }

  async login(dto: LoginDto): Promise<AuthTokensDto> {
    const user = await this.usersService.findByEmail(dto.email);
    const valid = user && (await bcrypt.compare(dto.password, user.password));
    if (!valid) throw new UnauthorizedException('common.INVALID_CREDENTIALS');

    const { accessToken, refreshToken, refreshTokenHash } = this.makeTokenPair(
      user.id,
      user.email,
    );
    await this.usersService.updateRefreshToken(user.id, refreshTokenHash);

    return {
      accessToken,
      refreshToken,
      user: { id: user.id, fullName: user.fullName, email: user.email },
    };
  }

  async logout(userId: string): Promise<void> {
    await this.usersService.updateRefreshToken(userId, null);
  }

  async refresh(dto: RefreshTokenDto): Promise<AuthTokensDto> {
    let payload: { sub: string };
    try {
      payload = this.jwtService.verify(dto.refreshToken, {
        secret: this.jwtCfg.refreshSecret,
      });
    } catch {
      throw new UnauthorizedException('common.INVALID_REFRESH_TOKEN');
    }

    const user = await this.usersService.findById(payload.sub);
    if (!user?.refreshTokenHash)
      throw new UnauthorizedException('common.INVALID_REFRESH_TOKEN');

    const incoming = createHash('sha256')
      .update(dto.refreshToken)
      .digest('hex');
    if (incoming !== user.refreshTokenHash) {
      await this.usersService.updateRefreshToken(user.id, null);
      throw new UnauthorizedException('common.INVALID_REFRESH_TOKEN');
    }

    const { accessToken, refreshToken, refreshTokenHash } = this.makeTokenPair(
      user.id,
      user.email,
    );
    await this.usersService.updateRefreshToken(user.id, refreshTokenHash);

    return {
      accessToken,
      refreshToken,
      user: { id: user.id, fullName: user.fullName, email: user.email },
    };
  }

  async forgotPassword(dto: ForgotPasswordDto): Promise<void> {
    const user = await this.usersService.findByEmail(dto.email);
    if (!user) return;

    const rawToken = randomBytes(32).toString('hex');
    const tokenHash = createHash('sha256').update(rawToken).digest('hex');
    await this.usersService.setPasswordResetToken(
      user.id,
      tokenHash,
      new Date(Date.now() + RESET_TOKEN_TTL_MS),
    );

    // DEV: log token to console. Replace this block with Nodemailer/SendGrid in production.
    this.logger.warn(`[DEV] Password reset requested for: ${user.email}`);
    this.logger.warn(`[DEV] Token: ${rawToken}`);
    this.logger.warn(
      `[DEV] POST /auth/reset-password { token, newPassword, confirmPassword }`,
    );
  }

  async resetPassword(dto: ResetPasswordDto): Promise<void> {
    if (dto.newPassword !== dto.confirmPassword) {
      throw new BadRequestException('common.PASSWORDS_DO_NOT_MATCH');
    }

    const tokenHash = createHash('sha256').update(dto.token).digest('hex');
    const user = await this.usersService.findByResetTokenHash(tokenHash);

    const expired =
      !user?.passwordResetExpiresAt || user.passwordResetExpiresAt < new Date();
    if (!user || expired)
      throw new BadRequestException('common.INVALID_RESET_TOKEN');

    await this.usersService.resetPassword(
      user.id,
      await bcrypt.hash(dto.newPassword, BCRYPT_ROUNDS),
    );
  }

  private makeTokenPair(userId: string, email: string) {
    const accessToken = this.jwtService.sign(
      { sub: userId, email },
      { secret: this.jwtCfg.secret, expiresIn: this.jwtCfg.accessExpiresIn },
    );
    const refreshToken = this.jwtService.sign(
      { sub: userId },
      {
        secret: this.jwtCfg.refreshSecret,
        expiresIn: this.jwtCfg.refreshExpiresIn,
      },
    );
    const refreshTokenHash = createHash('sha256')
      .update(refreshToken)
      .digest('hex');
    return { accessToken, refreshToken, refreshTokenHash };
  }
}
