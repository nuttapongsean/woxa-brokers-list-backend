import { MigrationInterface, QueryRunner } from 'typeorm';

export class DefaultForeignKeys1781005904986 implements MigrationInterface {
  name = 'DefaultForeignKeys1781005904986';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "reviews" DROP CONSTRAINT "FK_7ed5659e7139fc8bc039198cc1f"`,
    );
    await queryRunner.query(
      `ALTER TABLE "reviews" DROP CONSTRAINT "FK_84e8a92e35c0a0df46210c3a1bf"`,
    );
    await queryRunner.query(
      `ALTER TABLE "reviews" ADD CONSTRAINT "FK_7ed5659e7139fc8bc039198cc1f" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "reviews" ADD CONSTRAINT "FK_84e8a92e35c0a0df46210c3a1bf" FOREIGN KEY ("brokerId") REFERENCES "brokers"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "reviews" DROP CONSTRAINT "FK_84e8a92e35c0a0df46210c3a1bf"`,
    );
    await queryRunner.query(
      `ALTER TABLE "reviews" DROP CONSTRAINT "FK_7ed5659e7139fc8bc039198cc1f"`,
    );
    await queryRunner.query(
      `ALTER TABLE "reviews" ADD CONSTRAINT "FK_84e8a92e35c0a0df46210c3a1bf" FOREIGN KEY ("brokerId") REFERENCES "brokers"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "reviews" ADD CONSTRAINT "FK_7ed5659e7139fc8bc039198cc1f" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
  }
}
