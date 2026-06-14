import { MigrationInterface, QueryRunner } from "typeorm";

export class RestoreAgreeToTerms1781426548724 implements MigrationInterface {
    name = 'RestoreAgreeToTerms1781426548724'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" ADD "agreeToTerms" boolean NOT NULL DEFAULT false`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "agreeToTerms"`);
    }

}
