import { MigrationInterface, QueryRunner } from "typeorm";

export class InitialSchema1781004107648 implements MigrationInterface {
    name = 'InitialSchema1781004107648'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."brokers_brokertype_enum" AS ENUM('cfd', 'bond', 'stock', 'crypto')`);
        await queryRunner.query(`CREATE TABLE "brokers" ("id" uuid NOT NULL, "name" character varying NOT NULL, "slug" character varying NOT NULL, "description" text NOT NULL, "logoUrl" character varying NOT NULL, "website" character varying NOT NULL, "brokerType" "public"."brokers_brokertype_enum" NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP, CONSTRAINT "UQ_f2193c20365b3efe26a39e6dabc" UNIQUE ("slug"), CONSTRAINT "PK_b8ee0411488131f6f9d322dbe7a" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_f2193c20365b3efe26a39e6dab" ON "brokers" ("slug") `);
        await queryRunner.query(`CREATE TABLE "users" ("id" uuid NOT NULL, "fullName" character varying NOT NULL, "email" character varying NOT NULL, "password" character varying NOT NULL, "refreshTokenHash" character varying, "passwordResetTokenHash" character varying, "passwordResetExpiresAt" TIMESTAMP, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP, CONSTRAINT "UQ_97672ac88f789774dd47f7c8be3" UNIQUE ("email"), CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_97672ac88f789774dd47f7c8be" ON "users" ("email") `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "public"."IDX_97672ac88f789774dd47f7c8be"`);
        await queryRunner.query(`DROP TABLE "users"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_f2193c20365b3efe26a39e6dab"`);
        await queryRunner.query(`DROP TABLE "brokers"`);
        await queryRunner.query(`DROP TYPE "public"."brokers_brokertype_enum"`);
    }

}
