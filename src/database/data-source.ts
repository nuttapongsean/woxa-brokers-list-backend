import 'dotenv/config';
import * as path from 'path';
import { DataSource } from 'typeorm';

const ext = __filename.endsWith('.ts') ? '.ts' : '.js';

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST ?? 'localhost',
  port: parseInt(process.env.DB_PORT ?? '5432', 10),
  username: process.env.DB_USERNAME ?? '',
  password: process.env.DB_PASSWORD ?? '',
  database: process.env.DB_DATABASE ?? '',
  entities: [path.join(__dirname, `../modules/**/entities/*.entity${ext}`)],
  migrations: [path.join(__dirname, `migrations/*${ext}`)],
  synchronize: false,
});
