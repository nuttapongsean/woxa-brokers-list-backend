import { registerAs } from '@nestjs/config';
import type { StringValue } from 'ms';

export interface JwtConfig {
  secret: string;
  accessExpiresIn: StringValue;
  refreshSecret: string;
  refreshExpiresIn: StringValue;
}

export default registerAs(
  'jwt',
  (): JwtConfig => ({
    secret: process.env.JWT_SECRET ?? '',
    accessExpiresIn: (process.env.JWT_ACCESS_EXPIRES_IN ??
      '15m') as StringValue,
    refreshSecret: process.env.JWT_REFRESH_SECRET ?? '',
    refreshExpiresIn: (process.env.JWT_REFRESH_EXPIRES_IN ??
      '1d') as StringValue,
  }),
);
