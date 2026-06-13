import { registerAs } from '@nestjs/config';
import { Environment } from './env.validation';

export interface AppConfig {
  nodeEnv: Environment;
  port: number;
  apiPrefix: string;
}

export default registerAs(
  'app',
  (): AppConfig => ({
    nodeEnv: (process.env.NODE_ENV as Environment) ?? Environment.Development,
    port: parseInt(process.env.PORT ?? '3000', 10),
    apiPrefix: process.env.API_PREFIX ?? 'api/v1',
  }),
);
