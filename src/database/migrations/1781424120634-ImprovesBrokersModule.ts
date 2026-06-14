import { MigrationInterface, QueryRunner } from "typeorm";

export class ImprovesBrokersModule1781424120634 implements MigrationInterface {
    name = 'ImprovesBrokersModule1781424120634'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "broker_features" ("id" uuid NOT NULL, "brokerId" uuid NOT NULL, "title" character varying NOT NULL, "description" text NOT NULL, "sortOrder" smallint NOT NULL DEFAULT '0', CONSTRAINT "PK_e689055108afca4f51dbb07c255" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "broker_metrics" ("brokerId" uuid NOT NULL, "aumGrowthYoY" character varying, "liquidityAccess" character varying, "liquidityAccessSub" character varying, "clientRetention" character varying, "clientRetentionPeriod" character varying, CONSTRAINT "PK_c675a0e172599a1f80ef38d90a7" PRIMARY KEY ("brokerId"))`);
        await queryRunner.query(`CREATE TABLE "broker_markets" ("brokerId" uuid NOT NULL, "forexPairs" integer NOT NULL DEFAULT '0', "indices" integer NOT NULL DEFAULT '0', "commodities" integer NOT NULL DEFAULT '0', "equities" integer NOT NULL DEFAULT '0', "sovereignBonds" integer NOT NULL DEFAULT '0', "cryptoEtps" integer NOT NULL DEFAULT '0', CONSTRAINT "PK_3ddb2ea95a777cd7612f07c67a8" PRIMARY KEY ("brokerId"))`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "agreeToTerms"`);
        await queryRunner.query(`ALTER TABLE "brokers" ADD "imageUrl" character varying`);
        await queryRunner.query(`ALTER TABLE "brokers" ADD "badge" character varying`);
        await queryRunner.query(`ALTER TABLE "brokers" ADD "tag" character varying`);
        await queryRunner.query(`ALTER TABLE "brokers" ADD "icon" character varying`);
        await queryRunner.query(`ALTER TABLE "brokers" ADD "grade" character varying`);
        await queryRunner.query(`ALTER TABLE "brokers" ADD "rating" smallint`);
        await queryRunner.query(`ALTER TABLE "brokers" ADD "prospectusUrl" character varying`);
        await queryRunner.query(`ALTER TABLE "brokers" ADD "longDescription" text`);
        await queryRunner.query(`ALTER TABLE "brokers" ADD "contactAddress" character varying`);
        await queryRunner.query(`ALTER TABLE "brokers" ADD "contactEmail" character varying`);
        await queryRunner.query(`ALTER TABLE "broker_features" ADD CONSTRAINT "FK_c420302ff0f2bddc68b0fa08d32" FOREIGN KEY ("brokerId") REFERENCES "brokers"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "broker_metrics" ADD CONSTRAINT "FK_c675a0e172599a1f80ef38d90a7" FOREIGN KEY ("brokerId") REFERENCES "brokers"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "broker_markets" ADD CONSTRAINT "FK_3ddb2ea95a777cd7612f07c67a8" FOREIGN KEY ("brokerId") REFERENCES "brokers"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "broker_markets" DROP CONSTRAINT "FK_3ddb2ea95a777cd7612f07c67a8"`);
        await queryRunner.query(`ALTER TABLE "broker_metrics" DROP CONSTRAINT "FK_c675a0e172599a1f80ef38d90a7"`);
        await queryRunner.query(`ALTER TABLE "broker_features" DROP CONSTRAINT "FK_c420302ff0f2bddc68b0fa08d32"`);
        await queryRunner.query(`ALTER TABLE "brokers" DROP COLUMN "contactEmail"`);
        await queryRunner.query(`ALTER TABLE "brokers" DROP COLUMN "contactAddress"`);
        await queryRunner.query(`ALTER TABLE "brokers" DROP COLUMN "longDescription"`);
        await queryRunner.query(`ALTER TABLE "brokers" DROP COLUMN "prospectusUrl"`);
        await queryRunner.query(`ALTER TABLE "brokers" DROP COLUMN "rating"`);
        await queryRunner.query(`ALTER TABLE "brokers" DROP COLUMN "grade"`);
        await queryRunner.query(`ALTER TABLE "brokers" DROP COLUMN "icon"`);
        await queryRunner.query(`ALTER TABLE "brokers" DROP COLUMN "tag"`);
        await queryRunner.query(`ALTER TABLE "brokers" DROP COLUMN "badge"`);
        await queryRunner.query(`ALTER TABLE "brokers" DROP COLUMN "imageUrl"`);
        await queryRunner.query(`ALTER TABLE "users" ADD "agreeToTerms" boolean NOT NULL DEFAULT false`);
        await queryRunner.query(`DROP TABLE "broker_markets"`);
        await queryRunner.query(`DROP TABLE "broker_metrics"`);
        await queryRunner.query(`DROP TABLE "broker_features"`);
    }

}
