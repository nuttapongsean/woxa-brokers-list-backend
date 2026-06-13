import { registerAs } from '@nestjs/config';

export interface SessionConfig {
  secret: string;
  resave: boolean;
  saveUninitialized: boolean;
  cookieMaxAge: number;
}

export default registerAs(
  'session',
  (): SessionConfig => ({
    secret: process.env.SESSION_SECRET ?? '',
    resave: false,
    saveUninitialized: false,
    cookieMaxAge: 24 * 60 * 60 * 1000, // 24h in ms
  }),
);
