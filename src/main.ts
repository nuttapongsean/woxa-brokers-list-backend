import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { I18nValidationPipe } from 'nestjs-i18n';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { AppConfig } from './config';
import { Environment } from './config/env.validation';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const config = app.get(ConfigService);
  const appCfg = config.get<AppConfig>('app')!;

  app.use(helmet());

  const rawOrigin = process.env.CORS_ORIGIN ?? '*';
  const origins = rawOrigin.split(',').map((o) => o.trim());
  app.enableCors({
    origin: origins.length === 1 ? origins[0] : origins,
    credentials: true,
  });

  app.setGlobalPrefix(appCfg.apiPrefix);

  app.useGlobalPipes(
    new I18nValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  if (appCfg.nodeEnv !== Environment.Production) {
    const swaggerConfig = new DocumentBuilder()
      .setTitle('Woxa Brokers List API')
      .setDescription('REST API for managing financial brokers')
      .setVersion('1.0')
      .addBearerAuth()
      .build();
    const document = SwaggerModule.createDocument(app, swaggerConfig);
    SwaggerModule.setup('docs', app, document);
  }

  await app.listen(appCfg.port);
}
bootstrap().catch((err: unknown) => {
  console.error('Fatal bootstrap error:', err);
  process.exit(1);
});
