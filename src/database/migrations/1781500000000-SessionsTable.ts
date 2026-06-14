import { MigrationInterface, QueryRunner } from 'typeorm';

export class SessionsTable1781500000000 implements MigrationInterface {
  name = 'SessionsTable1781500000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "sessions" (
        "id"          uuid                NOT NULL,
        "userId"      uuid                NOT NULL,
        "tokenHash"   character varying   NOT NULL,
        "deviceInfo"  character varying,
        "expiresAt"   TIMESTAMP           NOT NULL,
        "lastUsedAt"  TIMESTAMP           NOT NULL,
        "createdAt"   TIMESTAMP           NOT NULL DEFAULT now(),
        CONSTRAINT "PK_sessions" PRIMARY KEY ("id"),
        CONSTRAINT "FK_sessions_users"
          FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(
      `CREATE INDEX "IDX_sessions_userId" ON "sessions" ("userId")`,
    );

    await queryRunner.query(
      `ALTER TABLE "users" DROP COLUMN IF EXISTS "refreshTokenHash"`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "users" ADD COLUMN "refreshTokenHash" character varying`,
    );

    await queryRunner.query(`DROP INDEX "public"."IDX_sessions_userId"`);
    await queryRunner.query(`DROP TABLE "sessions"`);
  }
}
