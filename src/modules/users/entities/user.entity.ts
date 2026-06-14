import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  Index,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('users')
export class User {
  @PrimaryColumn('uuid')
  id!: string;

  @Column()
  fullName!: string;

  @Index({ unique: true })
  @Column({ unique: true })
  email!: string;

  @Column()
  password!: string;

  @Column({ default: false })
  agreeToTerms!: boolean;

  @Column({ nullable: true, type: 'varchar' })
  refreshTokenHash!: string | null;

  @Column({ nullable: true, type: 'varchar' })
  passwordResetTokenHash!: string | null;

  @Column({ nullable: true, type: 'timestamp' })
  passwordResetExpiresAt!: Date | null;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  @DeleteDateColumn()
  deletedAt!: Date | null;
}
