import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddAgreeToTermsToUsers1781422916045 implements MigrationInterface {
  name = 'AddAgreeToTermsToUsers1781422916045';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "users" ADD "agreeToTerms" boolean NOT NULL DEFAULT false`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "agreeToTerms"`);
  }
}
