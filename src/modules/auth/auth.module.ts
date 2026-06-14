import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { JwtConfig } from '@config/jwt.config';
import { UsersModule } from '../users/users.module';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './strategies/jwt.strategy';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { SessionsService } from './sessions.service';
import { Session } from './entities/session.entity';

@Module({
  imports: [
    UsersModule,
    PassportModule,
    TypeOrmModule.forFeature([Session]),
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get<JwtConfig>('jwt')!.secret,
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    SessionsService,
    JwtStrategy,
    JwtAuthGuard,
    { provide: APP_GUARD, useClass: JwtAuthGuard },
  ],
  exports: [JwtAuthGuard, SessionsService],
})
export class AuthModule {}
