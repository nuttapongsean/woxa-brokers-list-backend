import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { existsSync, mkdirSync, readdirSync, writeFileSync } from 'fs';
import { join, resolve } from 'path';
import { AppModule } from '../app.module';

interface ModuleEntry {
  name: string;
  module: new (...args: unknown[]) => unknown;
}

function discoverModules(): ModuleEntry[] {
  const modulesDir = resolve(__dirname, '../modules');

  return readdirSync(modulesDir, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .flatMap((d) => {
      const moduleFile = join(modulesDir, d.name, `${d.name}.module`);
      if (!existsSync(`${moduleFile}.ts`)) return [];

      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const exports = require(moduleFile) as Record<string, unknown>;
      const moduleClass = Object.values(exports).find(
        (v): v is new (...args: unknown[]) => unknown =>
          typeof v === 'function' && v.name.endsWith('Module'),
      );

      return moduleClass ? [{ name: d.name, module: moduleClass }] : [];
    });
}

function baseConfig() {
  return new DocumentBuilder()
    .setTitle('Woxa Brokers List API')
    .setDescription('REST API for managing financial brokers')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
}

async function generate() {
  const app = await NestFactory.create(AppModule, { logger: false });

  const outDir = resolve(process.cwd(), 'api-spec');
  mkdirSync(outDir, { recursive: true });

  const modules = discoverModules();

  for (const { name, module } of modules) {
    const doc = SwaggerModule.createDocument(app, baseConfig(), {
      include: [module],
    });
    writeFileSync(
      resolve(outDir, `${name}.json`),
      JSON.stringify(doc, null, 2),
      'utf-8',
    );
    console.log(`  ✓ api-spec/${name}.json`);
  }

  const combined = SwaggerModule.createDocument(app, baseConfig());
  writeFileSync(
    resolve(outDir, 'openapi.json'),
    JSON.stringify(combined, null, 2),
    'utf-8',
  );
  console.log('  ✓ api-spec/openapi.json  (combined)');

  await app.close();
}

generate().catch((err: unknown) => {
  console.error(err);
  process.exit(1);
});
